# Jira MCP (Cloud)

Uses Jira Cloud REST API v3.

Auth: **API token** via Basic auth (`email:token`). Write actions are **write-gated** (must pass `confirm:true`).

## Env

- `JIRA_BASE_URL` — e.g. `https://your-domain.atlassian.net`
- `JIRA_EMAIL` — Atlassian account email
- `JIRA_API_TOKEN` — Jira API token

## Tools

- `jira_list_projects`
- `jira_search_issues` (JQL)
- `jira_create_issue` (**confirm:true**)
- `jira_add_comment` (**confirm:true**)

## Run

```bash
cd servers/jira-mcp
npm i
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_EMAIL="you@company.com"
export JIRA_API_TOKEN="..."
node src/index.js
```
