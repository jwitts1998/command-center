/**
 * Model Pricing Configuration
 *
 * Prices are in USD per 1 million tokens
 * Updated as of March 2026
 */

interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  name: string;
  provider: string;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic Models
  'claude-opus-4-20250514': {
    inputPerMillion: 15.0,
    outputPerMillion: 75.0,
    name: 'Claude Opus 4',
    provider: 'anthropic',
  },
  'claude-sonnet-4-20250514': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
  },
  'claude-3-5-sonnet-20241022': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
  },
  'claude-3-5-haiku-20241022': {
    inputPerMillion: 0.8,
    outputPerMillion: 4.0,
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
  },
  'claude-3-opus-20240229': {
    inputPerMillion: 15.0,
    outputPerMillion: 75.0,
    name: 'Claude 3 Opus',
    provider: 'anthropic',
  },
  'claude-3-sonnet-20240229': {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
  },
  'claude-3-haiku-20240307': {
    inputPerMillion: 0.25,
    outputPerMillion: 1.25,
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
  },

  // OpenAI Models (for reference)
  'gpt-4o': {
    inputPerMillion: 2.5,
    outputPerMillion: 10.0,
    name: 'GPT-4o',
    provider: 'openai',
  },
  'gpt-4o-mini': {
    inputPerMillion: 0.15,
    outputPerMillion: 0.6,
    name: 'GPT-4o Mini',
    provider: 'openai',
  },
  'gpt-4-turbo': {
    inputPerMillion: 10.0,
    outputPerMillion: 30.0,
    name: 'GPT-4 Turbo',
    provider: 'openai',
  },
  'gpt-3.5-turbo': {
    inputPerMillion: 0.5,
    outputPerMillion: 1.5,
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
  },
};

/**
 * Calculate the cost for a given model and token counts
 */
export function calculateCost(
  model: string,
  tokensInput: number,
  tokensOutput: number
): number {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    // Default to claude-sonnet-4 pricing if unknown
    console.warn(`Unknown model: ${model}, using default pricing`);
    return calculateCost('claude-sonnet-4-20250514', tokensInput, tokensOutput);
  }

  const inputCost = (tokensInput / 1_000_000) * pricing.inputPerMillion;
  const outputCost = (tokensOutput / 1_000_000) * pricing.outputPerMillion;

  return inputCost + outputCost;
}

/**
 * Get model display name
 */
export function getModelName(modelId: string): string {
  return MODEL_PRICING[modelId]?.name || modelId;
}

/**
 * Get pricing info for a model
 */
export function getModelPricing(modelId: string): ModelPricing | undefined {
  return MODEL_PRICING[modelId];
}

/**
 * Get all models for a provider
 */
export function getModelsByProvider(provider: string): Array<{ id: string } & ModelPricing> {
  return Object.entries(MODEL_PRICING)
    .filter(([_, pricing]) => pricing.provider === provider)
    .map(([id, pricing]) => ({ id, ...pricing }));
}

/**
 * Format cost for display
 */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return `$${costUsd.toFixed(6)}`;
  } else if (costUsd < 1) {
    return `$${costUsd.toFixed(4)}`;
  } else {
    return `$${costUsd.toFixed(2)}`;
  }
}
