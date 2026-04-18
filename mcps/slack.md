# Slack MCP

API-token auth. Write actions are **write-gated** (must pass `confirm: true`).

## Env

- `SLACK_BOT_TOKEN` — Slack bot token (recommended scopes: `channels:read`, `groups:read`, `chat:write`, `search:read` as needed).

## Tools

- `slack_list_channels` — list channels
- `slack_search_messages` — search messages
- `slack_send_message` — send message (**requires** `confirm:true`)

## Run

```bash
cd servers/slack-mcp
npm i
export SLACK_BOT_TOKEN="..."
node src/index.js
```
