# Environment Setup

## Required Environment Variables

Copy the example file and add your API keys:

```bash
cp .env .env.local
```

Edit `.env.local` and replace the placeholder values:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-actual-openai-key

# Anthropic API Configuration  
ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key

# Database
DATABASE_URL="file:./dev.db"

# Next.js Configuration
NODE_ENV=development
```

## API Key Sources

- **OpenAI**: Get your API key from https://platform.openai.com/api-keys
- **Anthropic**: Get your API key from https://console.anthropic.com/

## Validation

Run the following to ensure environment variables are loaded:

```bash
npm run dev
```

The app should start without environment variable errors.
