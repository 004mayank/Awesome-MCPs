# Workspace Agent (end-to-end)

A cross-tool workspace assistant that uses the **Search MCP** to find relevant items across:
- filesystem
- GitHub
- Google Drive
- Gmail

Then produces a concise brief and recommended next actions.

## Provider support
- OpenAI (`LLM_PROVIDER=openai`)
- Anthropic (`LLM_PROVIDER=anthropic`)

## Setup

```bash
cd agents/workspace-agent
npm i
```

Env (same as Search MCP):
- `FS_ROOTS` (optional, enables filesystem)
- `GITHUB_TOKEN` (optional, enables GitHub)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (optional, enables Drive/Gmail)

LLM:
- `LLM_PROVIDER=openai|anthropic`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

## Commands

### Unified search
```bash
node src/cli.js search --query "pricing experiment" --sources "filesystem,github,google_drive,gmail"
```

### Brief from results
```bash
node src/cli.js brief --query "pricing experiment" --sources "filesystem,github,google_drive,gmail"
```
