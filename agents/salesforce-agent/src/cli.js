#!/usr/bin/env node
import { connectSalesforceMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Salesforce Agent\n\nCommands:\n  limits\n  sobjects\n  describe --sobject <SObject>\n  query --soql <soql>\n  search --sosl <sosl>\n  get --sobject <SObject> --id <Id> [--fields "Id,Name"]\n  create --sobject <SObject> --fields <json> [--confirm]\n  update --sobject <SObject> --id <Id> --fields <json> [--confirm]\n\nExamples:\n  node src/cli.js query --soql "SELECT Id, Name FROM Account LIMIT 5"\n  node src/cli.js search --sosl "FIND {acme} IN ALL FIELDS RETURNING Account(Id,Name)"\n  node src/cli.js get --sobject Account --id 001... --fields "Id,Name"\n  node src/cli.js create --sobject Account --fields '{"Name":"Acme"}' --confirm\n  node src/cli.js update --sobject Account --id 001... --fields '{"Name":"Acme 2"}' --confirm\n`);
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
  const { client, transport } = await connectSalesforceMcp();
  try {
    if (cmd === 'limits') {
      const out = await callTool(client, 'salesforce_limits', {});
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'sobjects') {
      const out = await callTool(client, 'salesforce_sobjects_list', {});
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'describe') {
      const sobject = getArg('--sobject');
      if (!sobject) throw new Error('Missing --sobject');
      const out = await callTool(client, 'salesforce_describe_sobject', { sobject });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'query') {
      const soql = getArg('--soql');
      if (!soql) throw new Error('Missing --soql');
      const out = await callTool(client, 'salesforce_query', { soql });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'search') {
      const sosl = getArg('--sosl');
      if (!sosl) throw new Error('Missing --sosl');
      const out = await callTool(client, 'salesforce_search_sosl', { sosl });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'get') {
      const sobject = getArg('--sobject');
      const id = getArg('--id');
      const fields = getArg('--fields');
      if (!sobject || !id) throw new Error('Missing --sobject or --id');
      const out = await callTool(client, 'salesforce_get_record', {
        sobject,
        id,
        fields: fields || undefined,
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'create') {
      const sobject = getArg('--sobject');
      const fieldsRaw = getArg('--fields');
      if (!sobject || !fieldsRaw) throw new Error('Missing --sobject or --fields');
      let fields;
      try {
        fields = JSON.parse(fieldsRaw);
      } catch {
        throw new Error('--fields must be valid JSON');
      }
      const out = await callTool(client, 'salesforce_create_record', {
        sobject,
        fields,
        confirm: hasFlag('--confirm'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'update') {
      const sobject = getArg('--sobject');
      const id = getArg('--id');
      const fieldsRaw = getArg('--fields');
      if (!sobject || !id || !fieldsRaw) throw new Error('Missing --sobject/--id/--fields');
      let fields;
      try {
        fields = JSON.parse(fieldsRaw);
      } catch {
        throw new Error('--fields must be valid JSON');
      }
      const out = await callTool(client, 'salesforce_update_record', {
        sobject,
        id,
        fields,
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
