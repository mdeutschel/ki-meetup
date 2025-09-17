import { type StreamEvent, type StreamResponse } from "@/types";

export type StreamEventHandler = (event: StreamEvent) => void;

export interface StreamingClient {
  start: () => void;
  stop: () => void;
  isConnected: boolean;
}

/**
 * Client für Server-Sent Events Streaming
 */
export class SSEStreamingClient implements StreamingClient {
  private eventSource: EventSource | null = null;
  private url: string;
  private onEvent: StreamEventHandler;
  private onError: (error: Error) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  constructor(
    url: string, 
    onEvent: StreamEventHandler, 
    onError: (error: Error) => void = console.error
  ) {
    this.url = url;
    this.onEvent = onEvent;
    this.onError = onError;
  }

  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  start(): void {
    try {
      this.eventSource = new EventSource(this.url);
      
      this.eventSource.onopen = () => {
        console.log('SSE Stream connected');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const streamEvent: StreamEvent = JSON.parse(event.data);
          
          // Handle configuration errors specifically
          if (streamEvent.type === 'error' && (streamEvent.model === 'system' || streamEvent.data?.isConfigError)) {
            this.onError(new Error(`Konfigurationsfehler: ${streamEvent.data?.error || 'Unbekannter Fehler'}\n\nBitte siehe ENVIRONMENT_SETUP.md für Setup-Anweisungen.`));
            return;
          }
          
          this.onEvent(streamEvent);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          this.onError(new Error('Fehler beim Parsen der Stream-Nachricht'));
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE Connection Error. Siehe ENVIRONMENT_SETUP.md für API-Key Setup.');
        
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.handleDisconnection();
        }
      };

    } catch (error) {
      this.onError(new Error('Fehler beim Starten des Streams'));
    }
  }

  stop(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.reconnectAttempts = 0;
  }

  private handleDisconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.start();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.onError(new Error('Verbindung zum Stream verloren'));
    }
  }
}

/**
 * Hook für React Components zur Vereinfachung des SSE-Handlings
 */
export interface UseStreamingOptions {
  onStreamEvent: StreamEventHandler;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
}

export interface UseStreamingResult {
  startStream: (url: string) => void;
  stopStream: () => void;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Erstellt einen Streaming-Client (für React Hook Pattern)
 */
export function createStreamingClient(options: UseStreamingOptions): UseStreamingResult {
  let client: SSEStreamingClient | null = null;
  let error: Error | null = null;

  const startStream = (url: string) => {
    if (client) {
      client.stop();
    }

    error = null;
    
    client = new SSEStreamingClient(
      url,
      options.onStreamEvent,
      (err) => {
        error = err;
        if (options.onError) {
          options.onError(err);
        }
      }
    );

    client.start();
  };

  const stopStream = () => {
    if (client) {
      client.stop();
      client = null;
    }
    error = null;
  };

  const getIsConnected = () => client?.isConnected || false;

  return {
    startStream,
    stopStream,
    get isConnected() { return getIsConnected(); },
    error,
  };
}

/**
 * Utility-Funktionen für Stream-Event-Handling
 */
export const StreamUtils = {
  /**
   * Erstellt einen Event-Handler für Model-spezifische Events
   */
  createModelEventHandler: (
    modelKey: 'model1' | 'model2',
    onToken: (delta: string, tokens: any, cost: number) => void,
    onComplete: (finalContent: string, tokens: any, cost: number) => void,
    onError: (error: string) => void
  ): StreamEventHandler => {
    return (event: StreamEvent) => {
      if (event.model !== modelKey) return;

      switch (event.type) {
        case 'start':
          console.log(`${modelKey} stream started`);
          break;

        case 'token':
          onToken(event.data.delta || '', event.data.tokens || { input: 0, output: 0, total: 0 }, event.data.cost || 0);
          break;

        case 'complete':
          onComplete('', event.data.tokens || { input: 0, output: 0, total: 0 }, event.data.cost || 0);
          break;

        case 'error':
          onError(event.data.error || 'Unbekannter Fehler');
          break;
      }
    };
  },

  /**
   * Kombiniert Handler für beide Models
   */
  createDualModelHandler: (
    model1Handler: StreamEventHandler,
    model2Handler: StreamEventHandler
  ): StreamEventHandler => {
    return (event: StreamEvent) => {
      if (event.model === 'model1') {
        model1Handler(event);
      } else if (event.model === 'model2') {
        model2Handler(event);
      }
    };
  },

  /**
   * Erstellt einen Debugging-Handler
   */
  createDebugHandler: (): StreamEventHandler => {
    return (event: StreamEvent) => {
      console.log(`[SSE] ${event.type} from ${event.model}:`, event.data);
    };
  },

  /**
   * Validiert Stream-Event-Format
   */
  validateStreamEvent: (event: any): event is StreamEvent => {
    return (
      event &&
      typeof event === 'object' &&
      ['start', 'token', 'complete', 'error'].includes(event.type) &&
      ['model1', 'model2'].includes(event.model) &&
      event.data &&
      typeof event.data === 'object'
    );
  }
};

/**
 * Timeout-Handler für lange Streams
 */
export class StreamTimeout {
  private timeoutId: NodeJS.Timeout | null = null;
  private duration: number;
  private onTimeout: () => void;

