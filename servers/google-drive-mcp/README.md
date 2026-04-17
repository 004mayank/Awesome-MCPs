# Google Drive MCP

Google Drive MCP server using Google OAuth (localhost redirect).

## Auth setup (required)
Create an OAuth client in Google Cloud Console.

Env vars:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default: `http://localhost:8787/oauth/callback`)
- `GOOGLE_TOKEN_PATH` (default: `servers/google-drive-mcp/.secrets/google-token.json`)

Scopes used:
- `https://www.googleapis.com/auth/drive.readonly`
- `https://www.googleapis.com/auth/drive.metadata.readonly`

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
- `drive_search({ q, pageSize?, pageToken? })`
- `drive_get_metadata({ fileId })`
- `drive_list_folder({ folderId, pageSize?, pageToken? })`
- `drive_export_text({ fileId })`
