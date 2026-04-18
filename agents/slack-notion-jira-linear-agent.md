# Slack + Notion + Jira + Linear Agent

This agent is designed to work with the MCP servers:
- Slack MCP
- Notion MCP
- Jira MCP
- Linear MCP

## Capabilities

- Post updates to Slack (write-gated)
- Search and read Notion pages; create/append content (write-gated)
- Search Jira issues via JQL; create issues & comment (write-gated)
- Search Linear issues; create issues (write-gated)

## Operating rules

- For any write action, ask the user for approval OR require tool input `confirm:true`.
- Prefer read/search first; keep payloads minimal.

## Example tasks

- "Find the latest project status page in Notion and post a summary to #eng-updates"
- "Search Jira for bugs updated this week and create a Linear issue for the top 3"
