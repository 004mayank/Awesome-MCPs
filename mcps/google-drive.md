# Google Drive MCP

## What users can do (use-cases)
- Search Drive for docs (“find the Q2 roadmap deck”).
- Retrieve files and extract text.
- Export Google Docs/Slides/Sheets into text/markdown for summarization or RAG.
- List files in a folder / shared drive.
- (Optional) Create a doc from a template with explicit confirmation.

## Tools (developer view)
Common tool surface:
- `drive.search({ query, pageSize?, pageToken? }) -> { files[], nextPageToken? }`
- `drive.get_metadata({ fileId }) -> { file }`
- `drive.download({ fileId }) -> { bytes | path }` *(for binary)*
- `drive.export({ fileId, format: 'text'|'markdown'|'pdf'|'html' }) -> { content | path }`
- `drive.list_folder({ folderId, pageSize?, pageToken? }) -> { files[], nextPageToken? }`

## Auth / setup
- **OAuth** (Google) with restricted scopes.
- Recommended scopes (least privilege):
  - `drive.readonly` / `drive.metadata.readonly`

## Safety / risk
- **Risk:** low (read-only).
- Guardrails:
  - never request broad scopes unless needed
  - handle rate limits & pagination
  - avoid downloading huge binaries unless asked

## Example prompts
- “Search my Drive for ‘pricing PRD’ and summarize the most recent doc.”
- “Export this Google Doc to markdown and extract key decisions.”
