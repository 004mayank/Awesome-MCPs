# Zendesk Agent (end-to-end)

Uses the **Zendesk MCP** tools.

## Setup
```bash
cd agents/zendesk-agent
npm i
```

Env:
- `ZENDESK_SUBDOMAIN`
- `ZENDESK_EMAIL`
- `ZENDESK_API_TOKEN`

## Commands
Search tickets:
```bash
node src/cli.js search --q "type:ticket status:open"
```

Get ticket (with comments):
```bash
node src/cli.js get --id 12345 --comments
```

Add comment (confirm):
```bash
node src/cli.js comment --id 12345 --text "We are investigating" --public false --confirm
```
