# Salesforce MCP

Auth: access token via `SALESFORCE_ACCESS_TOKEN` and instance URL via `SALESFORCE_INSTANCE_URL`.

Write actions are **write-gated** (must pass `confirm:true`).

## Env
- `SALESFORCE_INSTANCE_URL` — e.g. `https://your-domain.my.salesforce.com`
- `SALESFORCE_ACCESS_TOKEN`
- `SALESFORCE_API_VERSION` (optional, default `v61.0`)

## Tools
- `salesforce_limits`
- `salesforce_sobjects_list`
- `salesforce_query`
- `salesforce_create_record` (**confirm:true**)

## Run
```bash
cd servers/salesforce-mcp
npm i
export SALESFORCE_INSTANCE_URL="https://your-domain.my.salesforce.com"
export SALESFORCE_ACCESS_TOKEN="..."
node src/index.js
```
