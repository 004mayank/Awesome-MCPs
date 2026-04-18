# Confluence MCP (Cloud)

Auth: Confluence Cloud API token via Basic auth.

Write actions are **write-gated** (must pass `confirm:true`).

## Env
- `CONFLUENCE_BASE_URL` — e.g. `https://your-domain.atlassian.net/wiki`
- `CONFLUENCE_EMAIL`
- `CONFLUENCE_API_TOKEN`

## Tools
- `confluence_search` (CQL)
- `confluence_get_page`
- `confluence_create_page` (**confirm:true**)
- `confluence_update_page` (**confirm:true**)

## Run
```bash
cd servers/confluence-mcp
npm i
export CONFLUENCE_BASE_URL="https://your-domain.atlassian.net/wiki"
export CONFLUENCE_EMAIL="you@company.com"
export CONFLUENCE_API_TOKEN="..."
node src/index.js
```
