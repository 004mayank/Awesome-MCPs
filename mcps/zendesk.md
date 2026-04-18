# Zendesk MCP

Auth: API token via Basic auth (`email/token:api_token`).

Write actions are **write-gated** (must pass `confirm:true`).

## Env
- `ZENDESK_SUBDOMAIN`
- `ZENDESK_EMAIL`
- `ZENDESK_API_TOKEN`

## Tools
- `zendesk_search_tickets`
- `zendesk_get_ticket`
- `zendesk_add_comment` (**confirm:true**)

## Run
```bash
cd servers/zendesk-mcp
npm i
export ZENDESK_SUBDOMAIN="your-subdomain"
export ZENDESK_EMAIL="you@company.com"
export ZENDESK_API_TOKEN="..."
node src/index.js
```
