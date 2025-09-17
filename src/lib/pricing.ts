import { type TokenUsage, type CostCalculation, type ModelConfig } from "@/types";
import { getModelConfig } from "./models";
import { countTokens } from "./tokenizer";

// Aktuelle Model-Preise (Stand September 2024)
// Preise sind in USD per 1K Tokens
// OpenAI: https://openai.com/api/pricing/
// Anthropic: https://claude.com/pricing#api
export const MODEL_PRICING = {
  openai: {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 }, // $3/$15 per 1M tokens
    'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 }, // $0.80/$4 per 1M tokens  
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 }, // $15/$75 per 1M tokens
  },
} as const;

/**
 * Berechnet die Kosten für Token-Usage bei einem spezifischen Model
 */
export function calculateCost(
  tokenUsage: TokenUsage,
  modelId: string
): CostCalculation {
  const modelConfig = getModelConfig(modelId);
  
  if (!modelConfig) {
    throw new Error(`Unknown model for cost calculation: ${modelId}`);
  }

  const pricing = modelConfig.pricing;
  
  // Konvertiere Tokens zu Kosten (Pricing ist per 1K tokens)
  const inputCost = (tokenUsage.input / 1000) * pricing.input;
  const outputCost = (tokenUsage.output / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputTokens: tokenUsage.input,
    outputTokens: tokenUsage.output,
    inputCost: parseFloat(inputCost.toFixed(6)),
    outputCost: parseFloat(outputCost.toFixed(6)),
    totalCost: parseFloat(totalCost.toFixed(6)),
  };
}

/**
 * Berechnet die Live-Kosten während Streaming
 */
export function calculateLiveCost(
  inputTokens: number,
  outputTokens: number,
  modelId: string
): number {
  const tokenUsage: TokenUsage = {
    input: inputTokens,
    output: outputTokens,
    total: inputTokens + outputTokens,
  };
  
  return calculateCost(tokenUsage, modelId).totalCost;
}

/**
 * Formatiert Kosten für UI-Anzeige
 */
export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.001) return '<$0.001';
  if (cost < 0.01) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Formatiert Token-Anzahl für UI-Anzeige
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(1)}M`;
}

/**
 * Berechnet geschätzte Kosten für einen Prompt mit tiktoken
 */
export function estimatePromptCost(
  promptText: string,
  modelId: string,
  estimatedResponseTokens: number = 500
): CostCalculation {
  // Präzise Token-Zählung mit tiktoken
  const inputTokens = countTokens(promptText, modelId);
  
  const tokenUsage: TokenUsage = {
    input: inputTokens,
    output: estimatedResponseTokens,
    total: inputTokens + estimatedResponseTokens,
  };
  
  return calculateCost(tokenUsage, modelId);
}

/**
 * Vergleicht Kosten zwischen zwei Models
 */
export function compareCosts(
  tokenUsage: TokenUsage,
  model1Id: string,
  model2Id: string
): {
  model1: CostCalculation;
  model2: CostCalculation;
  difference: number;
  cheaper: string;
} {
  const cost1 = calculateCost(tokenUsage, model1Id);
  const cost2 = calculateCost(tokenUsage, model2Id);
  const difference = Math.abs(cost1.totalCost - cost2.totalCost);
  const cheaper = cost1.totalCost < cost2.totalCost ? model1Id : model2Id;
  
  return {
    model1: cost1,
    model2: cost2,
    difference: parseFloat(difference.toFixed(6)),
    cheaper,
  };
}

/**
 * Erstellt Kosten-Breakdown für UI
 */
export function createCostBreakdown(
  model1Usage: TokenUsage,
  model2Usage: TokenUsage,
  model1Id: string,
  model2Id: string
) {
  const model1Cost = calculateCost(model1Usage, model1Id);
  const model2Cost = calculateCost(model2Usage, model2Id);
  const totalCost = model1Cost.totalCost + model2Cost.totalCost;
  
  return {
    model1: model1Cost,
    model2: model2Cost,
    total: parseFloat(totalCost.toFixed(6)),
    breakdown: {
      totalInputTokens: model1Usage.input + model2Usage.input,
      totalOutputTokens: model1Usage.output + model2Usage.output,
      totalInputCost: model1Cost.inputCost + model2Cost.inputCost,
      totalOutputCost: model1Cost.outputCost + model2Cost.outputCost,
    },
  };
}

/**
 * Validiert ob Model-Pricing verfügbar ist
 */
export function hasValidPricing(modelId: string): boolean {
  const config = getModelConfig(modelId);
  return config !== null && config.pricing.input > 0 && config.pricing.output > 0;
}

/**
 * Holt Pricing-Info für ein Model
 */
export function getPricingInfo(modelId: string) {
  const config = getModelConfig(modelId);
  if (!config) return null;
  
  return {
    modelId,
    displayName: config.displayName,
    provider: config.provider,
    inputPrice: config.pricing.input,
    outputPrice: config.pricing.output,
    formattedInputPrice: `$${config.pricing.input}/1K tokens`,
    formattedOutputPrice: `$${config.pricing.output}/1K tokens`,
  };
}

/**
 * Export für Pricing-Konstanten (für Tests und Validierung)
 */
export { MODEL_PRICING as PRICING_DATA };
