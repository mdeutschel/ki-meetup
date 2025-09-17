import { PrismaClient } from "@prisma/client";
import { type PromptHistory, type ServerActionResult } from "@/types";

const prisma = new PrismaClient();

/**
 * Erweiterte History-Utilities
 */

/**
 * Lädt History mit Paginierung
 */
export async function getPromptHistoryPaginated(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<ServerActionResult<{ items: PromptHistory[]; total: number; hasMore: boolean }>> {
  try {
    const offset = (page - 1) * limit;
    
    const whereClause = search 
      ? {
          OR: [
            { content: { contains: search } },
            { response1: { contains: search } },
            { response2: { contains: search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.prompt.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.prompt.count({ where: whereClause }),
    ]);

    const hasMore = offset + items.length < total;

    return {
      success: true,
      data: {
        items: items.map(item => ({
          ...item,
          createdAt: item.createdAt,
        })),
        total,
        hasMore,
      },
    };
  } catch (error) {
    console.error('Fehler beim Laden der History:', error);
    return {
      success: false,
      error: 'Fehler beim Laden der Historie',
    };
  }
}

/**
 * Sucht in der History
 */
export async function searchHistory(
  query: string,
  limit: number = 50
): Promise<ServerActionResult<PromptHistory[]>> {
  try {
    if (!query.trim()) {
      return { success: true, data: [] };
    }

    const results = await prisma.prompt.findMany({
      where: {
        OR: [
          { content: { contains: query } },
          { response1: { contains: query } },
          { response2: { contains: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      success: true,
      data: results.map(item => ({
        ...item,
        createdAt: item.createdAt,
      })),
    };
  } catch (error) {
    console.error('Fehler bei der Suche:', error);
    return {
      success: false,
      error: 'Fehler bei der Suche',
    };
  }
}

/**
 * Lädt einen spezifischen History-Eintrag
 */
export async function getPromptById(id: string): Promise<ServerActionResult<PromptHistory>> {
  try {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      return {
        success: false,
        error: 'Prompt nicht gefunden',
      };
    }

    return {
      success: true,
      data: {
        ...prompt,
        createdAt: prompt.createdAt,
      },
    };
  } catch (error) {
    console.error('Fehler beim Laden des Prompts:', error);
    return {
      success: false,
      error: 'Fehler beim Laden des Prompts',
    };
  }
}

/**
 * Löscht mehrere History-Einträge
 */
export async function deleteMultipleHistoryItems(
  ids: string[]
): Promise<ServerActionResult<number>> {
  try {
    const result = await prisma.prompt.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      success: true,
      data: result.count,
    };
  } catch (error) {
    console.error('Fehler beim Löschen der Einträge:', error);
    return {
      success: false,
      error: 'Fehler beim Löschen der Einträge',
    };
  }
}

/**
 * Holt Statistics zur History
 */
export async function getHistoryStatistics(): Promise<ServerActionResult<{
  totalPrompts: number;
  totalCost: number;
  averageCost: number;
  mostUsedModels: { model: string; count: number }[];
  totalTokens: number;
}>> {
  try {
    const [
      totalPrompts,
      allPrompts,
    ] = await Promise.all([
      prisma.prompt.count(),
      prisma.prompt.findMany({
        select: {
          cost1: true,
          cost2: true,
          model1: true,
          model2: true,
        },
      }),
    ]);

    // Kosten-Berechnungen
    let totalCost = 0;
    const modelUsage: Record<string, number> = {};

    allPrompts.forEach(prompt => {
      if (prompt.cost1) totalCost += prompt.cost1;
      if (prompt.cost2) totalCost += prompt.cost2;
      
      modelUsage[prompt.model1] = (modelUsage[prompt.model1] || 0) + 1;
      modelUsage[prompt.model2] = (modelUsage[prompt.model2] || 0) + 1;
    });

    const averageCost = totalPrompts > 0 ? totalCost / totalPrompts : 0;

    // Meist genutzte Models
    const mostUsedModels = Object.entries(modelUsage)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      success: true,
      data: {
        totalPrompts,
        totalCost: parseFloat(totalCost.toFixed(6)),
        averageCost: parseFloat(averageCost.toFixed(6)),
        mostUsedModels,
        totalTokens: 0, // TODO: Token-Tracking hinzufügen wenn verfügbar
      },
    };
  } catch (error) {
    console.error('Fehler beim Laden der Statistiken:', error);
    return {
      success: false,
      error: 'Fehler beim Laden der Statistiken',
    };
  }
}

/**
 * Exportiert History als JSON
 */
export async function exportHistory(
  format: 'json' | 'csv' = 'json'
): Promise<ServerActionResult<string>> {
  try {
    const history = await prisma.prompt.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'json') {
      return {
        success: true,
        data: JSON.stringify(history, null, 2),
      };
    }

    if (format === 'csv') {
      const headers = 'ID,Created,Prompt,Model1,Model2,Response1,Response2,Cost1,Cost2\n';
      const rows = history.map(item => {
        const row = [
          item.id,
          item.createdAt.toISOString(),
          `"${item.content.replace(/"/g, '""')}"`,
          item.model1,
          item.model2,
          `"${(item.response1 || '').replace(/"/g, '""')}"`,
          `"${(item.response2 || '').replace(/"/g, '""')}"`,
          item.cost1 || 0,
          item.cost2 || 0,
        ].join(',');
        return row;
      }).join('\n');

      return {
        success: true,
        data: headers + rows,
      };
    }

    return {
      success: false,
      error: 'Unbekanntes Export-Format',
    };
  } catch (error) {
    console.error('Fehler beim Export:', error);
    return {
      success: false,
      error: 'Fehler beim Export',
    };
  }
}

/**
 * Bereinigt Geschichte basierend auf verschiedenen Kriterien
 */
export async function cleanupHistory(options: {
  olderThanDays?: number;
  keepCount?: number;
  removeErrors?: boolean;
}): Promise<ServerActionResult<number>> {
  try {
    const conditions: any[] = [];

    if (options.olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.olderThanDays);
      conditions.push({ createdAt: { lt: cutoffDate } });
    }

    if (options.removeErrors) {
      conditions.push({
        AND: [
          { response1: null },
          { response2: null },
        ],
      });
    }

    if (options.keepCount && !options.olderThanDays && !options.removeErrors) {
      // Finde IDs der ältesten Einträge, die gelöscht werden sollen
      const allPrompts = await prisma.prompt.findMany({
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });

      if (allPrompts.length > options.keepCount) {
        const toDelete = allPrompts.slice(options.keepCount);
        const result = await prisma.prompt.deleteMany({
          where: {
            id: { in: toDelete.map(p => p.id) },
          },
        });
        return { success: true, data: result.count };
      }
      
      return { success: true, data: 0 };
    }

    if (conditions.length === 0) {
      return { success: true, data: 0 };
    }

    const result = await prisma.prompt.deleteMany({
      where: { OR: conditions },
    });

    return {
      success: true,
      data: result.count,
    };
  } catch (error) {
    console.error('Fehler beim Bereinigen:', error);
    return {
      success: false,
      error: 'Fehler beim Bereinigen der Historie',
    };
  }
}

/**
 * Favoriten-Feature (erfordert Schema-Update)
 */
export async function toggleFavorite(id: string): Promise<ServerActionResult<boolean>> {
  try {
    // Note: Dies erfordert ein "isFavorite" Feld im Schema
    // Für jetzt als Platzhalter implementiert
    console.log(`Favoriten-Toggle für ${id} - Feature noch nicht implementiert`);
    
    return {
      success: false,
      error: 'Favoriten-Feature erfordert Schema-Update',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Fehler beim Setzen des Favoriten',
    };
  }
}
