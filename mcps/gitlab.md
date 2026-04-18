# GitLab MCP

Auth: API token via `GITLAB_TOKEN`.

Write actions are **write-gated** (must pass `confirm:true`).

## Env
- `GITLAB_TOKEN`
- `GITLAB_BASE_URL` (optional, default `https://gitlab.com`)

## Tools
- `gitlab_list_projects`
- `gitlab_list_merge_requests`
- `gitlab_list_pipelines`
- `gitlab_list_pipeline_jobs`
- `gitlab_add_merge_request_note` (**confirm:true**)
- `gitlab_create_issue` (**confirm:true**)

## Run
```bash
cd servers/gitlab-mcp
npm i
export GITLAB_TOKEN="..."
# export GITLAB_BASE_URL="https://gitlab.your-company.com"  # if self-hosted
node src/index.js
```
