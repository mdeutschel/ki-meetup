# KI-Modell-Arena App - 2025-09-17 16:52
- Datum: 2025-09-17

## Context & Objective
**Goal**: Entwicklung einer vollständigen KI-Modell-Arena Web-App, die parallele Anfragen an OpenAI und Anthropic Modelle ermöglicht, mit Live-Streaming und transparenter Kostendarstellung.

**Success Criteria**: Funktionierende Web-App mit 2-Modell-Vergleich, Token-by-Token Streaming, Live-Kostenberechnung und persistenter Prompt-Historie.

**Constraints**: 
- Keine direkten Anbieter-SDKs verwenden, nur LangChain-Abstraktion
- SQLite für lokale Entwicklung ausreichend
- Server-Sent Events für Streaming (kein WebSocket)

**Dependencies**: 
- OpenAI API Key (vorhanden)
- Anthropic API Key (vorhanden)
- Next.js 15, LangChain, Prisma, Material-UI v7
- Aktuelle Modellpreise von OpenAI und Anthropic

## Architecture Decision
**Approach**: Next.js 15 App Router mit Server Actions für Backend-Logik, LangChain für Multi-Model-Orchestrierung, SSE für Real-time Streaming, Prisma/SQLite für Datenpersistierung.

**Alternatives Considered**: 
- Express.js Backend (abgelehnt: Next.js Server Actions sind ausreichend)
- WebSocket Streaming (abgelehnt: SSE ist einfacher für unidirektionale Streams)
- PostgreSQL (abgelehnt: SQLite für Prototyp ausreichend)

**Trade-offs**: 
- Optimierung für Entwicklungsgeschwindigkeit vs. Enterprise-Skalierbarkeit
- Einfache lokale SQLite vs. verteilte Datenbank
- Server Actions vs. separate API Routes

## Implementation Steps

### Phase 1: Foundation & Setup
- [ ] **Step 1.1**: Next.js 15 Projekt Setup mit App Router
  - Input: Leeres Verzeichnis
  - Action: `npx create-next-app@15 ki-model-arena --typescript --tailwind --app --src-dir --import-alias "@/*"`
  - Output: Funktionierendes Next.js 15 Grundgerüst
  - Validation: `npm run dev` startet ohne Fehler
  - Rollback: Ordner löschen und neu beginnen

- [ ] **Step 1.2**: Core Dependencies Installation
  - Input: Next.js Projekt
  - Action: Installation von Prisma, LangChain, Material-UI v7, zusätzliche UI-Libraries
  - Output: Alle Dependencies in package.json und node_modules
  - Validation: `npm ls` zeigt alle packages ohne Konflikte
  - Rollback: package.json wiederherstellen und `npm install`

- [ ] **Step 1.3**: Prisma Setup mit SQLite
  - Input: Installierte Dependencies
  - Action: `npx prisma init --datasource-provider sqlite`, Schema für Prompts/Responses definieren
  - Output: Funktionsfähige Datenbank mit Prisma Client
  - Validation: `npx prisma db push` und `npx prisma studio` funktionieren
  - Rollback: prisma/ Ordner löschen und neu initialisieren

- [ ] **Step 1.4**: Environment Variables Setup
  - Input: API Keys für OpenAI und Anthropic
  - Action: .env.local erstellen mit API_KEYS, DATABASE_URL, weitere Config
  - Output: Sichere Konfiguration für API-Zugriffe
  - Validation: Environment Variables werden korrekt geladen
  - Rollback: .env.local anpassen oder löschen

- [ ] **Step 1.5**: TypeScript Types Definition
  - Input: API-Dokumentationen von OpenAI/Anthropic
  - Action: Erstelle umfassende TypeScript Interfaces für Models, Requests, Responses
  - Output: Typsichere Entwicklung für alle API-Interaktionen
  - Validation: TypeScript Compiler wirft keine Type-Errors
  - Rollback: Types-Dateien überarbeiten oder zurücksetzen

