# Drive Agent (end-to-end)

An end-to-end agent app that uses the **Google Drive MCP** tools to search/export/summarize docs and perform gated write actions.

## Provider support
- OpenAI (`LLM_PROVIDER=openai`)
- Anthropic (`LLM_PROVIDER=anthropic`)

## Setup

```bash
cd agents/drive-agent
npm i
```

Env:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default used by our servers: `http://localhost:8787/oauth/callback`)

LLM:
- `LLM_PROVIDER=openai|anthropic`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `LLM_MODEL` (optional)

## Commands

### Search
```bash
node src/cli.js search --q "roadmap"
```

### Summarize a Google Doc
```bash
node src/cli.js summarize --fileId <fileId>
```

### Create folder (confirm)
```bash
node src/cli.js create-folder --name "Agent Notes" --confirm
```

All write actions require `--confirm`.
