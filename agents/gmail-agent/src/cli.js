#!/usr/bin/env node

import fs from 'node:fs/promises';

import { connectGmailMcp, callTool } from './mcp-client.js';
import { llmGenerate } from './llm.js';

function argMap(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (!nxt || nxt.startsWith('--')) {
        out[k] = true;
      } else {
        out[k] = nxt;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function usage() {
  console.log(`Gmail Agent

Usage:
  node src/cli.js search --q "..."
  node src/cli.js thread --threadId <id>
  node src/cli.js summarize --threadId <id>
  node src/cli.js draft-reply --threadId <id> --body "..." [--confirm]
  node src/cli.js send-draft --draftId <id> [--confirm]

Env:
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
  LLM_PROVIDER=openai|anthropic
  OPENAI_API_KEY or ANTHROPIC_API_KEY
  LLM_MODEL (optional)
`);
}

async function systemPrompt() {
  return fs.readFile(new URL('../prompts/system.md', import.meta.url), 'utf8');
}

async function main() {
  const args = argMap(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || args.help) return usage();

  const confirm = args.confirm === true;
  const { client } = await connectGmailMcp();
  const sys = await systemPrompt();

  if (cmd === 'search') {
    const q = args.q;
    const data = await callTool(client, 'gmail_search', { q, maxResults: 10 });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'thread') {
    const threadId = args.threadId;
    const data = await callTool(client, 'gmail_get_thread', { threadId, format: 'full' });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'summarize') {
    const threadId = args.threadId;
    const thread = await callTool(client, 'gmail_get_thread', { threadId, format: 'full' });
    const summary = await llmGenerate({
      system: sys,
      user: `Summarize this email thread. Provide: (1) what happened (2) decisions (3) action items (4) suggested reply tone.\n\n${JSON.stringify(thread).slice(0, 14000)}`,
    });
    console.log(summary);
    return;
  }

  if (cmd === 'draft-reply') {
    const threadId = args.threadId;
    const body = args.body;
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to create draft reply.');
      console.log(JSON.stringify({ threadId, body }, null, 2));
      return;
    }
    const data = await callTool(client, 'gmail_create_draft_reply', { threadId, body, confirm: true });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'send-draft') {
    const draftId = args.draftId;
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to send draft.');
      console.log(JSON.stringify({ draftId }, null, 2));
      return;
    }
    const data = await callTool(client, 'gmail_send_draft', { draftId, confirm: true });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  usage();
}

main().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
