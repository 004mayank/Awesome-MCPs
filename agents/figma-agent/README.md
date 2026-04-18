# Figma Agent (end-to-end)

Uses the **Figma MCP** tools.

## Setup
```bash
cd agents/figma-agent
npm i
```

Env:
- `FIGMA_TOKEN`

## Commands
Get file:
```bash
node src/cli.js file --key <file_key>
```

Get nodes:
```bash
node src/cli.js nodes --key <file_key> --ids "0:1,0:2"
```

List team projects:
```bash
node src/cli.js projects --team <team_id>
```
