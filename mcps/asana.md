# Asana MCP

Auth: Personal Access Token (`ASANA_TOKEN`).

Write actions are **write-gated** (must pass `confirm:true`).

## Env
- `ASANA_TOKEN`

## Tools
- `asana_list_workspaces`
- `asana_search_tasks`
- `asana_create_task` (**confirm:true**)

## Run
```bash
cd servers/asana-mcp
npm i
export ASANA_TOKEN="..."
node src/index.js
```
