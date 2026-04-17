# Filesystem MCP (read-only)

A minimal, safe-by-default Filesystem MCP server.

## What it supports
- List directory entries (within allowlisted roots)
- Read small text files (within allowlisted roots)
- Search files by substring (within allowlisted roots)

## Safety
- **Read-only**: no write/delete tools.
- Enforces allowlisted roots via `FS_ROOTS` env var.
- Blocks path traversal.

## Run

```bash
cd servers/filesystem-mcp
npm i

# Example allowlist: repo root + docs folder
export FS_ROOTS="/Users/you/projects,/Users/you/docs"

npm start
```

## Env
- `FS_ROOTS` (required): comma-separated absolute paths.
- `FS_MAX_BYTES` (optional, default 200000): max bytes to read per file.
- `FS_MAX_RESULTS` (optional, default 50): max search results.

## Tools
- `fs_list({ path })`
- `fs_read({ path })`
- `fs_search({ root, query, glob? })`
