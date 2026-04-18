# Linear Agent (end-to-end)

An end-to-end agent app that uses the **Linear MCP** tools.

## Setup

```bash
cd agents/linear-agent
npm i
```

Env:
- `LINEAR_API_KEY`

## Commands

List teams:
```bash
node src/cli.js teams
```

Search issues:
```bash
node src/cli.js search --q "onboarding"
```

Create issue (confirm):
```bash
node src/cli.js create --team <teamId> --title "Investigate alert noise" --desc "Details" --confirm
```
