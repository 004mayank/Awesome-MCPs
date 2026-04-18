# Notion MCP

API-token auth. Write actions are **write-gated** (must pass `confirm: true`).

## Env

- `NOTION_TOKEN` — internal integration token
- `NOTION_VERSION` — optional (default `2022-06-28`)

## Tools

- `notion_search`
- `notion_get_page`
- `notion_create_page` (**confirm:true**)
- `notion_append_blocks` (**confirm:true**)

## Run

```bash
cd servers/notion-mcp
npm i
export NOTION_TOKEN="..."
node src/index.js
```
