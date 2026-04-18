#!/usr/bin/env node
import { connectAsanaMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Asana Agent\n\nCommands:\n  workspaces\n  search --workspace <gid> [--text <query>] [--assignee <gid>] [--completed true|false]\n  create --workspace <gid> --name <task name> [--notes <text>] [--assignee <gid>] [--confirm]\n`);
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
  const { client, transport } = await connectAsanaMcp();
  try {
    if (cmd === 'workspaces') {
      const out = await callTool(client, 'asana_list_workspaces', {});
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'search') {
      const workspace = getArg('--workspace');
      if (!workspace) throw new Error('Missing --workspace');
      const text = getArg('--text');
      const assignee = getArg('--assignee');
      const completed = parseBool(getArg('--completed'));
      const out = await callTool(client, 'asana_search_tasks', {
        workspace_gid: workspace,
        text: text || undefined,
        assignee: assignee || undefined,
        completed,
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'create') {
      const workspace = getArg('--workspace');
      const name = getArg('--name');
      const notes = getArg('--notes');
      const assignee = getArg('--assignee');
      if (!workspace || !name) throw new Error('Missing --workspace or --name');
      const out = await callTool(client, 'asana_create_task', {
        workspace_gid: workspace,
        name,
        notes: notes || undefined,
        assignee: assignee || undefined,
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