  constructor(duration: number, onTimeout: () => void) {
    this.duration = duration;
    this.onTimeout = onTimeout;
  }

  start(): void {
    this.clear();
    this.timeoutId = setTimeout(this.onTimeout, this.duration);
  }

  reset(): void {
    this.start();
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Stream-State-Manager für komplexe UI-States
 */
export interface StreamState {
  model1: {
    content: string;
    isStreaming: boolean;
    tokens: { input: number; output: number; total: number };
    cost: number;
    error: string | null;
  };
  model2: {
    content: string;
    isStreaming: boolean;
    tokens: { input: number; output: number; total: number };
    cost: number;
    error: string | null;
  };
  totalCost: number;
  isAnyStreaming: boolean;
}

export const createInitialStreamState = (): StreamState => ({
  model1: {
    content: '',
    isStreaming: false,
    tokens: { input: 0, output: 0, total: 0 },
    cost: 0,
    error: null,
  },
  model2: {
    content: '',
    isStreaming: false,
    tokens: { input: 0, output: 0, total: 0 },
    cost: 0,
    error: null,
  },
  totalCost: 0,
  isAnyStreaming: false,
});

export const updateStreamState = (
  state: StreamState,
  event: StreamEvent
): StreamState => {
  const modelKey = event.model;
  
  // Skip system messages in state updates - they're handled elsewhere
  if (modelKey === 'system') {
    return state;
  }
  
  const newState = { ...state };

  switch (event.type) {
    case 'start':
      newState[modelKey] = {
        ...newState[modelKey],
        isStreaming: true,
        error: null,
        content: '',
      };
      break;

    case 'token':
      newState[modelKey] = {
        ...newState[modelKey],
        content: newState[modelKey].content + (event.data.delta || ''),
        tokens: event.data.tokens || { input: 0, output: 0, total: 0 },
        cost: event.data.cost || 0,
      };
      break;

    case 'complete':
      newState[modelKey] = {
        ...newState[modelKey],
        isStreaming: false,
        tokens: event.data.tokens || { input: 0, output: 0, total: 0 },
        cost: event.data.cost || 0,
      };
      break;

    case 'error':
      newState[modelKey] = {
        ...newState[modelKey],
        isStreaming: false,
        error: event.data.error || 'Unbekannter Fehler',
      };
      break;
  }

  // Update derived states
  newState.isAnyStreaming = newState.model1.isStreaming || newState.model2.isStreaming;
  newState.totalCost = newState.model1.cost + newState.model2.cost;

  return newState;
};
