# Gmail Agent (end-to-end)

An end-to-end agent app that uses the **Gmail MCP** tools to search/summarize threads and draft/send replies with explicit confirmation.

## Provider support
- OpenAI (`LLM_PROVIDER=openai`)
- Anthropic (`LLM_PROVIDER=anthropic`)

## Setup

```bash
cd agents/gmail-agent
npm i
```

Env:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default: `http://localhost:8787/oauth/callback`)

LLM:
- `LLM_PROVIDER=openai|anthropic`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `LLM_MODEL` (optional)

## Commands

### Search
```bash
node src/cli.js search --q "from:alice subject:onboarding newer_than:30d"
```

### Summarize a thread
```bash
node src/cli.js summarize --threadId <threadId>
```

### Create a draft reply (confirm)
```bash
node src/cli.js draft-reply --threadId <threadId> --body "..." --confirm
```

### Send a draft (confirm)
```bash
node src/cli.js send-draft --draftId <draftId> --confirm
```
