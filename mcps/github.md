# GitHub MCP

Server implementation: `servers/github-mcp`

## What users can do (use-cases)
Read:
- List open PRs/issues and get a clean summary.
- Fetch PR diff and summarize changes/risks.
- Inspect GitHub Actions workflow runs.

Write (with explicit confirmation):
- Create issues.
- Comment on issues/PRs.
- Add/remove labels.
- Close/reopen issues.
- Merge PRs.
- Trigger workflow dispatch.

## Tools (developer view)
Read:
- `gh_list_issues({ owner, repo, state?, labels?, per_page? })`
- `gh_list_prs({ owner, repo, state?, base?, head?, per_page? })`
- `gh_get_pr({ owner, repo, number })`
- `gh_get_pr_diff({ owner, repo, number })`
- `gh_list_workflow_runs({ owner, repo, branch?, status?, per_page? })`

Write (requires `confirm:true`):
- `gh_create_issue({ owner, repo, title, body?, labels?, confirm? })`
- `gh_create_comment({ owner, repo, issue_number, body, confirm? })`
- `gh_add_labels({ owner, repo, issue_number, labels, confirm? })`
- `gh_remove_label({ owner, repo, issue_number, name, confirm? })`
- `gh_close_issue({ owner, repo, issue_number, confirm? })`
- `gh_reopen_issue({ owner, repo, issue_number, confirm? })`
- `gh_merge_pr({ owner, repo, number, merge_method?, commit_title?, commit_message?, confirm? })`
- `gh_trigger_workflow_dispatch({ owner, repo, workflow_id, ref, inputs?, confirm? })`

## Auth / setup
- **API token** (`GITHUB_TOKEN`).
- Minimal scopes:
  - public repos: minimal
  - private repos: read access to the repo; writes require appropriate permissions

## Safety / risk
- **Risk:** medium (write operations).
- Guardrails:
  - all writes require `confirm:true`
  - keep tokens least-privilege

## Example prompts
- “List open PRs in owner/repo and summarize the top 5.”
- “Get PR diff for #214 and highlight risky changes.”
- “Create an issue for this bug (confirm).”
- “Add label ‘bug’ to issue #12 (confirm).”
