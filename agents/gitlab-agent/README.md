# GitLab Agent (end-to-end)

Uses the **GitLab MCP** tools.

## Setup
```bash
cd agents/gitlab-agent
npm i
```

Env:
- `GITLAB_TOKEN`
- `GITLAB_BASE_URL` (optional)

## Commands
List projects:
```bash
node src/cli.js projects --search "platform"
```

List merge requests:
```bash
node src/cli.js mrs --project 123
```

List pipelines:
```bash
node src/cli.js pipelines --project 123 --ref main
```

List pipeline jobs:
```bash
node src/cli.js jobs --project 123 --pipeline 456
```

Comment on merge request (confirm):
```bash
node src/cli.js comment-mr --project 123 --mr 10 --text "LGTM" --confirm
```

Create issue (confirm):
```bash
node src/cli.js create-issue --project 123 --title "Investigate" --desc "Details" --confirm
```
