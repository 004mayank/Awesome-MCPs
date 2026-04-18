# Confluence Agent (end-to-end)

Uses the **Confluence MCP (Cloud)** tools.

## Setup
```bash
cd agents/confluence-agent
npm i
```

Env:
- `CONFLUENCE_BASE_URL`
- `CONFLUENCE_EMAIL`
- `CONFLUENCE_API_TOKEN`

## Commands
Search (CQL):
```bash
node src/cli.js search --cql "type=page and text~\"onboarding\"" --limit 5
```

Get page:
```bash
node src/cli.js get --id 123456
```

Create page (confirm):
```bash
node src/cli.js create --space ENG --title "Test" --html "<p>Hello</p>" --confirm
```

Update page (confirm):
```bash
node src/cli.js update --id 123456 --version 3 --html "<p>Updated</p>" --confirm
```