### Phase 2: Core Implementation
- [ ] **Step 2.1**: LangChain Model Integration
  - Input: LangChain Package, API Keys, Model Types
  - Action: OpenAI und Anthropic Models über LangChain konfigurieren, Model-Factory implementieren
  - Output: Abstrakte Model-Klassen für beide Anbieter
  - Validation: Testanfrage an beide Anbieter erfolgreich
  - Rollback: Model-Konfiguration auf funktionierenden Stand zurücksetzen

- [ ] **Step 2.2**: Modell-Preise Research & Implementation
  - Input: Aktuelle Pricing-Informationen von APIs
  - Action: Recherche aktueller Token-Preise, Implementierung Kostenberechnung
  - Output: Accurate Cost-Calculator für alle verfügbaren Modelle
  - Validation: Manuelle Verifikation gegen offizielle Preislisten
  - Rollback: Alte Preis-Daten wiederherstellen

- [ ] **Step 2.3**: Server Action für Parallel Requests
  - Input: LangChain Models, Cost Calculator
  - Action: Next.js Server Action implementieren für parallele Model-Anfragen
  - Output: Backend-Funktion für simultane 2-Model-Requests
  - Validation: Parallele Anfragen funktionieren ohne Race Conditions
  - Rollback: Server Action vereinfachen oder neu implementieren

- [ ] **Step 2.4**: Server-Sent Events Streaming Setup
  - Input: Server Actions, Model Responses
  - Action: SSE Route für Token-by-Token Streaming implementieren
  - Output: Real-time Streaming von Model-Antworten
  - Validation: Browser empfängt kontinuierliche SSE Updates
  - Rollback: Auf synchrone Responses zurückfallen

- [ ] **Step 2.5**: Prompt History mit Prisma
  - Input: Prisma Schema, User Inputs
  - Action: CRUD Operations für Prompt-/Response-Historie implementieren
  - Output: Persistente Speicherung aller Konversationen
  - Validation: Datenbank-Queries funktionieren, Daten werden korrekt gespeichert
  - Rollback: Datenbank-Schema auf vorherige Version zurücksetzen

### Phase 3: Frontend & UI Implementation
- [ ] **Step 3.1**: Material-UI v7 Theming Setup
  - Input: Material-UI Package
  - Action: Custom Theme definieren, Provider konfigurieren, responsive Breakpoints
  - Output: Konsistente UI-Grundlage mit Corporate Design
  - Validation: Alle MUI-Komponenten rendern korrekt mit Theme
  - Rollback: Default MUI Theme verwenden

- [ ] **Step 3.2**: Model Selection Interface
  - Input: Available Models von APIs
  - Action: Dropdown/Select Components für beide Model-Slots, dynamische Model-Liste
  - Output: User kann beliebige 2 Modelle auswählen
  - Validation: Alle verfügbaren Modelle werden angezeigt und sind auswählbar
  - Rollback: Statische Model-Liste mit wenigen Optionen

- [ ] **Step 3.3**: Prompt Input & Submit Interface
  - Input: Material-UI Components
  - Action: Textarea für Prompt-Eingabe, Submit-Button, Input-Validation
  - Output: Benutzerfreundliche Prompt-Eingabe mit Feedback
  - Validation: Prompts werden korrekt validiert und übermittelt
  - Rollback: Einfache HTML-Form ohne Validation

- [ ] **Step 3.4**: Dual Response Display mit Streaming
  - Input: SSE Stream, Model Responses
  - Action: Side-by-side Layout für 2 Model Responses, Live-Update bei Token-Empfang
  - Output: Simultane Anzeige beider Model-Antworten in Echtzeit
  - Validation: Beide Responses werden parallel und synchron aktualisiert
  - Rollback: Statische Response-Anzeige nach Completion

