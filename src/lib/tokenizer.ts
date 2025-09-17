// src/lib/tokenizer.ts
import { type TokenUsage } from '@/types';

/**
 * Improved token estimation based on model type
 * This provides better accuracy than simple word counting while remaining compatible
 */

// Token estimation constants based on empirical data
const TOKEN_ESTIMATION = {
  // OpenAI models (GPT-4, GPT-3.5) use roughly these ratios
  OPENAI_CHARS_PER_TOKEN: 4,
  OPENAI_WORDS_TO_TOKENS: 1.33, // ~1.33 tokens per word on average
  
  // Anthropic models (Claude) are similar but slightly different
  ANTHROPIC_CHARS_PER_TOKEN: 3.8,
  ANTHROPIC_WORDS_TO_TOKENS: 1.25,
  
  // Fallback for unknown models
  DEFAULT_CHARS_PER_TOKEN: 4,
  DEFAULT_WORDS_TO_TOKENS: 1.3,
};

/**
 * Count tokens for OpenAI models using improved estimation
 */
export function countOpenAITokens(text: string, modelName: string): number {
  if (!text.trim()) return 0;
  
  // Use character-based estimation as it's more accurate for GPT models
  const cleanText = text.trim();
  return Math.ceil(cleanText.length / TOKEN_ESTIMATION.OPENAI_CHARS_PER_TOKEN);
}

/**
 * Count tokens for Anthropic models
 */
export function countAnthropicTokens(text: string, modelName: string): number {
  if (!text.trim()) return 0;
  
  const cleanText = text.trim();
  return Math.ceil(cleanText.length / TOKEN_ESTIMATION.ANTHROPIC_CHARS_PER_TOKEN);
}

/**
 * Count tokens for any model based on provider
 */
export function countTokens(text: string, modelId: string): number {
  if (!text) return 0;
  
  // Determine provider from model ID
  if (modelId.startsWith('gpt-') || modelId.includes('openai')) {
    return countOpenAITokens(text, modelId);
  } else if (modelId.startsWith('claude-') || modelId.includes('anthropic')) {
    return countAnthropicTokens(text, modelId);
  } else {
    // Fallback estimation
    const cleanText = text.trim();
    return Math.ceil(cleanText.length / TOKEN_ESTIMATION.DEFAULT_CHARS_PER_TOKEN);
  }
}

/**
 * Create TokenUsage object with estimated counts
 */
export function createTokenUsage(input: string, output: string, modelId: string): TokenUsage {
  const inputTokens = countTokens(input, modelId);
  const outputTokens = countTokens(output, modelId);
  
  return {
    input: inputTokens,
    output: outputTokens,
    total: inputTokens + outputTokens,
  };
}

/**
 * Estimate tokens for cost calculation before API call
 */
export function estimateInputTokens(prompt: string, modelId: string): number {
  return countTokens(prompt, modelId);
}

/**
 * Update token usage with new output chunk
 */
export function updateTokenUsage(
  currentUsage: TokenUsage, 
  newOutputChunk: string, 
  modelId: string
): TokenUsage {
  const additionalOutputTokens = countTokens(newOutputChunk, modelId);
  
  return {
    input: currentUsage.input, // Input tokens don't change
    output: currentUsage.output + additionalOutputTokens,
    total: currentUsage.input + currentUsage.output + additionalOutputTokens,
  };
}

/**
 * Batch count tokens for multiple texts
 */
export function batchCountTokens(texts: string[], modelId: string): number[] {
  return texts.map(text => countTokens(text, modelId));
}

/**
 * Get approximate token count for UI display (fast, reasonably accurate)
 */
export function getApproximateTokenCount(text: string): number {
  if (!text.trim()) return 0;
  
  // Quick word-based estimation for real-time UI updates
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.ceil(words.length * TOKEN_ESTIMATION.DEFAULT_WORDS_TO_TOKENS);
}

/**
 * More accurate character-based estimation for final calculations
 */
export function getCharacterBasedTokenCount(text: string, modelId?: string): number {
  if (!text.trim()) return 0;
  
  const cleanText = text.trim();
  
  if (modelId?.startsWith('gpt-')) {
    return Math.ceil(cleanText.length / TOKEN_ESTIMATION.OPENAI_CHARS_PER_TOKEN);
  } else if (modelId?.startsWith('claude-')) {
    return Math.ceil(cleanText.length / TOKEN_ESTIMATION.ANTHROPIC_CHARS_PER_TOKEN);
  } else {
    return Math.ceil(cleanText.length / TOKEN_ESTIMATION.DEFAULT_CHARS_PER_TOKEN);
  }
}

/**
 * Estimate token count range (min/max) for a given text
 */
export function estimateTokenRange(text: string, modelId: string): { min: number; max: number; estimate: number } {
  const estimate = countTokens(text, modelId);
  
  // Token counts can vary by ±20% depending on text complexity
  const variance = 0.2;
  const min = Math.floor(estimate * (1 - variance));
  const max = Math.ceil(estimate * (1 + variance));
  
  return { min, max, estimate };
}

/**
 * Check if text exceeds model's token limit
 */
export function exceedsTokenLimit(text: string, modelId: string, maxTokens: number): boolean {
  const tokenCount = countTokens(text, modelId);
  return tokenCount > maxTokens;
}

/**
 * Truncate text to fit within token limit
 */
export function truncateToTokenLimit(text: string, modelId: string, maxTokens: number): string {
  const currentTokens = countTokens(text, modelId);
  
  if (currentTokens <= maxTokens) {
    return text;
  }
  
  // Estimate how much text to keep (with 10% safety margin)
  const ratio = (maxTokens * 0.9) / currentTokens;
  const targetLength = Math.floor(text.length * ratio);
  
  return text.substring(0, targetLength) + '...';
}