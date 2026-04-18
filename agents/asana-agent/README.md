# Asana Agent (end-to-end)

Uses the **Asana MCP** tools.

## Setup
```bash
cd agents/asana-agent
npm i
```

Env:
- `ASANA_TOKEN`

## Commands
List workspaces:
```bash
node src/cli.js workspaces
```

Search tasks:
```bash
node src/cli.js search --workspace <gid> --text "onboarding"
```

Create task (confirm):
```bash
node src/cli.js create --workspace <gid> --name "Follow up" --notes "..." --confirm
```