- [ ] **Step 3.5**: Live Cost Display
  - Input: Token Counts, Pricing Information
  - Action: Real-time Kostenberechnung und -anzeige während Streaming
  - Output: Transparente Kostenverfolgung pro Request und kumulativ
  - Validation: Kosten werden korrekt berechnet und aktualisiert
  - Rollback: Post-Request Kostenberechnung

- [ ] **Step 3.6**: Prompt History Interface
  - Input: Prisma Queries, Historical Data
  - Action: Liste früherer Prompts, Click-to-Reload Funktionalität
  - Output: Zugängliche Historie aller bisherigen Anfragen
  - Validation: Historie wird korrekt geladen und ist durchsuchbar
  - Rollback: Einfache Liste ohne Such-/Filterfunktionen

### Phase 4: Enhancement & Polish
- [ ] **Step 4.1**: Advanced UI Libraries Integration
  - Input: Zusätzliche UI Requirements
  - Action: Integration von react-syntax-highlighter, react-markdown, Copy-to-Clipboard
  - Output: Verbesserte UX mit Syntax-Highlighting und Markdown-Rendering
  - Validation: Code-Blocks werden korrekt hervorgehoben, Markdown wird gerendert
  - Rollback: Plain-Text Anzeige ohne Formatting

- [ ] **Step 4.2**: Error Handling & Loading States
  - Input: Mögliche Fehlerszenarien
  - Action: Comprehensive Error Boundaries, Loading Spinners, Retry-Mechanismen
  - Output: Robuste App mit angemessenem Fehler-Feedback
  - Validation: Alle Error-Cases werden graceful behandelt
  - Rollback: Basic Error-Handling ohne Recovery

- [ ] **Step 4.3**: Performance Optimizations
  - Input: Performance Metrics
  - Action: Code-Splitting, Lazy Loading, Memoization, Bundle-Optimierung
  - Output: Schnelle, responsive App mit optimaler Bundle-Size
  - Validation: Lighthouse Score >90, schnelle Ladezeiten
  - Rollback: Optimierungen einzeln rückgängig machen

- [ ] **Step 4.4**: Mobile Responsiveness
  - Input: Material-UI Breakpoints
  - Action: Mobile-first Design, Touch-optimierte Interfaces, Responsive Layout
  - Output: Vollständig mobile-kompatible Anwendung
  - Validation: App funktioniert auf verschiedenen Bildschirmgrößen
  - Rollback: Desktop-only Layout beibehalten

## File Matrix
| File Path | Purpose | Operations | Dependencies |
|-----|---|---|-----|
| `package.json` | Dependencies | CREATE/MODIFY | Step 1.2 |
| `prisma/schema.prisma` | Database Schema | CREATE | Step 1.3 |
| `src/lib/models.ts` | LangChain Model Setup | CREATE | Step 2.1 |
| `src/lib/pricing.ts` | Cost Calculation | CREATE | Step 2.2 |
| `src/app/api/chat/route.ts` | SSE Streaming Endpoint | CREATE | Step 2.4 |
| `src/app/actions.ts` | Server Actions | CREATE | Step 2.3 |
| `src/components/ModelSelector.tsx` | Model Selection UI | CREATE | Step 3.2 |
| `src/components/PromptInput.tsx` | Prompt Interface | CREATE | Step 3.3 |
| `src/components/ResponseDisplay.tsx` | Dual Response UI | CREATE | Step 3.4 |
| `src/components/CostDisplay.tsx` | Cost Tracking | CREATE | Step 3.5 |
| `src/components/HistoryPanel.tsx` | Prompt History | CREATE | Step 3.6 |
| `src/app/page.tsx` | Main App Layout | MODIFY | Step 3.1-3.6 |
| `src/app/layout.tsx` | Root Layout with Theme | MODIFY | Step 3.1 |

