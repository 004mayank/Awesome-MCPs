#!/usr/bin/env node
import { connectConfluenceMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Confluence Agent\n\nCommands:\n  search --cql <cql> [--limit <n>]\n  get --id <page_id>\n  create --space <KEY> --title <title> --html <storage_html> [--parent <page_id>] [--confirm]\n  update --id <page_id> --version <n> --html <storage_html> [--title <title>] [--confirm]\n`);
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
  const { client, transport } = await connectConfluenceMcp();
  try {
    if (cmd === 'search') {
      const cql = getArg('--cql');
      const limit = getArg('--limit');
      if (!cql) throw new Error('Missing --cql');
      const out = await callTool(client, 'confluence_search', { cql, limit: limit ? Number(limit) : undefined });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'get') {
      const id = getArg('--id');
      if (!id) throw new Error('Missing --id');
      const out = await callTool(client, 'confluence_get_page', { page_id: id });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'create') {
      const space = getArg('--space');
      const title = getArg('--title');
      const html = getArg('--html');
      const parent = getArg('--parent');
      if (!space || !title || !html) throw new Error('Missing --space/--title/--html');
      const out = await callTool(client, 'confluence_create_page', {
        space_key: space,
        title,
        storage_html: html,
        parent_page_id: parent || undefined,
        confirm: hasFlag('--confirm'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'update') {
      const id = getArg('--id');
      const version = getArg('--version');
      const html = getArg('--html');
      const title = getArg('--title');
      if (!id || !version || !html) throw new Error('Missing --id/--version/--html');
      const out = await callTool(client, 'confluence_update_page', {
        page_id: id,
        version_number: Number(version),
        storage_html: html,
        title: title || undefined,
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
