# Gmail MCP

Gmail MCP server using Google OAuth (localhost redirect).

## Auth setup (required)
Env vars:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default: `http://localhost:8787/oauth/callback`)
- `GOOGLE_TOKEN_PATH` (default: `servers/gmail-mcp/.secrets/google-token.json`)

Scopes used:
- Read: `https://www.googleapis.com/auth/gmail.readonly`
- Write (gated with `confirm=true`):
  - Draft: `https://www.googleapis.com/auth/gmail.compose`
  - Send: `https://www.googleapis.com/auth/gmail.send`

## Run

```bash
cd servers/gmail-mcp
npm i
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export GOOGLE_REDIRECT_URI="http://localhost:8787/oauth/callback"

npm start
```

First run prints an auth URL.

## Tools
Read:
- `gmail_search({ q, maxResults?, pageToken? })`
- `gmail_get_thread({ threadId, format? })`
- `gmail_get_message({ messageId, format? })`

Write (requires `confirm:true`):
- `gmail_create_draft_reply({ threadId, body, confirm? })`
- `gmail_send_draft({ draftId, confirm? })`
