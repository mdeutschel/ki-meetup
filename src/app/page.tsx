'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Stack, Alert, Snackbar } from '@mui/material';
import { AppLayout, PageHeader } from '@/components/ui/AppLayout';
import { DualModelSelector, ModelComparison } from '@/components/ModelSelector';
import { PromptInputWithTemplates } from '@/components/PromptInput';
import { DualResponseDisplay } from '@/components/ResponseDisplay';
import { DualCostDisplay, SessionCostTracker } from '@/components/CostDisplay';
import HistoryPanel from '@/components/HistoryPanel';
import { createStreamingChat, getPromptHistory } from '@/app/actions';
import { createStreamingClient, createInitialStreamState, updateStreamState } from '@/lib/streaming';
import { getModelConfig, DEFAULT_MODELS } from '@/lib/models';
import { calculateCost } from '@/lib/pricing';
import { type ChatResponse, type PromptHistory, type StreamEvent } from '@/types';

export default function Home() {
  // State Management
  const [selectedModels, setSelectedModels] = useState<{
    model1: string | null;
    model2: string | null;
  }>({
    model1: DEFAULT_MODELS.model1,
    model2: DEFAULT_MODELS.model2,
  });

  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamState, setStreamState] = useState(createInitialStreamState());
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sessionCosts, setSessionCosts] = useState<Array<{ modelName: string; cost: number; timestamp: Date }>>([]);
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const streamingClientRef = useRef<ReturnType<typeof createStreamingClient> | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const result = await getPromptHistory();
      if (result.success && result.data) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle streaming events
  const handleStreamEvent = (event: StreamEvent) => {
    setStreamState(prevState => {
      const newState = updateStreamState(prevState, event);
      
      // Check if both models are complete after this update
      if (event.type === 'complete') {
        const model1Complete = event.model === 'model1' || !newState.model1.isStreaming;
        const model2Complete = event.model === 'model2' || !newState.model2.isStreaming;
        
        if (model1Complete && model2Complete && !newState.isAnyStreaming) {
          // Both models completed - stop streaming and show success
          setTimeout(() => {
            if (streamingClientRef.current) {
              streamingClientRef.current.stopStream();
              streamingClientRef.current = null;
            }
            setIsSubmitting(false);
            loadHistory();
            setNotification({
              message: 'Vergleich erfolgreich abgeschlossen!',
              severity: 'success'
            });
          }, 100); // Small delay to ensure state is updated
        }
      }
      
      return newState;
    });

    // Track costs when streaming completes
    if (event.type === 'complete' && event.data.model && typeof event.data.cost === 'number') {
      const modelConfig = getModelConfig(event.data.model);
      if (modelConfig) {
        setSessionCosts(prev => [...prev, {
          modelName: modelConfig.displayName,
          cost: event.data.cost as number, // Type assertion since we checked above
          timestamp: new Date(),
        }]);
      }
    }
  };

  // Submit prompt for processing
  const handleSubmit = async () => {
    if (!prompt.trim() || !selectedModels.model1 || !selectedModels.model2) {
      setNotification({
        message: 'Bitte wähle beide Modelle aus und gib einen Prompt ein.',
        severity: 'error'
      });
      return;
    }

    // Stop any existing streaming
    if (streamingClientRef.current) {
      streamingClientRef.current.stopStream();
    }

    setIsSubmitting(true);
    setStreamState(createInitialStreamState());

    try {
      // Create streaming session
      const result = await createStreamingChat({
        prompt: prompt.trim(),
        model1: selectedModels.model1,
        model2: selectedModels.model2,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create streaming session');
      }

      // Start streaming
      const streamingClient = createStreamingClient({
        onStreamEvent: handleStreamEvent,
        onError: (error) => {
          setNotification({
            message: `Streaming-Fehler: ${error.message}`,
            severity: 'error'
          });
          setIsSubmitting(false);
          streamingClientRef.current = null;
        }
      });

      streamingClientRef.current = streamingClient;
      streamingClient.startStream(result.data.streamUrl);

      // Note: Auto-completion will be handled by the stream event handlers
      // No need for polling-based completion checking

    } catch (error) {
      setNotification({
        message: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        severity: 'error'
      });
      setIsSubmitting(false);
    }
  };

  // Handle history selection
  const handleHistorySelect = (historyItem: PromptHistory) => {
    setPrompt(historyItem.content);
    setSelectedModels({
      model1: historyItem.model1,
      model2: historyItem.model2,
    });
    
    setNotification({
      message: 'Prompt aus Historie geladen.',
      severity: 'info'
    });
  };

  // Handle copy responses
  const handleCopy = (content: string, modelName: string) => {
    setNotification({
      message: `${modelName} Antwort in Zwischenablage kopiert.`,
      severity: 'success'
    });
  };

  // Get model configs for displays
  const model1Config = selectedModels.model1 ? getModelConfig(selectedModels.model1) : null;
  const model2Config = selectedModels.model2 ? getModelConfig(selectedModels.model2) : null;

  // Create cost calculations
  const cost1 = model1Config && streamState.model1.tokens && selectedModels.model1 ? 
    calculateCost(streamState.model1.tokens, selectedModels.model1) : null;
  const cost2 = model2Config && streamState.model2.tokens && selectedModels.model2 ? 
    calculateCost(streamState.model2.tokens, selectedModels.model2) : null;

  return (
    <AppLayout>
      <PageHeader
        title="KI Model Arena"
        subtitle="Vergleiche AI-Modelle in Echtzeit mit Live-Streaming und Kostenanalyse"
      />

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Main Content */}
        <Box sx={{ flex: { lg: '1 1 75%' }, width: '100%' }}>
          <Stack spacing={3}>
            {/* Model Selection */}
            <DualModelSelector
              model1={selectedModels.model1}
              model2={selectedModels.model2}
              onModel1Change={(model) => setSelectedModels(prev => ({ ...prev, model1: model }))}
              onModel2Change={(model) => setSelectedModels(prev => ({ ...prev, model2: model }))}
              disabled={isSubmitting}
            />

            {/* Model Comparison */}
            <ModelComparison
              model1Id={selectedModels.model1}
              model2Id={selectedModels.model2}
            />

            {/* Prompt Input */}
            <PromptInputWithTemplates
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={undefined}
            />

            {/* Response Display */}
            {(streamState.model1.content || streamState.model2.content || streamState.isAnyStreaming) && (
              <DualResponseDisplay
                response1={streamState.model1.content ? {
                  id: 'model1',
                  model: selectedModels.model1!,
                  content: streamState.model1.content,
                  tokens: streamState.model1.tokens,
                  cost: streamState.model1.cost,
                  finishReason: 'stop',
                  timestamp: new Date(),
                  error: streamState.model1.error || undefined,
                } as ChatResponse : null}
                response2={streamState.model2.content ? {
                  id: 'model2',
                  model: selectedModels.model2!,
                  content: streamState.model2.content,
                  tokens: streamState.model2.tokens,
                  cost: streamState.model2.cost,
                  finishReason: 'stop',
                  timestamp: new Date(),
                  error: streamState.model2.error || undefined,
                } as ChatResponse : null}
                isStreaming1={streamState.model1.isStreaming}
                isStreaming2={streamState.model2.isStreaming}
                model1Config={model1Config!}
                model2Config={model2Config!}
                onCopy1={() => handleCopy(streamState.model1.content, model1Config?.displayName || 'Model 1')}
                onCopy2={() => handleCopy(streamState.model2.content, model2Config?.displayName || 'Model 2')}
              />
            )}

            {/* Cost Display */}
            {cost1 && cost2 && (
              <DualCostDisplay
                cost1={cost1}
                cost2={cost2}
                model1Name={model1Config?.displayName || 'Model 1'}
                model2Name={model2Config?.displayName || 'Model 2'}
                isLive={streamState.isAnyStreaming}
              />
            )}

            {/* Session Cost Tracker */}
            {sessionCosts.length > 0 && (
              <SessionCostTracker
                sessionCosts={sessionCosts}
                onReset={() => setSessionCosts([])}
              />
            )}
          </Stack>
        </Box>

        {/* Sidebar */}
        <Box sx={{ flex: { lg: '0 0 25%' }, width: '100%', minWidth: 300 }}>
          <HistoryPanel
            history={history}
            onSelectPrompt={handleHistorySelect}
            isLoading={isLoadingHistory}
          />
        </Box>
      </Stack>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(null)} 
          severity={notification?.severity || 'info'}
          variant="filled"
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
}
