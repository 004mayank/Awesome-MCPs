# Filesystem MCP (read-only)

A minimal, safe-by-default Filesystem MCP server.

## What it supports
Read:
- List directory entries (within allowlisted roots)
- Read small text files (within allowlisted roots)
- Search files by substring (within allowlisted roots)

Write (gated with `confirm=true`):
- Write a text file
- Create directories
- Delete files (files only in v0)
- Move/rename files
- Copy files

## Safety
- Enforces allowlisted roots via `FS_ROOTS` env var.
- Blocks path traversal.
- Write operations require `confirm=true`.

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
- `FS_MAX_WRITE_BYTES` (optional, default 200000): max bytes to write in one call.

## Tools
Read:
- `fs_list({ path })`
- `fs_read({ path })`
- `fs_search({ root, query })`

Write (requires `confirm:true`):
- `fs_write({ path, content, confirm? })`
- `fs_mkdir({ path, confirm? })`
- `fs_delete({ path, confirm? })`
- `fs_move({ from, to, confirm? })`
- `fs_copy({ from, to, confirm? })`
