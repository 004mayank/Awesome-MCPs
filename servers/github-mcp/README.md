# GitHub MCP (read-only)

A safe-by-default GitHub MCP server backed by the GitHub REST API.

## What it supports (v0)
Read:
- List issues
- List pull requests
- Get pull request details
- Get pull request diff (raw patch)
- List workflow runs (GitHub Actions)

Write (gated with `confirm=true`):
- Create issue
- Create comment
- Add/remove labels
- Close/reopen issue
- Merge PR
- Trigger workflow_dispatch

## Auth
Set `GITHUB_TOKEN` (classic PAT or fine-grained token).

Recommended scopes:
- public repos: minimal
- private repos: read access to repo contents + PRs

## Run

```bash
cd servers/github-mcp
npm i
export GITHUB_TOKEN="..."
npm start
```

## Tools
Read:
- `gh_list_issues({ owner, repo, state?, labels?, per_page? })`
- `gh_list_prs({ owner, repo, state?, base?, head?, per_page? })`
- `gh_get_pr({ owner, repo, number })`
- `gh_get_pr_diff({ owner, repo, number })`
- `gh_list_workflow_runs({ owner, repo, branch?, status?, per_page? })`
- `gh_get_workflow_run({ owner, repo, run_id })`
- `gh_get_workflow_run_logs_url({ owner, repo, run_id })`
- `gh_search_issues_prs({ q, per_page? })`
- `gh_get_file({ owner, repo, file_path, ref? })`

Write (requires `confirm:true`):
- `gh_create_issue({ owner, repo, title, body?, labels?, confirm? })`
- `gh_create_comment({ owner, repo, issue_number, body, confirm? })`
- `gh_add_labels({ owner, repo, issue_number, labels, confirm? })`
- `gh_remove_label({ owner, repo, issue_number, name, confirm? })`
- `gh_close_issue({ owner, repo, issue_number, confirm? })`
- `gh_reopen_issue({ owner, repo, issue_number, confirm? })`
- `gh_merge_pr({ owner, repo, number, merge_method?, commit_title?, commit_message?, confirm? })`
- `gh_trigger_workflow_dispatch({ owner, repo, workflow_id, ref, inputs?, confirm? })`
