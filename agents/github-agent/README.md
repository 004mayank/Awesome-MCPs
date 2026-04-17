# GitHub Agent (end-to-end)

An end-to-end agent app that uses the **GitHub MCP** tools to triage PRs/issues, analyze diffs/CI, and perform gated write actions.

## Provider support
- OpenAI (`LLM_PROVIDER=openai`)
- Anthropic (`LLM_PROVIDER=anthropic`)

## Setup

### 1) Install
```bash
cd agents/github-agent
npm i
```

### 2) Configure env
Required:
- `GITHUB_TOKEN`

One of:
- `LLM_PROVIDER=openai` + `OPENAI_API_KEY`
- `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`

Optional:
- `LLM_MODEL` (override default model)

## Commands

### List PRs
```bash
node src/cli.js prs --owner <owner> --repo <repo>
```

### Analyze a PR (diff + CI)
```bash
node src/cli.js analyze-pr --owner <owner> --repo <repo> --number <prNumber>
```

### Create an issue (dry-run)
```bash
node src/cli.js create-issue --owner <owner> --repo <repo> --title "..." --body "..."
```

### Create an issue (confirm)
```bash
node src/cli.js create-issue --owner <owner> --repo <repo> --title "..." --body "..." --confirm
```

All write actions require `--confirm`.
