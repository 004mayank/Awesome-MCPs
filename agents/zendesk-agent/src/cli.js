#!/usr/bin/env node
import { connectZendeskMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Zendesk Agent\n\nCommands:\n  search --q <query>\n  get --id <ticket_id> [--comments]\n  comment --id <ticket_id> --text <comment> [--public true|false] [--confirm]\n`);
}

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function parseBool(s) {
  if (s === null || s === undefined) return undefined;
  if (s === 'true') return true;
  if (s === 'false') return false;
  return undefined;
}

const cmd = process.argv[2];
if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

async function main() {
  const { client, transport } = await connectZendeskMcp();
  try {
    if (cmd === 'search') {
      const q = getArg('--q');
      if (!q) throw new Error('Missing --q');
      const out = await callTool(client, 'zendesk_search_tickets', { query: q });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'get') {
      const id = getArg('--id');
      if (!id) throw new Error('Missing --id');
      const out = await callTool(client, 'zendesk_get_ticket', {
        ticket_id: Number(id),
        include_comments: hasFlag('--comments'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'comment') {
      const id = getArg('--id');
      const text = getArg('--text');
      if (!id || !text) throw new Error('Missing --id or --text');
      const pub = parseBool(getArg('--public'));
      const out = await callTool(client, 'zendesk_add_comment', {
        ticket_id: Number(id),
        body: text,
        public: pub,
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
