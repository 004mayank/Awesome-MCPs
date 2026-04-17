# Search MCP

Server implementation: `servers/search-mcp`

## What users can do (use-cases)
- Search across **filesystem + GitHub + Google Drive + Gmail** with a single query.
- Filter which sources to search (e.g., only `github` + `drive`).
- Get consistent results with a title, snippet, and link.

## Tools (developer view)
- `search_sources({})`
  - Returns which sources are enabled based on env/config.
- `search_query({ query, sources?, limit? })`
  - `sources` is a subset of: `filesystem`, `github`, `google_drive`, `gmail`
  - Returns unified `results[]` with:
    - `source`
    - `title`
    - `snippet`
    - `url`
    - `id`
    - `metadata`

## Auth / setup
- Filesystem: `FS_ROOTS`
- GitHub: `GITHUB_TOKEN`
- Google (Drive/Gmail): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

## Safety / risk
- Read-only.
- Does not pull full file/email/doc content by default.

## Example prompts
- “Search for ‘pricing experiment’ across everything.”
- “Search GitHub only for ‘rate limit’.”
- “Search Drive for ‘roadmap’ and return top 10.”
