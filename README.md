# Awesome MCPs

> Build. Plug. Scale.
> A collection of **custom-built MCP (Model Context Protocol) servers** designed for real-world AI agents.

---

## What is this?

This repository contains **original MCP servers** built to extend AI agents with real capabilities:

* 🔌 Connect to APIs
* 📂 Access structured/unstructured data
* ⚙️ Automate workflows
* 🧠 Enable reasoning with tools

Unlike curated lists, this repo focuses on **actual implementations you can run and use**.

---

## MCPs

Start here:
- [MCP Index](./mcps/README.md)

### Implemented
- **Search MCP** → docs: [mcps/search.md](./mcps/search.md) · server: `servers/search-mcp` · read-only
- **Filesystem MCP** → docs: [mcps/filesystem.md](./mcps/filesystem.md) · server: `servers/filesystem-mcp` · write-gated (`confirm:true`)
- **GitHub MCP** → docs: [mcps/github.md](./mcps/github.md) · server: `servers/github-mcp` · write-gated (`confirm:true`)
- **Google Drive MCP** → docs: [mcps/google-drive.md](./mcps/google-drive.md) · server: `servers/google-drive-mcp` · write-gated (`confirm:true`)
- **Gmail MCP** → docs: [mcps/gmail.md](./mcps/gmail.md) · server: `servers/gmail-mcp` · write-gated (`confirm:true`)
- **Google Calendar MCP** → docs: [mcps/google-calendar.md](./mcps/google-calendar.md) · server: `servers/google-calendar-mcp` · write-gated (`confirm:true`)
- **Slack MCP** → docs: [mcps/slack.md](./mcps/slack.md) · server: `servers/slack-mcp` · write-gated (`confirm:true`)
- **Notion MCP** → docs: [mcps/notion.md](./mcps/notion.md) · server: `servers/notion-mcp` · write-gated (`confirm:true`)
- **Jira MCP** → docs: [mcps/jira.md](./mcps/jira.md) · server: `servers/jira-mcp` · write-gated (`confirm:true`)
- **Linear MCP** → docs: [mcps/linear.md](./mcps/linear.md) · server: `servers/linear-mcp` · write-gated (`confirm:true`)
- **Asana MCP** → docs: [mcps/asana.md](./mcps/asana.md) · server: `servers/asana-mcp` · write-gated (`confirm:true`)
- **Zendesk MCP** → docs: [mcps/zendesk.md](./mcps/zendesk.md) · server: `servers/zendesk-mcp` · write-gated (`confirm:true`)
- **GitLab MCP** → docs: [mcps/gitlab.md](./mcps/gitlab.md) · server: `servers/gitlab-mcp` · write-gated (`confirm:true`)
- **Figma MCP** → docs: [mcps/figma.md](./mcps/figma.md) · server: `servers/figma-mcp` · read-only

### Shared
- **Google OAuth helper** → `servers/google-auth`

### How to use
- Claude Desktop config example: [docs/claude-desktop.md](./docs/claude-desktop.md)
- Servers runbook: [servers/README.md](./servers/README.md)
- Agents index: [agents/README.md](./agents/README.md)

---

## Quick Start

```bash
git clone https://github.com/004mayank/Awesome-MCPs.git
cd Awesome-MCPs
npm install
```

Run an MCP server:

```bash
npm run search-mcp
```

---

## Architecture

Each MCP server follows:

* Standard MCP protocol interface
* Tool definitions (input/output schema)
* Execution layer (logic)
* Response formatter (LLM-friendly)

---

## Build Your Own MCP

1. Create a new folder:

```bash
/servers/my-mcp
```

2. Implement:

* Tool schema
* Handler function
* MCP interface

3. Register it with your agent

---

## Roadmap

* [ ] Authentication MCP
* [ ] Payments MCP
* [ ] Email MCP
* [ ] Calendar MCP
* [ ] Multi-agent orchestration MCP

---

## Contributing

We welcome builders.

* Add new MCP servers
* Improve existing ones
* Share real-world use cases

---

## Why this repo?

Because MCP is the future of agents - and **real implementations matter more than theory**.

---

## License

MIT
