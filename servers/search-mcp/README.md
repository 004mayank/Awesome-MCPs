# Search MCP

Unified search across:
- Filesystem (allowlisted)
- GitHub (issues/PRs)
- Google Drive
- Gmail

This MCP is a thin orchestrator that calls the upstream APIs directly (so it can run as one MCP server in clients).

## Run

```bash
cd servers/search-mcp
npm i

# Filesystem
export FS_ROOTS="/abs/path/one,/abs/path/two"

# GitHub
export GITHUB_TOKEN="..."

# Google OAuth (shared token cache)
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export GOOGLE_REDIRECT_URI="http://localhost:8787/oauth/callback"

npm start
```

## Tools
- `search_sources({})`
- `search_query({ query, sources?, limit? })`

`search_query` returns a unified list of results with consistent fields.
