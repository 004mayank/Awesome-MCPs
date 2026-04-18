# Slack + Notion + Jira + Linear Agent (end-to-end)

An end-to-end runnable agent app that orchestrates the MCP servers:
- Slack MCP
- Notion MCP
- Jira MCP
- Linear MCP

Write actions are **write-gated** and require `--confirm`.

## Setup

```bash
cd agents/slack-notion-jira-linear-agent
npm i
```

Env:
- `SLACK_BOT_TOKEN`
- `NOTION_TOKEN`
- `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
- `LINEAR_API_KEY`

## Commands

### Slack: list channels
```bash
node src/cli.js slack:channels
```

### Slack: search messages
```bash
node src/cli.js slack:search --q "from:@alice in:#general onboarding"
```

### Slack: send message (confirm)
```bash
node src/cli.js slack:send --channel C01234567 --text "hello" --confirm
```

### Notion: search
```bash
node src/cli.js notion:search --q "weekly status"
```

### Jira: list projects
```bash
node src/cli.js jira:projects
```

### Jira: search issues (JQL)
```bash
node src/cli.js jira:search --jql "project = ENG ORDER BY updated DESC"
```

### Linear: list teams
```bash
node src/cli.js linear:teams
```

### Linear: create issue (confirm)
```bash
node src/cli.js linear:create --team <teamId> --title "Investigate alert noise" --confirm
```
