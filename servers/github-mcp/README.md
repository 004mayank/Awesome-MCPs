# GitHub MCP (read-only)

A safe-by-default GitHub MCP server backed by the GitHub REST API.

## What it supports (v0)
- List issues
- List pull requests
- Get pull request details
- Get pull request diff (raw patch)
- List workflow runs (GitHub Actions)

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
- `gh_list_issues({ owner, repo, state?, labels?, per_page? })`
- `gh_list_prs({ owner, repo, state?, base?, head?, per_page? })`
- `gh_get_pr({ owner, repo, number })`
- `gh_get_pr_diff({ owner, repo, number })`
- `gh_list_workflow_runs({ owner, repo, branch?, status?, per_page? })`
