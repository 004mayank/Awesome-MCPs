# Browser Agent Framework (browser-use style)

Node + Playwright agent framework with:
- Multi-step planner
- Browser tool-calling
- Memory (sqlite + local files)
- Skills/tasks registry (YAML/JSON)
- Tracing/logs + screenshots
- Eval harness
- Parallel tabs / multi-contexts
- CLI + React/Vite Web UI

> Work in progress.

## Dev

```bash
cd agents/browser-agent-framework
npm i
```

Run server + UI:
```bash
npm -w @baf/server run dev   # http://localhost:8788
npm -w @baf/web run dev      # http://localhost:5173
```

Run a task via CLI:
```bash
node packages/cli/dist/cli.js run --task ./path/to/task.json
```

Run a task from a skill bundle:
```bash
node packages/cli/dist/cli.js run-skill --skill ./skills/example-skill.yaml --task example
```
