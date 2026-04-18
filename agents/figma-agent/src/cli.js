#!/usr/bin/env node
import { connectFigmaMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Figma Agent\n\nCommands:\n  file --key <file_key>\n  nodes --key <file_key> --ids <id1,id2>\n  projects --team <team_id>\n`);
}

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

const cmd = process.argv[2];
if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

async function main() {
  const { client, transport } = await connectFigmaMcp();
  try {
    if (cmd === 'file') {
      const key = getArg('--key');
      if (!key) throw new Error('Missing --key');
      const out = await callTool(client, 'figma_get_file', { file_key: key });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'nodes') {
      const key = getArg('--key');
      const ids = getArg('--ids');
      if (!key || !ids) throw new Error('Missing --key or --ids');
      const out = await callTool(client, 'figma_get_file_nodes', { file_key: key, ids });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'projects') {
      const team = getArg('--team');
      if (!team) throw new Error('Missing --team');
      const out = await callTool(client, 'figma_list_team_projects', { team_id: team });
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
