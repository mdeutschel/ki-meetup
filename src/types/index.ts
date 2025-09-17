// Core Model Types
export interface ModelProvider {
  id: 'openai' | 'anthropic';
  name: string;
  models: ModelConfig[];
}

export interface ModelConfig {
  id: string;
  name: string;
  displayName: string;
  provider: 'openai' | 'anthropic';
  pricing: ModelPricing;
  maxTokens: number;
  supportsStreaming: boolean;
}

export interface ModelPricing {
  input: number;  // per 1K tokens
  output: number; // per 1K tokens
}

// Chat & Prompt Types
export interface ChatRequest {
  prompt: string;
  model1: string;
  model2: string;
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  tokens: TokenUsage;
  cost: number;
  finishReason: 'stop' | 'length' | 'error';
  timestamp: Date;
  error?: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

// Streaming Types
export interface StreamResponse {
  id: string;
  model: string;
  delta: string;
  tokens: TokenUsage;
  cost: number;
  isComplete: boolean;
  error?: string;
}

export interface StreamEvent {
  type: 'start' | 'token' | 'complete' | 'error';
  model: 'model1' | 'model2';
  data: StreamResponse;
}

// UI State Types
export interface ModelSelection {
  model1: string | null;
  model2: string | null;
}

export interface PromptState {
  content: string;
  isSubmitting: boolean;
  error?: string;
}

export interface ResponseState {
  model1: ChatResponse | null;
  model2: ChatResponse | null;
  isStreaming: boolean;
  totalCost: number;
}

// History Types (matching Prisma schema)
export interface PromptHistory {
  id: string;
  content: string;
  model1: string;
  model2: string;
  response1: string | null;
  response2: string | null;
  cost1: number | null;
  cost2: number | null;
  createdAt: Date;
}

// Cost Calculation Types
export interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface TotalCostBreakdown {
  model1: CostCalculation;
  model2: CostCalculation;
  total: number;
}

// Server Action Types
export interface ServerActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateChatRequest {
  prompt: string;
  model1: string;
  model2: string;
}

export interface CreateChatResponse {
  id: string;
  streamUrl: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  provider?: string;
  model?: string;
}

// Utility Types
export type ModelId = string;
export type PromptId = string;
export type StreamUrl = string;

// Component Props Types
export interface ModelSelectorProps {
  value: string | null;
  onChange: (model: string | null) => void;
  label: string;
  availableModels: ModelConfig[];
  disabled?: boolean;
}

export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string;
}

export interface ResponseDisplayProps {
  response: ChatResponse | null;
  isStreaming: boolean;
  modelConfig: ModelConfig;
  onCopy?: () => void;
}

export interface CostDisplayProps {
  calculation: CostCalculation;
  modelName: string;
  isLive?: boolean;
}

export interface HistoryPanelProps {
  history: PromptHistory[];
  onSelectPrompt: (prompt: PromptHistory) => void;
  isLoading: boolean;
}

// Theme Types (for Material-UI customization)
export interface CustomTheme {
  mode: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;
}

// Configuration Types
export interface AppConfig {
  maxPromptLength: number;
  streamingTimeout: number;
  retryAttempts: number;
  defaultModels: {
    model1: string;
    model2: string;
  };
}

// Export commonly used type combinations
export type ModelSelectionPair = [ModelConfig | null, ModelConfig | null];
export type ResponsePair = [ChatResponse | null, ChatResponse | null];
export type StreamingState = Record<'model1' | 'model2', boolean>;
