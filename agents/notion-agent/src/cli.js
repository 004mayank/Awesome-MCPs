#!/usr/bin/env node
import { connectNotionMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Notion Agent\n\nCommands:\n  search [--q <query>]\n  get --page <page_id>\n  append --block <block_id> --text <paragraph> [--confirm]\n  create --db <database_id> --title <title> [--confirm]\n`);
}

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

const cmd = process.argv[2];
if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

async function main() {
  const { client, transport } = await connectNotionMcp();
  try {
    if (cmd === 'search') {
      const q = getArg('--q');
      const out = await callTool(client, 'notion_search', { query: q || undefined });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'get') {
      const page = getArg('--page');
      if (!page) throw new Error('Missing --page');
      const out = await callTool(client, 'notion_get_page', { page_id: page });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'append') {
      const block = getArg('--block');
      const text = getArg('--text');
      if (!block || !text) throw new Error('Missing --block or --text');
      const out = await callTool(client, 'notion_append_blocks', {
        block_id: block,
        paragraphs: [text],
        confirm: hasFlag('--confirm'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'create') {
      const db = getArg('--db');
      const title = getArg('--title');
      if (!db || !title) throw new Error('Missing --db or --title');
      const out = await callTool(client, 'notion_create_page', {
        parent_database_id: db,
        title,
        confirm: hasFlag('--confirm'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    throw new Error(`Unknown command: ${cmd}`);
  } finally {
    await transport.close();
  }
}

main().catch((e) => {
  console.error(e?.stack || String(e));
  process.exit(1);
});
