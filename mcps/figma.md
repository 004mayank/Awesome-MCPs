# Figma MCP

Auth: Personal Access Token via `FIGMA_TOKEN`.

Primarily read-only.

## Env
- `FIGMA_TOKEN`

## Tools
- `figma_get_file`
- `figma_get_file_nodes`
- `figma_list_team_projects`

## Run
```bash
cd servers/figma-mcp
npm i
export FIGMA_TOKEN="..."
node src/index.js
```
