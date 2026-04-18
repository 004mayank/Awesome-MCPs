#!/usr/bin/env node
import { connectLinearMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Linear Agent\n\nCommands:\n  teams\n  search --q <query>\n  create --team <teamId> --title <text> [--desc <text>] [--confirm]\n`);
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
  const { client, transport } = await connectLinearMcp();
  try {
    if (cmd === 'teams') {
      const out = await callTool(client, 'linear_list_teams', {});
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'search') {
      const q = getArg('--q');
      if (!q) throw new Error('Missing --q');
      const out = await callTool(client, 'linear_search_issues', { query: q });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'create') {
      const teamId = getArg('--team');
      const title = getArg('--title');
      const description = getArg('--desc');
      if (!teamId || !title) throw new Error('Missing --team or --title');
      const out = await callTool(client, 'linear_create_issue', {
        teamId,
        title,
        description: description || undefined,
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
