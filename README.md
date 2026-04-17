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
- **Filesystem MCP** → docs: [mcps/filesystem.md](./mcps/filesystem.md) · server: `servers/filesystem-mcp` · write-gated (`confirm:true`)
- **GitHub MCP** → docs: [mcps/github.md](./mcps/github.md) · server: `servers/github-mcp` · write-gated (`confirm:true`)
- **Google Drive MCP** → docs: [mcps/google-drive.md](./mcps/google-drive.md) · server: `servers/google-drive-mcp` · write-gated (`confirm:true`)
- **Gmail MCP** → docs: [mcps/gmail.md](./mcps/gmail.md) · server: `servers/gmail-mcp` · write-gated (`confirm:true`)
- **Google Calendar MCP** → docs: [mcps/google-calendar.md](./mcps/google-calendar.md) · server: `servers/google-calendar-mcp` · write-gated (`confirm:true`)

### Shared
- **Google OAuth helper** → `servers/google-auth`

### How to use
- Claude Desktop config example: [docs/claude-desktop.md](./docs/claude-desktop.md)
- Servers runbook: [servers/README.md](./servers/README.md)

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
