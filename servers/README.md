# Servers

Runnable MCP server implementations that live in this repo.

## Environment
Copy `.env.example` → `.env` and fill in values.

```bash
cp .env.example .env
```

> Note: `.env` is not automatically loaded by these servers yet.
> Export env vars in your shell or use a launcher that loads `.env`.

## Search MCP
Path: `servers/search-mcp`

```bash
cd servers/search-mcp
npm i
export FS_ROOTS="/absolute/path/one,/absolute/path/two"
export GITHUB_TOKEN="..."
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export GOOGLE_REDIRECT_URI="http://localhost:8787/oauth/callback"

npm start
```

## Filesystem MCP
Path: `servers/filesystem-mcp`

```bash
cd servers/filesystem-mcp
npm i
export FS_ROOTS="/absolute/path/one,/absolute/path/two"
npm start
```

## GitHub MCP
Path: `servers/github-mcp`

```bash
cd servers/github-mcp
npm i
export GITHUB_TOKEN="..."
npm start
```

## Google Drive MCP
Path: `servers/google-drive-mcp`

```bash
cd servers/google-drive-mcp
npm i
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export GOOGLE_REDIRECT_URI="http://localhost:8787/oauth/callback"

npm start
```

## Gmail MCP
Path: `servers/gmail-mcp`

```bash
cd servers/gmail-mcp
npm i
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export GOOGLE_REDIRECT_URI="http://localhost:8787/oauth/callback"

npm start
```

## Google Calendar MCP
Path: `servers/google-calendar-mcp`

```bash
cd servers/google-calendar-mcp
npm i
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export GOOGLE_REDIRECT_URI="http://localhost:8787/oauth/callback"

npm start
```

## Shared
- Google OAuth helper: `servers/google-auth`
- Google token cache default: `.secrets/google-token.json` (gitignored)

## Trello MCP
Path: `servers/trello-mcp`

```bash
cd servers/trello-mcp
npm i
export TRELLO_API_KEY="..."
export TRELLO_TOKEN="..."

npm start
```

## ClickUp MCP
Path: `servers/clickup-mcp`

```bash
cd servers/clickup-mcp
npm i
export CLICKUP_TOKEN="..."

npm start
```

## HubSpot MCP
Path: `servers/hubspot-mcp`

```bash
cd servers/hubspot-mcp
npm i
export HUBSPOT_PRIVATE_APP_TOKEN="..."

npm start
```
