import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { type ModelConfig, type ModelProvider } from "@/types";

// Model Factory für OpenAI Models
export const createOpenAIModel = (modelName: string) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY ist nicht gesetzt. Bitte füge deinen API-Key in .env.local hinzu.');
  }
  
  return new ChatOpenAI({
    model: modelName,
    streaming: true,
    openAIApiKey: process.env.OPENAI_API_KEY,
    maxTokens: 4000, // Set reasonable default, models can handle more if needed
    temperature: 0.7,
  });
};

// Model Factory für Anthropic Models
export const createAnthropicModel = (modelName: string) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY ist nicht gesetzt. Bitte füge deinen API-Key in .env.local hinzu.');
  }
  
  return new ChatAnthropic({
    model: modelName,
    streaming: true,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    maxTokens: 4000, // Anthropic requires positive value, set reasonable default
    temperature: 0.7,
  });
};

// Verfügbare OpenAI Models (Preise basierend auf aktueller OpenAI API Dokumentation)
export const OPENAI_MODELS: ModelConfig[] = [
  {
    id: "gpt-4o",
    name: "gpt-4o",
    displayName: "GPT-4o",
    provider: "openai",
    pricing: { input: 0.005, output: 0.015 }, // USD per 1K tokens
    maxTokens: 128000,
    supportsStreaming: true,
  },
  {
    id: "gpt-4o-mini",
    name: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    provider: "openai",
    pricing: { input: 0.00015, output: 0.0006 }, // $0.15/$0.60 per 1M tokens
    maxTokens: 128000,
    supportsStreaming: true,
  },
  {
    id: "gpt-4-turbo",
    name: "gpt-4-turbo",
    displayName: "GPT-4 Turbo",
    provider: "openai",
    pricing: { input: 0.01, output: 0.03 },
    maxTokens: 128000,
    supportsStreaming: true,
  },
  {
    id: "gpt-3.5-turbo",
    name: "gpt-3.5-turbo",
    displayName: "GPT-3.5 Turbo",
    provider: "openai",
    pricing: { input: 0.0015, output: 0.002 },
    maxTokens: 16385,
    supportsStreaming: true,
  },
];

// Verfügbare Anthropic Models (Preise von https://claude.com/pricing#api)
export const ANTHROPIC_MODELS: ModelConfig[] = [
  {
    id: "claude-3-5-sonnet-20241022",
    name: "claude-3-5-sonnet-20241022",
    displayName: "Claude 3.5 Sonnet",
    provider: "anthropic",
    pricing: { input: 0.003, output: 0.015 }, // $3/$15 per 1M tokens (≤200K)
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "claude-3-5-haiku-20241022", 
    displayName: "Claude 3.5 Haiku",
    provider: "anthropic",
    pricing: { input: 0.0008, output: 0.004 }, // $0.80/$4 per 1M tokens
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: "claude-3-opus-20240229",
    name: "claude-3-opus-20240229",
    displayName: "Claude 3 Opus",
    provider: "anthropic",
    pricing: { input: 0.015, output: 0.075 }, // $15/$75 per 1M tokens
    maxTokens: 200000,
    supportsStreaming: true,
  },
];

// Model Providers Configuration
export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    models: OPENAI_MODELS,
  },
  {
    id: "anthropic", 
    name: "Anthropic",
    models: ANTHROPIC_MODELS,
  },
];

// Alle verfügbaren Models
export const ALL_MODELS: ModelConfig[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
];

// Helper: Model Config by ID finden
export const getModelConfig = (modelId: string): ModelConfig | null => {
  return ALL_MODELS.find(model => model.id === modelId) || null;
};

// Helper: Model Instance erstellen
export const createModelInstance = (modelId: string) => {
  const config = getModelConfig(modelId);
  if (!config) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  switch (config.provider) {
    case "openai":
      return createOpenAIModel(config.name);
    case "anthropic":
      return createAnthropicModel(config.name);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
};

// Helper: Model Provider ermitteln
export const getModelProvider = (modelId: string): ModelProvider | null => {
  const config = getModelConfig(modelId);
  if (!config) return null;
  
  return MODEL_PROVIDERS.find(provider => provider.id === config.provider) || null;
};

// Helper: Default Models für UI
export const DEFAULT_MODELS = {
  model1: "gpt-4o-mini",
  model2: "claude-3-5-haiku-20241022",
};

// Token Usage Parsing für verschiedene Providers
export const parseTokenUsage = (usage: any, provider: string) => {
  switch (provider) {
    case "openai":
      return {
        input: usage?.prompt_tokens || 0,
        output: usage?.completion_tokens || 0,
        total: usage?.total_tokens || 0,
      };
    case "anthropic":
      return {
        input: usage?.input_tokens || 0,
        output: usage?.output_tokens || 0,
        total: (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
      };
    default:
      return { input: 0, output: 0, total: 0 };
  }
};

// Validierung ob Model verfügbar ist
export const isModelAvailable = (modelId: string): boolean => {
  return getModelConfig(modelId) !== null;
};

// Filter Models by Provider
export const getModelsByProvider = (providerId: string): ModelConfig[] => {
  return ALL_MODELS.filter(model => model.provider === providerId);
};
