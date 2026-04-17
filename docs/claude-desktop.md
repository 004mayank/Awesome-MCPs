# Claude Desktop: using these MCP servers

Claude Desktop can load MCP servers from a config file.

> Config file location varies by OS/version. Use Claude Desktop docs for the exact path.

## Example config

This is an example shape showing how you would register multiple servers.
Update `command` and `args` to match your local paths.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/absolute/path/to/Awesome-MCPs/servers/filesystem-mcp/src/index.js"],
      "env": {
        "FS_ROOTS": "/absolute/path/to/allowed/root1,/absolute/path/to/allowed/root2"
      }
    },
    "github": {
      "command": "node",
      "args": ["/absolute/path/to/Awesome-MCPs/servers/github-mcp/src/index.js"],
      "env": {
        "GITHUB_TOKEN": "YOUR_TOKEN"
      }
    },
    "google-drive": {
      "command": "node",
      "args": ["/absolute/path/to/Awesome-MCPs/servers/google-drive-mcp/src/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "...",
        "GOOGLE_REDIRECT_URI": "http://localhost:8787/oauth/callback"
      }
    },
    "gmail": {
      "command": "node",
      "args": ["/absolute/path/to/Awesome-MCPs/servers/gmail-mcp/src/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "...",
        "GOOGLE_REDIRECT_URI": "http://localhost:8787/oauth/callback"
      }
    },
    "google-calendar": {
      "command": "node",
      "args": ["/absolute/path/to/Awesome-MCPs/servers/google-calendar-mcp/src/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "...",
        "GOOGLE_REDIRECT_URI": "http://localhost:8787/oauth/callback"
      }
    }
  }
}
```

## Notes
- Google auth is shared by default: tokens are cached to `Awesome-MCPs/.secrets/google-token.json`.
- Write tools require `confirm:true`.
