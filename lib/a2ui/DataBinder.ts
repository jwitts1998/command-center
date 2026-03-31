// DataBinder - Handles live data binding for widgets

import { Widget, DataBinding, DataSource } from '@/types/widget';
import { buildFetchUrl } from './WidgetRegistry';

// Cache for fetched data
const dataCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Get cache key for a data source
function getCacheKey(source: DataSource): string {
  if (source.type === 'static') {
    return `static:${JSON.stringify(source.staticData)}`;
  }
  if (source.type === 'context') {
    return `context:${source.contextKey}`;
  }
  return `api:${source.endpoint}:${source.method || 'GET'}:${JSON.stringify(source.params || {})}`;
}

// Check if cached data is still valid
function isCacheValid(key: string): boolean {
  const cached = dataCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
}

// Fetch data from an API endpoint
async function fetchApiData(source: DataSource): Promise<unknown> {
  if (!source.endpoint) {
    throw new Error('API data source must have an endpoint');
  }

  const method = source.method || 'GET';
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let url = source.endpoint;

  if (source.params) {
    if (method === 'GET') {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(source.params)) {
        searchParams.append(key, String(value));
      }
      url = `${url}?${searchParams.toString()}`;
    } else {
      options.body = JSON.stringify(source.params);
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status}`);
  }

  return response.json();
}

// Get data from context
function getContextData(
  contextKey: string,
  context: Record<string, unknown>
): unknown {
  // Support dot notation for nested access
  const keys = contextKey.split('.');
  let value: unknown = context;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'object') {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

// Apply a path to extract nested data
function applyPath(data: unknown, path: string | undefined): unknown {
  if (!path) return data;

  const keys = path.split('.');
  let value = data;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'object') {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

// Apply a transform function to data
function applyTransform(data: unknown, transform: string | undefined): unknown {
  if (!transform) return data;

  // Simple built-in transforms
  switch (transform) {
    case 'count':
      return Array.isArray(data) ? data.length : 1;

    case 'first':
      return Array.isArray(data) ? data[0] : data;

    case 'last':
      return Array.isArray(data) ? data[data.length - 1] : data;

    case 'reverse':
      return Array.isArray(data) ? [...data].reverse() : data;

    case 'sort':
      return Array.isArray(data) ? [...data].sort() : data;

    case 'stringify':
      return JSON.stringify(data);

    case 'uppercase':
      return typeof data === 'string' ? data.toUpperCase() : data;

    case 'lowercase':
      return typeof data === 'string' ? data.toLowerCase() : data;

    default:
      // Try to evaluate as a simple expression
      // This is limited for security - only allows basic operations
      console.warn(`Unknown transform: ${transform}`);
      return data;
  }
}

// Main data binding function
export async function bindData(
  binding: DataBinding,
  context?: Record<string, unknown>
): Promise<unknown> {
  const { source, path, transform } = binding;
  let data: unknown;

  const cacheKey = getCacheKey(source);

  // Check cache first
  if (isCacheValid(cacheKey)) {
    data = dataCache.get(cacheKey)!.data;
  } else {
    // Fetch fresh data
    switch (source.type) {
      case 'static':
        data = source.staticData;
        break;

      case 'context':
        if (!source.contextKey || !context) {
          data = undefined;
        } else {
          data = getContextData(source.contextKey, context);
        }
        break;

      case 'api':
        data = await fetchApiData(source);
        break;

      default:
        throw new Error(`Unknown data source type: ${(source as any).type}`);
    }

    // Cache the result
    dataCache.set(cacheKey, { data, timestamp: Date.now() });
  }

  // Apply path extraction
  data = applyPath(data, path);

  // Apply transform
  data = applyTransform(data, transform);

  return data;
}

// Bind data to a widget (mutates the widget props)
export async function bindWidgetData(
  widget: Widget,
  context?: Record<string, unknown>
): Promise<Widget> {
  if (!widget.dataBinding) {
    return widget;
  }

  const boundData = await bindData(widget.dataBinding, context);

  // Merge bound data into props
  return {
    ...widget,
    props: {
      ...widget.props,
      data: boundData,
    },
  };
}

// Bind data to a domain widget (fetch entity by ID)
export async function bindDomainWidgetData(widget: Widget): Promise<Widget> {
  const fetchUrl = buildFetchUrl(widget);
  if (!fetchUrl) {
    return widget;
  }

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      console.error(`Failed to fetch data for widget ${widget.id}: ${response.status}`);
      return widget;
    }

    const data = await response.json();
    return {
      ...widget,
      props: {
        ...widget.props,
        data,
      },
    };
  } catch (error) {
    console.error(`Error fetching data for widget ${widget.id}:`, error);
    return widget;
  }
}

// Clear the data cache
export function clearDataCache(): void {
  dataCache.clear();
}

// Set up a refresh interval for a widget
export function setupRefreshInterval(
  widget: Widget,
  onRefresh: (data: unknown) => void,
  context?: Record<string, unknown>
): (() => void) | null {
  const interval = widget.dataBinding?.refreshInterval;
  if (!interval || !widget.dataBinding) {
    return null;
  }

  const timerId = setInterval(async () => {
    try {
      // Clear cache to force fresh fetch
      const cacheKey = getCacheKey(widget.dataBinding!.source);
      dataCache.delete(cacheKey);

      const data = await bindData(widget.dataBinding!, context);
      onRefresh(data);
    } catch (error) {
      console.error(`Error refreshing widget ${widget.id}:`, error);
    }
  }, interval);

  // Return cleanup function
  return () => clearInterval(timerId);
}
