# Google Drive MCP

Server implementation: `servers/google-drive-mcp`

## What users can do (use-cases)
Read:
- Search Drive for docs (“find the Q2 roadmap deck”).
- Retrieve file metadata.
- List files in a folder / shared drive.
- Export Google Docs to plain text for summarization or RAG.

Write (with explicit confirmation):
- Create folders.
- Upload a text file.
- Copy files.
- Move files between folders.
- Delete files.

## Tools (developer view)
Read:
- `drive_search({ q, pageSize?, pageToken? })`
- `drive_get_metadata({ fileId })`
- `drive_list_folder({ folderId, pageSize?, pageToken? })`
- `drive_export_text({ fileId })`
- `drive_export_html({ fileId })`
- `drive_export_markdown({ fileId })`
- `drive_download_base64({ fileId })`

Write (requires `confirm:true`):
- `drive_create_folder({ name, parentId?, confirm? })`
- `drive_upload_text({ name, content, parentId?, mimeType?, confirm? })`
- `drive_copy_file({ fileId, newName?, parentId?, confirm? })`
- `drive_move_file({ fileId, addParents?, removeParents?, confirm? })`
- `drive_delete_file({ fileId, confirm? })`

## Auth / setup
- **OAuth** (Google).
- Uses a localhost redirect flow (see server README).
- Recommended scopes (least privilege):
  - Read: `drive.readonly`, `drive.metadata.readonly`
  - Write (gated): `drive.file`

## Safety / risk
- **Risk:** medium once writes are enabled.
- Guardrails:
  - write operations require `confirm:true`
  - keep scopes minimal
  - handle pagination/rate limits

## Example prompts
- “Search my Drive for ‘pricing PRD’ and summarize the most recent doc.”
- “Create a folder called ‘Agent Notes’ in my Drive (confirm).”
- “Upload this text as a file called `notes.txt` into folder X (confirm).”
