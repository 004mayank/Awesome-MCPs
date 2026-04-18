# Notion Agent (end-to-end)

An end-to-end agent app that uses the **Notion MCP** tools.

## Setup

```bash
cd agents/notion-agent
npm i
```

Env:
- `NOTION_TOKEN`
- `NOTION_VERSION` (optional)

## Commands

Search:
```bash
node src/cli.js search --q "weekly status"
```

Get page:
```bash
node src/cli.js get --page <page_id>
```

Append paragraph (confirm):
```bash
node src/cli.js append --block <page_or_block_id> --text "Hello" --confirm
```

Create page in database (confirm):
```bash
node src/cli.js create --db <database_id> --title "New page" --confirm
```
