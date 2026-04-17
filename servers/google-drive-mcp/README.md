# Google Drive MCP

Google Drive MCP server using Google OAuth (localhost redirect).

## Auth setup (required)
Create an OAuth client in Google Cloud Console.

Env vars:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default: `http://localhost:8787/oauth/callback`)
- `GOOGLE_TOKEN_PATH` (default: `Awesome-MCPs/.secrets/google-token.json`)

Scopes used:
- Read:
  - `https://www.googleapis.com/auth/drive.readonly`
  - `https://www.googleapis.com/auth/drive.metadata.readonly`
- Write (gated with `confirm=true`):
  - `https://www.googleapis.com/auth/drive.file`

## Run

```bash
cd servers/google-drive-mcp
npm i
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
# ensure redirect URI matches what you registered
export GOOGLE_REDIRECT_URI="http://localhost:8787/oauth/callback"

npm start
```

On first run, the server prints an authorization URL. Open it in a browser, approve, and the server will cache tokens locally.

## Tools (v0)
Read:
- `drive_search({ q, pageSize?, pageToken? })`
- `drive_get_metadata({ fileId })`
- `drive_list_folder({ folderId, pageSize?, pageToken? })`
- `drive_export_text({ fileId })`

Write (requires `confirm:true`):
- `drive_create_folder({ name, parentId?, confirm? })`
- `drive_upload_text({ name, content, parentId?, mimeType?, confirm? })`
- `drive_copy_file({ fileId, newName?, parentId?, confirm? })`
- `drive_move_file({ fileId, addParents?, removeParents?, confirm? })`
- `drive_delete_file({ fileId, confirm? })`