## Risk Mitigation
| Risk | Likelihood | Impact | Mitigation Strategy |
|---|---|-----|----|
| API Rate Limits | Medium | High | Implement request queuing and rate limiting |
| Streaming Connection Drops | Medium | Medium | Reconnection logic and fallback to polling |
| Cost Calculation Inaccuracy | Low | High | Regular price updates and validation against official sources |
| Model Availability Changes | Low | Medium | Dynamic model discovery and graceful degradation |
| Database Schema Evolution | Low | Medium | Prisma migrations and backup strategies |

## Validation Checkpoints
### Pre-Implementation
- [x] All dependencies available
- [x] Test data prepared (API Keys)
- [x] Backup/branch created
- [x] Development environment ready

### Per-Step Validation
- [ ] Unit tests pass for modified code
- [ ] No regression in existing features
- [ ] Performance metrics within bounds
- [ ] Linting/formatting rules satisfied

### Final Validation
- [ ] Integration tests pass
- [ ] End-to-end tests successful
- [ ] Code review checklist complete
- [ ] Documentation updated
- [ ] Security scan passed

## Progress Tracking
- Started: 2025-09-17 16:52
- Phase 1: ✅ Complete (Foundation & Setup)
- Phase 2: ✅ Complete (Core Implementation)
- Phase 3: ✅ Complete (Frontend & UI Implementation)
  - Step 3.1: ✅ Material-UI v7 Theming Setup
  - Step 3.2: ✅ Model Selection Interface  
  - Step 3.3: ✅ Prompt Input & Submit Interface
  - Step 3.4: ✅ Dual Response Display mit Streaming
  - Step 3.5: ✅ Live Cost Display
  - Step 3.6: ✅ Prompt History Interface
  - ✅ Zentrale Startseite implementiert (src/app/page.tsx)
  - ✅ SSR Theme Provider Fixes behoben
  - ✅ App läuft erfolgreich auf localhost:3000
  - ✅ HTML Hydration Error (div in p) behoben
  - ✅ React Hooks Rules Error behoben
- Phase 4: ⬜ Not Started
- Completed: [timestamp when done]
- Total Effort: ~4 hours

## Post-Implementation
- [ ] Monitoring configured
- [ ] Rollback plan documented
- [ ] Team knowledge transfer completed
- [ ] Release notes updated
- [ ] Archived to `completed/` folder

## Additional Technical Specifications

### LangChain Model Configuration
```typescript
// src/lib/models.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export const createOpenAIModel = (modelName: string) => {
  return new ChatOpenAI({
    modelName,
    streaming: true,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
};

export const createAnthropicModel = (modelName: string) => {
  return new ChatAnthropic({
    modelName,
    streaming: true,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });
};
```

### Prisma Schema Structure
```prisma
// prisma/schema.prisma
model Prompt {
  id        String   @id @default(cuid())
  content   String
  model1    String
  model2    String
  response1 String?
  response2 String?
  cost1     Float?
  cost2     Float?
  createdAt DateTime @default(now())
}
```

### Server-Sent Events Implementation
```typescript
// src/app/api/chat/route.ts
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Parallel model streaming logic
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Current Model Pricing (zu recherchieren)
```typescript
// src/lib/pricing.ts
export const MODEL_PRICING = {
  openai: {
    'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    // weitere Modelle...
  },
  anthropic: {
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    // weitere Modelle...
  },
};
```

### UI Component Structure
- **ModelSelector**: Dropdown mit allen verfügbaren Modellen
- **PromptInput**: Textarea mit Validation und Submit
- **ResponseDisplay**: Side-by-side Layout mit Streaming Updates
- **CostDisplay**: Live Token-Count und Kostenberechnung
- **HistoryPanel**: Collapsible Liste mit früheren Prompts

### Additional Libraries to Include
- `react-syntax-highlighter`: Code-Highlighting in Responses
- `react-markdown`: Markdown-Rendering für formatierte Antworten
- `react-copy-to-clipboard`: Copy-Funktionalität für Responses
- `recharts`: Charts für Kostenvisualisierung
- `date-fns`: Date-Formatting für History
- `react-hot-toast`: Toast-Notifications für Feedback
