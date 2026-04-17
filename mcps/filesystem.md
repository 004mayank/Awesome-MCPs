# Filesystem MCP

Server implementation: `servers/filesystem-mcp`

## What users can do (use-cases)
Read:
- Search for files by keyword within approved folders.
- Read files (markdown/text/JSON) so an agent can summarize or extract data.
- List directories to understand what’s available.
- Extract small snippets around a match (useful for logs).

Write (with explicit confirmation):
- Create/update a text file.
- Create directories.
- Move/rename files.
- Copy files.
- Delete files (files only in v0).

## Tools (developer view)
Read:
- `fs_list({ path })` — list directory entries (allowlisted roots only)
- `fs_read({ path })` — read text file (size-limited)
- `fs_search({ root, query })` — case-insensitive substring search

Write (requires `confirm:true`):
- `fs_write({ path, content, confirm? })`
- `fs_mkdir({ path, confirm? })`
- `fs_move({ from, to, confirm? })`
- `fs_copy({ from, to, confirm? })`
- `fs_delete({ path, confirm? })` *(files only)*

## Auth / setup
- Usually **none** (local capability).
- Requires sandboxing via `FS_ROOTS` (comma-separated absolute paths).

## Safety / risk
- **Risk:** medium (because local files).
- Enforces:
  - allowlisted roots only
  - blocks path traversal/out-of-root access
  - max read size (`FS_MAX_BYTES`) and max write size (`FS_MAX_WRITE_BYTES`)
  - write operations require `confirm:true`

## Example prompts
- “Search my docs folder for ‘pricing experiment’ and show top 10 matches.”
- “Open `/docs/spec.md` and summarize key decisions.”
- “Write a file `notes/meeting.md` with these bullets (confirm before writing).”
- “Move `draft.md` to `archive/draft.md` (confirm).”
