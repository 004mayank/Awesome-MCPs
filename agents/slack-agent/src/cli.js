#!/usr/bin/env node
import { connectSlackMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Slack Agent\n\nCommands:\n  channels\n  search --q <query>\n  send --channel <id> --text <text> [--confirm]\n`);
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
  const { client, transport } = await connectSlackMcp();
  try {
    if (cmd === 'channels') {
      const out = await callTool(client, 'slack_list_channels', {});
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'search') {
      const q = getArg('--q');
      if (!q) throw new Error('Missing --q');
      const out = await callTool(client, 'slack_search_messages', { query: q });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'send') {
      const channel = getArg('--channel');
      const text = getArg('--text');
      if (!channel || !text) throw new Error('Missing --channel or --text');
      const out = await callTool(client, 'slack_send_message', { channel, text, confirm: hasFlag('--confirm') });
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
