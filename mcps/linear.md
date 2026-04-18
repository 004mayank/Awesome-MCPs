# Linear MCP

Auth: API key via `LINEAR_API_KEY`.

Write actions are **write-gated** (must pass `confirm:true`).

## Env

- `LINEAR_API_KEY` — Linear API key

## Tools

- `linear_list_teams`
- `linear_search_issues`
- `linear_create_issue` (**confirm:true**)

## Run

```bash
cd servers/linear-mcp
npm i
export LINEAR_API_KEY="..."
node src/index.js
```
