# GitHub MCP

## What users can do (use-cases)
- List open PRs/issues and get a clean summary.
- Fetch PR diff + summarize changes and potential risks.
- Check CI status and pull logs/annotations.
- Draft review comments.
- Create issues from bug reports.
- (Optional) Comment/label/close PRs/issues with explicit confirmation.

## Tools (developer view)
Common tool surface:
- `github.list_pull_requests({ owner, repo, state?, base?, head?, labels? }) -> { prs[] }`
- `github.get_pull_request({ owner, repo, number }) -> { pr }`
- `github.get_pull_request_diff({ owner, repo, number }) -> { diff }`
- `github.list_workflow_runs({ owner, repo, branch?, status? }) -> { runs[] }`
- `github.get_workflow_run_logs({ owner, repo, run_id }) -> { logs }`
- `github.create_issue({ owner, repo, title, body, labels? }) -> { issue }` *(write-gated)*
- `github.create_comment({ owner, repo, issue_number, body }) -> { ok }` *(write-gated)*

## Auth / setup
- **API token** (PAT or GitHub App).
- Minimal scopes for read-only:
  - public repos: often none for basic reads
  - private repos: `repo` read

## Safety / risk
- **Risk:** low (read-only), medium (write operations).
- Recommend:
  - read-only mode by default
  - explicit user confirmation for comments/issues/labels/merges

## Example prompts
- “Summarize PR #214 and highlight risky files.”
- “Why is CI failing on main? Show the error and propose a fix.”
- “Turn this message into a GitHub issue (draft only).”
