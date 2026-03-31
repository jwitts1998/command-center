// IntentClassifier - Classifies user messages into intents

import type {
  IntentCategory,
  IntentEntity,
  ParsedIntent,
} from '@/types/chat';

// Patterns for quick intent detection (before calling AI)
const INTENT_PATTERNS: {
  category: IntentCategory;
  patterns: RegExp[];
  action: string;
}[] = [
  // Navigation
  {
    category: 'navigation',
    patterns: [
      /^(?:go to|show|open|navigate to|view)\s+(dashboard|home|goals?|tasks?|agents?|approvals?|teams?|activity|runs?)/i,
      /^(?:take me to|bring up)\s+(\w+)/i,
    ],
    action: 'navigate',
  },
  // Query - listing
  {
    category: 'query',
    patterns: [
      /^(?:list|show|get|what are|find)\s+(?:my|all|the)?\s*(pending|active|completed)?\s*(goals?|tasks?|agents?|approvals?|teams?)/i,
      /^(?:how many)\s+(\w+)/i,
    ],
    action: 'list',
  },
  // Query - status
  {
    category: 'query',
    patterns: [
      /^(?:what(?:'s| is)?|check)\s+(?:the\s+)?status\s+(?:of\s+)?(.+)/i,
      /^status\s+(?:of\s+)?(.+)/i,
    ],
    action: 'status',
  },
  // Action - create goal
  {
    category: 'action',
    patterns: [
      /^(?:create|add|new)\s+(?:a\s+)?goal(?:\s*:\s*|\s+)(.+)/i,
      /^(?:i want to|let's)\s+(?:create|add)\s+(?:a\s+)?goal/i,
    ],
    action: 'create_goal',
  },
  // Action - create task
  {
    category: 'action',
    patterns: [
      /^(?:create|add|new)\s+(?:a\s+)?task(?:\s*:\s*|\s+)(.+)/i,
    ],
    action: 'create_task',
  },
  // Action - approve
  {
    category: 'action',
    patterns: [
      /^(?:approve)\s+(?:request\s+)?(?:#?\s*)?([a-f0-9-]+|\d+)/i,
      /^(?:approve)\s+(?:the\s+)?(.+)/i,
    ],
    action: 'approve',
  },
  // Action - reject
  {
    category: 'action',
    patterns: [
      /^(?:reject|deny)\s+(?:request\s+)?(?:#?\s*)?([a-f0-9-]+|\d+)/i,
      /^(?:reject|deny)\s+(?:the\s+)?(.+)/i,
    ],
    action: 'reject',
  },
  // Workflow - decompose
  {
    category: 'workflow',
    patterns: [
      /^(?:decompose|break down|split)\s+(?:goal\s+)?(?:#?\s*)?([a-f0-9-]+)?/i,
      /^(?:decompose|break down|split)\s+(?:this\s+)?goal/i,
    ],
    action: 'decompose_goal',
  },
  // Workflow - assign
  {
    category: 'workflow',
    patterns: [
      /^(?:assign)\s+(?:task\s+)?(.+?)\s+to\s+(?:agent\s+)?(.+)/i,
      /^(?:route)\s+(?:task\s+)?(.+?)\s+to\s+(.+)/i,
    ],
    action: 'assign_task',
  },
  // Config
  {
    category: 'config',
    patterns: [
      /^(?:set|update|change)\s+(?:agent\s+)?budget/i,
      /^(?:configure|update)\s+(?:approval\s+)?policy/i,
    ],
    action: 'configure',
  },
];

// Entity patterns for extraction
const ENTITY_PATTERNS: {
  type: IntentEntity['type'];
  pattern: RegExp;
  extractId?: boolean;
}[] = [
  // UUID pattern
  {
    type: 'goal',
    pattern: /goal\s+(?:#?\s*)?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    extractId: true,
  },
  {
    type: 'task',
    pattern: /task\s+(?:#?\s*)?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    extractId: true,
  },
  {
    type: 'agent',
    pattern: /(?:agent\s+)?@(\w+)/i,
    extractId: false, // This is a slug, not an ID
  },
  {
    type: 'approval',
    pattern: /(?:approval|request)\s+(?:#?\s*)?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    extractId: true,
  },
  {
    type: 'team',
    pattern: /team\s+(?:#?\s*)?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    extractId: true,
  },
  // Number pattern
  {
    type: 'number',
    pattern: /\$?([\d,]+(?:\.\d{2})?)/,
  },
  // Date patterns
  {
    type: 'date',
    pattern: /(\d{4}-\d{2}-\d{2})/,
  },
  {
    type: 'date',
    pattern: /(today|tomorrow|next week|this month)/i,
  },
];

// Quick pattern-based classification
export function classifyQuick(text: string): ParsedIntent | null {
  const normalizedText = text.trim();

  for (const { category, patterns, action } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const entities = extractEntities(normalizedText);
        return {
          category,
          action,
          entities,
          confidence: 0.7, // Pattern match confidence
          rawText: normalizedText,
        };
      }
    }
  }

  return null;
}

// Extract entities from text
export function extractEntities(text: string): IntentEntity[] {
  const entities: IntentEntity[] = [];

  for (const { type, pattern, extractId } of ENTITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      entities.push({
        type,
        value: match[1],
        id: extractId ? match[1] : undefined,
        rawMatch: match[0],
      });
    }
  }

  return entities;
}

// Check if text is a simple greeting/chitchat
export function isChitchat(text: string): boolean {
  const chitchatPatterns = [
    /^(?:hi|hello|hey|yo|greetings)/i,
    /^(?:how are you|what's up|sup|howdy)/i,
    /^(?:thanks|thank you|thx)/i,
    /^(?:bye|goodbye|see you|later)/i,
    /^(?:ok|okay|sure|alright|got it)/i,
    /^(?:yes|no|yeah|nope|yep)/i,
  ];

  const normalized = text.trim();
  return chitchatPatterns.some((p) => p.test(normalized));
}

// Check if text is a question about capabilities
export function isCapabilityQuestion(text: string): boolean {
  const patterns = [
    /^(?:what can you|can you|are you able to|do you)/i,
    /^(?:help|help me)/i,
    /^(?:how do i|how can i)/i,
  ];

  return patterns.some((p) => p.test(text.trim()));
}

// Full intent classification (call this when quick classification fails)
export function classify(text: string): ParsedIntent {
  // Try quick pattern matching first
  const quickResult = classifyQuick(text);
  if (quickResult) {
    return quickResult;
  }

  // Check for chitchat
  if (isChitchat(text)) {
    return {
      category: 'conversation',
      action: 'chitchat',
      entities: [],
      confidence: 0.9,
      rawText: text,
    };
  }

  // Check for capability questions
  if (isCapabilityQuestion(text)) {
    return {
      category: 'conversation',
      action: 'help',
      entities: [],
      confidence: 0.8,
      rawText: text,
    };
  }

  // Extract any entities we can find
  const entities = extractEntities(text);

  // Try to infer intent from entities
  if (entities.length > 0) {
    const entityType = entities[0].type;
    return {
      category: 'query',
      action: `get_${entityType}`,
      entities,
      confidence: 0.5,
      rawText: text,
    };
  }

  // Fallback to unknown
  return {
    category: 'unknown',
    action: 'unknown',
    entities: [],
    confidence: 0.1,
    rawText: text,
  };
}

// Build context string for AI from parsed intent
export function buildIntentContext(intent: ParsedIntent): string {
  const parts: string[] = [];

  parts.push(`User Intent: ${intent.category} / ${intent.action}`);

  if (intent.entities.length > 0) {
    parts.push('Entities:');
    for (const entity of intent.entities) {
      parts.push(`  - ${entity.type}: ${entity.value}${entity.id ? ` (ID: ${entity.id})` : ''}`);
    }
  }

  return parts.join('\n');
}

// Map intent to suggested tools
export function getIntentTools(intent: ParsedIntent): string[] {
  const toolMap: Record<string, string[]> = {
    // Navigation
    'navigation:navigate': ['render_widget'],

    // Query
    'query:list': ['list_goals', 'list_tasks', 'list_agents', 'list_approvals', 'render_widget'],
    'query:status': ['get_goal', 'get_task', 'get_agent', 'render_widget'],

    // Actions
    'action:create_goal': ['create_goal', 'render_widget'],
    'action:create_task': ['create_task', 'render_widget'],
    'action:approve': ['approve_request', 'render_widget'],
    'action:reject': ['reject_request', 'render_widget'],

    // Workflow
    'workflow:decompose_goal': ['decompose_goal', 'render_widget'],
    'workflow:assign_task': ['assign_task', 'render_widget'],

    // Config
    'config:configure': ['render_widget'],

    // Conversation
    'conversation:chitchat': [],
    'conversation:help': [],
  };

  const key = `${intent.category}:${intent.action}`;
  return toolMap[key] || [];
}
