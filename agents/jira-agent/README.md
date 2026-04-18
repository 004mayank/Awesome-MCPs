# Jira Agent (end-to-end)

An end-to-end agent app that uses the **Jira MCP** tools (Jira Cloud).

## Setup

```bash
cd agents/jira-agent
npm i
```

Env:
- `JIRA_BASE_URL` (e.g. `https://your-domain.atlassian.net`)
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`

## Commands

List projects:
```bash
node src/cli.js projects
```

Search issues:
```bash
node src/cli.js search --jql "project = ENG ORDER BY updated DESC"
```

Create issue (confirm):
```bash
node src/cli.js create --project ENG --type Task --summary "Investigate" --desc "Details" --confirm
```

Add comment (confirm):
```bash
node src/cli.js comment --issue ENG-123 --text "Update" --confirm
```
