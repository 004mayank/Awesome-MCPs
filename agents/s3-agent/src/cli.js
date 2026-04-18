#!/usr/bin/env node
import { connectS3Mcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`S3 Agent\n\nCommands:\n  buckets\n  list [--bucket <name>] [--prefix <p>]\n  get --key <key> [--bucket <name>]\n  put --key <key> --text <text> [--bucket <name>] [--confirm]\n  presign-get --key <key> [--bucket <name>] [--expires <seconds>]\n`);
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
  const { client, transport } = await connectS3Mcp();
  try {
    if (cmd === 'buckets') {
      const out = await callTool(client, 's3_list_buckets', {});
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'list') {
      const bucket = getArg('--bucket');
      const prefix = getArg('--prefix');
      const out = await callTool(client, 's3_list_objects', {
        bucket: bucket || undefined,
        prefix: prefix || undefined,
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'get') {
      const bucket = getArg('--bucket');
      const key = getArg('--key');
      if (!key) throw new Error('Missing --key');
      const out = await callTool(client, 's3_get_object_text', {
        bucket: bucket || undefined,
        key,
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'put') {
      const bucket = getArg('--bucket');
      const key = getArg('--key');
      const text = getArg('--text');
      if (!key || text === null) throw new Error('Missing --key or --text');
      const out = await callTool(client, 's3_put_object_text', {
        bucket: bucket || undefined,
        key,
        text,
        confirm: hasFlag('--confirm'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'presign-get') {
      const bucket = getArg('--bucket');
      const key = getArg('--key');
      const expires = getArg('--expires');
      if (!key) throw new Error('Missing --key');
      const out = await callTool(client, 's3_presign_get', {
        bucket: bucket || undefined,
        key,
        expiresInSeconds: expires ? Number(expires) : undefined,
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
