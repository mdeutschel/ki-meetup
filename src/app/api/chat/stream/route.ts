import { NextRequest } from 'next/server';
import { HumanMessage } from "@langchain/core/messages";
import { createModelInstance, getModelConfig, parseTokenUsage } from "@/lib/models";
import { calculateLiveCost } from "@/lib/pricing";
import { PrismaClient } from "@prisma/client";
import { type StreamEvent, type StreamResponse } from "@/types";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session');
  const model1Id = searchParams.get('model1');
  const model2Id = searchParams.get('model2');
  const prompt = searchParams.get('prompt');

  // Validierung
  if (!sessionId || !model1Id || !model2Id || !prompt) {
    return new Response('Fehlende Parameter', { status: 400 });
  }

  const model1Config = getModelConfig(model1Id);
  const model2Config = getModelConfig(model2Id);

  if (!model1Config || !model2Config) {
    return new Response('Ungültige Model-IDs', { status: 400 });
  }

  // TextEncoder für Streaming
  const encoder = new TextEncoder();

  // Hilfsfunktion zum Senden von Events
  const sendEvent = (controller: ReadableStreamDefaultController, event: StreamEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    controller.enqueue(encoder.encode(data));
  };

  // ReadableStream für SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Models initialisieren
        const model1Instance = createModelInstance(model1Id);
        const model2Instance = createModelInstance(model2Id);

        const message = new HumanMessage(prompt);

        // Track Token-Counts für Live-Kosten
        let model1InputTokens = 0;
        let model1OutputTokens = 0;
        let model2InputTokens = 0;
        let model2OutputTokens = 0;

        // Start-Events senden
        sendEvent(controller, {
          type: 'start',
          model: 'model1',
          data: {
            id: sessionId,
            model: model1Id,
            delta: '',
            tokens: { input: 0, output: 0, total: 0 },
            cost: 0,
            isComplete: false,
          }
        });

        sendEvent(controller, {
          type: 'start',
          model: 'model2',
          data: {
            id: sessionId,
            model: model2Id,
            delta: '',
            tokens: { input: 0, output: 0, total: 0 },
            cost: 0,
            isComplete: false,
          }
        });

        // Parallele Streams starten
        const model1Promise = streamModel(
          model1Instance,
          message,
          model1Id,
          'model1',
          controller,
          sendEvent,
          sessionId
        );

        const model2Promise = streamModel(
          model2Instance,
          message,
          model2Id,
          'model2',
          controller,
          sendEvent,
          sessionId
        );

        // Warten auf beide Streams
        const [result1, result2] = await Promise.allSettled([
          model1Promise,
          model2Promise
        ]);

        // Resultate in Datenbank speichern
        await saveStreamResults(prompt, model1Id, model2Id, result1, result2);

        // Stream beenden
        controller.close();

      } catch (error) {
        console.error('Streaming error:', error);
        
        // Error-Event senden
        sendEvent(controller, {
          type: 'error',
          model: 'model1',
          data: {
            id: sessionId,
            model: model1Id,
            delta: '',
            tokens: { input: 0, output: 0, total: 0 },
            cost: 0,
            isComplete: true,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler',
          }
        });

        controller.close();
      }
    },
  });

  // SSE Response Headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

/**
 * Streamt ein einzelnes Model
 */
async function streamModel(
  modelInstance: any,
  message: HumanMessage,
  modelId: string,
  modelKey: 'model1' | 'model2',
  controller: ReadableStreamDefaultController,
  sendEvent: Function,
  sessionId: string
): Promise<{ content: string; tokens: any; cost: number }> {
  
  let fullContent = '';
  let tokenCount = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    // Stream starten
    const stream = await modelInstance.stream([message]);

    for await (const chunk of stream) {
      const delta = chunk.content || chunk.text || '';
      
      if (delta) {
        fullContent += delta;
        tokenCount++;
        outputTokens++;

        // Live-Kosten berechnen (Schätzung basierend auf bisherigen Tokens)
        const liveCost = calculateLiveCost(inputTokens, outputTokens, modelId);

        // Token-Event senden
        sendEvent(controller, {
          type: 'token',
          model: modelKey,
          data: {
            id: sessionId,
            model: modelId,
            delta,
            tokens: { 
              input: inputTokens, 
              output: outputTokens, 
              total: inputTokens + outputTokens 
            },
            cost: liveCost,
            isComplete: false,
          }
        });
      }
    }

    // Finale Token-Usage aus der Antwort extrahieren (falls verfügbar)
    const finalUsage = { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens };
    const finalCost = calculateLiveCost(inputTokens, outputTokens, modelId);

    // Complete-Event senden
    sendEvent(controller, {
      type: 'complete',
      model: modelKey,
      data: {
        id: sessionId,
        model: modelId,
        delta: '',
        tokens: finalUsage,
        cost: finalCost,
        isComplete: true,
      }
    });

    return {
      content: fullContent,
      tokens: finalUsage,
      cost: finalCost,
    };

  } catch (error) {
    console.error(`Streaming error for ${modelId}:`, error);
    
    // Error-Event senden
    sendEvent(controller, {
      type: 'error',
      model: modelKey,
      data: {
        id: sessionId,
        model: modelId,
        delta: '',
        tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
        cost: calculateLiveCost(inputTokens, outputTokens, modelId),
        isComplete: true,
        error: error instanceof Error ? error.message : 'Streaming-Fehler',
      }
    });

    throw error;
  }
}

/**
 * Speichert Stream-Resultate in der Datenbank
 */
async function saveStreamResults(
  prompt: string,
  model1Id: string,
  model2Id: string,
  result1: PromiseSettledResult<any>,
  result2: PromiseSettledResult<any>
) {
  try {
    const response1 = result1.status === 'fulfilled' ? result1.value.content : null;
    const response2 = result2.status === 'fulfilled' ? result2.value.content : null;
    const cost1 = result1.status === 'fulfilled' ? result1.value.cost : null;
    const cost2 = result2.status === 'fulfilled' ? result2.value.cost : null;

    await prisma.prompt.create({
      data: {
        content: prompt,
        model1: model1Id,
        model2: model2Id,
        response1,
        response2,
        cost1,
        cost2,
      },
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Stream-Resultate:', error);
  }
}

// POST Handler für CORS Preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
