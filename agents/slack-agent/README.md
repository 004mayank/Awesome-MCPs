# Slack Agent (end-to-end)

An end-to-end agent app that uses the **Slack MCP** tools.

## Setup

```bash
cd agents/slack-agent
npm i
```

Env:
- `SLACK_BOT_TOKEN`

## Commands

List channels:
```bash
node src/cli.js channels
```

Search messages:
```bash
node src/cli.js search --q "in:#general onboarding"
```

Send message (confirm):
```bash
node src/cli.js send --channel C01234567 --text "hello" --confirm
```
