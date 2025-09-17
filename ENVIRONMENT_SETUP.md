# Environment Setup für KI-Model-Arena

Diese Anwendung benötigt API-Keys von OpenAI und Anthropic zum Funktionieren.

## Schnell-Setup

1. **Erstelle `.env.local` Datei** im Projekt-Root:
```bash
touch .env.local
```

2. **Füge die folgenden Variablen hinzu**:
```env
# Database Connection (SQLite für lokale Entwicklung)
DATABASE_URL="file:./dev.db"

# OpenAI API Key - Erhalte deinen Key von: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Anthropic API Key - Erhalte deinen Key von: https://console.anthropic.com/
ANTHROPIC_API_KEY="sk-ant-api03-your-anthropic-api-key-here"
```

3. **Ersetze die Platzhalter** mit deinen echten API-Keys

4. **Starte die Anwendung neu**:
```bash
npm run dev
```

## API-Keys erhalten

### OpenAI API Key
1. Besuche https://platform.openai.com/api-keys
2. Erstelle einen neuen API-Key
3. Kopiere den Key (beginnt mit `sk-`)

### Anthropic API Key  
1. Besuche https://console.anthropic.com/
2. Gehe zu "API Keys" 
3. Erstelle einen neuen API-Key
4. Kopiere den Key (beginnt mit `sk-ant-api03-`)

## Kosten

- **OpenAI**: Pay-per-use, ca. $0.005-0.03 per 1K tokens
- **Anthropic**: Pay-per-use, ca. $0.0008-0.075 per 1K tokens

Beide Anbieter bieten kostenlose Startguthaben für neue Accounts.

## Fehlerbehebung

### "API_KEY ist nicht gesetzt" Fehler
- Überprüfe, dass `.env.local` existiert
- Überprüfe die Schreibweise der Variablennamen
- Starte Next.js neu nach Änderungen an `.env.local`

### SSE-Streaming Fehler
- Meist durch fehlende oder ungültige API-Keys verursacht
- Prüfe die Browser-Console für detaillierte Fehlermeldungen

### Anthropic Modelle funktionieren nicht
- ✅ **Behoben**: `maxTokens: -1` durch `maxTokens: 4000` ersetzt
- Anthropic API erfordert positive maxTokens-Werte

### Model-Auswahl reagiert nicht
- ✅ **Behoben**: DOM-Struktur in ModelSelector korrigiert
- Ungültige Verschachtelung von `<Box>` in `<Select>` behoben

### Token-Zählung und Kosten
- ✅ **Implementiert**: Modell-spezifische Token-Zählung
- OpenAI: ~4 Zeichen pro Token
- Anthropic: ~3.8 Zeichen pro Token
- Live-Anzeige in der Prompt-Eingabe
- Präzise Kostenberechnung basierend auf Token-Counts

## Sicherheit

- ⚠️ **NIEMALS** API-Keys in Git committen
- `.env.local` ist automatisch in `.gitignore` 
- Verwende nur lokale `.env.local` für Development