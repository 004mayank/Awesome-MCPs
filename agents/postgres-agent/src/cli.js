#!/usr/bin/env node
import { connectPostgresMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Postgres Agent\n\nCommands:\n  tables [--schema <schema>]\n  describe --table <name|schema.name>\n  query --sql <select> [--limit <n>]\n  execute --sql <write-sql> [--confirm]\n`);
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
  const { client, transport } = await connectPostgresMcp();
  try {
    if (cmd === 'tables') {
      const schema = getArg('--schema');
      const out = await callTool(client, 'pg_list_tables', { schema: schema || undefined });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'describe') {
      const table = getArg('--table');
      if (!table) throw new Error('Missing --table');
      const out = await callTool(client, 'pg_describe_table', { table });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'query') {
      const sql = getArg('--sql');
      const limit = getArg('--limit');
      if (!sql) throw new Error('Missing --sql');
      const out = await callTool(client, 'pg_query', { sql, limit: limit ? Number(limit) : undefined });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'execute') {
      const sql = getArg('--sql');
      if (!sql) throw new Error('Missing --sql');
      const out = await callTool(client, 'pg_execute', { sql, confirm: hasFlag('--confirm') });
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
