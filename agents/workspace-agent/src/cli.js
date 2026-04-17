#!/usr/bin/env node

import fs from 'node:fs/promises';

import {
  connectSearchMcp,
  connectGithubMcp,
  connectDriveMcp,
  connectGmailMcp,
  connectCalendarMcp,
  callTool,
} from './mcp-clients.js';

import { llmGenerate } from './llm.js';

function argMap(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (!nxt || nxt.startsWith('--')) out[k] = true;
      else { out[k] = nxt; i++; }
    } else out._.push(a);
  }
  return out;
}

function usage() {
  console.log(`Workspace Agent

Usage:
  node src/cli.js search --query "..." [--sources "filesystem,github,google_drive,gmail"]
  node src/cli.js brief --query "..." [--sources "..."]

This agent uses Search MCP to find relevant items, then produces a brief.

Env:
  (depends on underlying MCPs)
  FS_ROOTS, GITHUB_TOKEN, GOOGLE_CLIENT_ID/SECRET/REDIRECT
  LLM_PROVIDER=openai|anthropic
  OPENAI_API_KEY or ANTHROPIC_API_KEY
`);
}

async function systemPrompt() {
  return fs.readFile(new URL('../prompts/system.md', import.meta.url), 'utf8');
}

function csv(s) {
  return (s || '').split(',').map(x => x.trim()).filter(Boolean);
}

async function main() {
  const args = argMap(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || args.help) return usage();

  const sys = await systemPrompt();

  if (cmd === 'search') {
    const { client } = await connectSearchMcp();
    const sources = args.sources ? csv(args.sources) : undefined;
    const data = await callTool(client, 'search_query', { query: args.query, sources, limit: 20 });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'brief') {
    const { client: searchClient } = await connectSearchMcp();
    const sources = args.sources ? csv(args.sources) : undefined;
    const data = await callTool(searchClient, 'search_query', { query: args.query, sources, limit: 20 });

    const brief = await llmGenerate({
      system: sys,
      user: `Create a concise brief from these cross-source search results.\n\nInclude: summary, key items, and recommended next actions.\n\n${JSON.stringify(data).slice(0, 14000)}`,
    });

    console.log(brief);
    return;
  }

  usage();
}

main().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
