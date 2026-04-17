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

## MCP Servers

### 1. Search MCP

* Unified search across web / docs / APIs
* Returns structured results for agents
* Supports semantic + keyword search

### 2. File System MCP

* Read/write/manage local files
* Secure sandboxed access
* Supports multiple formats (txt, json, csv)

### 3. Browser MCP

* Headless browsing for agents
* Scraping + interaction
* Useful for automation tasks

### 4. Code Execution MCP

* Run code safely (Python/JS)
* Return outputs to agent
* Great for data + reasoning tasks

### 5. Database MCP

* Query SQL/NoSQL databases
* Structured responses
* Supports analytics use cases

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
