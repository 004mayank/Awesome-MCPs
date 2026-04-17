# Filesystem MCP

## What users can do (use-cases)
- Search for files by keyword (e.g., “find the latest PRD PDF”) within approved folders.
- Read files (markdown, text, JSON) so an agent can summarize or extract data.
- List directories to understand what’s available.
- (Optional) Create/update files (e.g., “write a draft doc”) with explicit confirmation.
- Extract snippets/lines around matches (useful for large logs).

## Tools (developer view)
Typical tool surface (names can vary by implementation):
- `fs.list({ path }) -> { entries[] }`
- `fs.search({ root, query, glob?, maxResults? }) -> { matches[] }`
- `fs.read({ path, from?, bytes?, lines? }) -> { content, truncated? }`
- `fs.stat({ path }) -> { sizeBytes, modifiedAt, type }`
- `fs.write({ path, content, mode? }) -> { ok }` *(write-gated)*
- `fs.mkdir({ path }) -> { ok }` *(write-gated)*

## Auth / setup
- Usually **none** (local capability).
- Requires **sandboxing** via an allowlist of directories.

## Safety / risk
- **Risk:** medium if writes are enabled.
- Must enforce:
  - allowlisted roots
  - no path traversal (`..`)
  - max file size / streaming reads
  - separate confirmation gate for writes/deletes

## Example prompts
- “Search my docs folder for ‘pricing experiment’ and show top 10 matches.”
- “Open `/docs/spec.md` and summarize key decisions.”
- “Create a new file `notes/meeting.md` with these bullets (ask before writing).”
