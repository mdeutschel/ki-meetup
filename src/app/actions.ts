'use server';

import { HumanMessage } from "@langchain/core/messages";
import { createModelInstance, getModelConfig, parseTokenUsage } from "@/lib/models";
import { calculateCost } from "@/lib/pricing";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { 
  type ChatRequest, 
  type ChatResponse, 
  type ServerActionResult,
  type CreateChatRequest,
  type CreateChatResponse,
  type PromptHistory 
} from "@/types";

const prisma = new PrismaClient();

/**
 * Server Action für parallele Model-Anfragen (ohne Streaming)
 */
export async function createParallelChat(
  request: CreateChatRequest
): Promise<ServerActionResult<{ response1: ChatResponse; response2: ChatResponse }>> {
  try {
    // Validierung
    if (!request.prompt.trim()) {
      return { success: false, error: "Prompt darf nicht leer sein" };
    }

    if (!request.model1 || !request.model2) {
      return { success: false, error: "Beide Modelle müssen ausgewählt werden" };
    }

    const model1Config = getModelConfig(request.model1);
    const model2Config = getModelConfig(request.model2);

    if (!model1Config || !model2Config) {
      return { success: false, error: "Ungültige Model-Auswahl" };
    }

    // Parallele Model-Instanzen erstellen
    const model1Instance = createModelInstance(request.model1);
    const model2Instance = createModelInstance(request.model2);

    const message = new HumanMessage(request.prompt);

    // Parallele Ausführung
    const [result1, result2] = await Promise.allSettled([
      model1Instance.invoke([message]),
      model2Instance.invoke([message])
    ]);

    // Responses verarbeiten
    const response1 = processModelResult(result1, request.model1, model1Config);
    const response2 = processModelResult(result2, request.model2, model2Config);

    // In Datenbank speichern
    await saveToDatabase(request, response1, response2);

    return {
      success: true,
      data: { response1, response2 }
    };

  } catch (error) {
    console.error('Fehler bei paralleler Chat-Anfrage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    };
  }
}

/**
 * Verarbeitet das Ergebnis einer Model-Anfrage
 */
function processModelResult(
  result: PromiseSettledResult<any>,
  modelId: string,
  modelConfig: any
): ChatResponse {
  const baseResponse: ChatResponse = {
    id: crypto.randomUUID(),
    model: modelId,
    content: '',
    tokens: { input: 0, output: 0, total: 0 },
    cost: 0,
    finishReason: 'error',
    timestamp: new Date(),
  };

  if (result.status === 'rejected') {
    return {
      ...baseResponse,
      error: `Fehler bei ${modelConfig.displayName}: ${result.reason?.message || 'Unbekannter Fehler'}`,
    };
  }

  try {
    const response = result.value;
    const content = response.content || response.text || '';
    
    // Token Usage extrahieren (LangChain Response Format)
    const usage = response.usage_metadata || response.usage || {};
    const tokenUsage = parseTokenUsage(usage, modelConfig.provider);
    
    const cost = calculateCost(tokenUsage, modelId);

    return {
      ...baseResponse,
      content,
      tokens: tokenUsage,
      cost: cost.totalCost,
      finishReason: response.response_metadata?.finish_reason || 'stop',
    };

  } catch (error) {
    return {
      ...baseResponse,
      error: `Fehler beim Verarbeiten der Antwort: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
    };
  }
}

/**
 * Speichert Chat-Verlauf in der Datenbank
 */
async function saveToDatabase(
  request: CreateChatRequest,
  response1: ChatResponse,
  response2: ChatResponse
): Promise<void> {
  try {
    await prisma.prompt.create({
      data: {
        content: request.prompt,
        model1: request.model1,
        model2: request.model2,
        response1: response1.error ? null : response1.content,
        response2: response2.error ? null : response2.content,
        cost1: response1.error ? null : response1.cost,
        cost2: response2.error ? null : response2.cost,
      },
    });
  } catch (error) {
    console.error('Fehler beim Speichern in Datenbank:', error);
    // Fehler beim Speichern sollte nicht die ganze Anfrage scheitern lassen
  }
}

/**
 * Lädt die Prompt-Historie
 */
export async function getPromptHistory(): Promise<ServerActionResult<PromptHistory[]>> {
  try {
    const history = await prisma.prompt.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Limitiere auf 50 neueste Einträge
    });

    return {
      success: true,
      data: history.map(item => ({
        ...item,
        createdAt: item.createdAt,
      })),
    };
  } catch (error) {
    console.error('Fehler beim Laden der Historie:', error);
    return {
      success: false,
      error: 'Fehler beim Laden der Historie',
    };
  }
}

/**
 * Löscht einen Historie-Eintrag
 */
export async function deletePromptHistoryItem(id: string): Promise<ServerActionResult<void>> {
  try {
    await prisma.prompt.delete({
      where: { id },
    });

    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Löschen des Historie-Eintrags:', error);
    return {
      success: false,
      error: 'Fehler beim Löschen des Eintrags',
    };
  }
}

/**
 * Startet eine Streaming-Chat-Session (gibt Stream-URL zurück)
 */
export async function createStreamingChat(
  request: CreateChatRequest
): Promise<ServerActionResult<CreateChatResponse>> {
  try {
    // Validierung
    if (!request.prompt.trim()) {
      return { success: false, error: "Prompt darf nicht leer sein" };
    }

    if (!request.model1 || !request.model2) {
      return { success: false, error: "Beide Modelle müssen ausgewählt werden" };
    }

    // Eindeutige Session-ID generieren
    const sessionId = crypto.randomUUID();
    
    // Stream-URL erstellen
    const streamUrl = `/api/chat/stream?session=${sessionId}&model1=${request.model1}&model2=${request.model2}&prompt=${encodeURIComponent(request.prompt)}`;

    return {
      success: true,
      data: {
        id: sessionId,
        streamUrl,
      },
    };

  } catch (error) {
    console.error('Fehler beim Erstellen der Streaming-Session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    };
  }
}

/**
 * Utility: Bereinigt alte Historie-Einträge (kann als Cron-Job verwendet werden)
 */
export async function cleanupOldHistory(daysOld: number = 30): Promise<ServerActionResult<number>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.prompt.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      success: true,
      data: result.count,
    };
  } catch (error) {
    console.error('Fehler beim Bereinigen der Historie:', error);
    return {
      success: false,
      error: 'Fehler beim Bereinigen der Historie',
    };
  }
}
