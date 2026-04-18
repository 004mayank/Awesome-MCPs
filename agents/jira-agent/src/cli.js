#!/usr/bin/env node
import { connectJiraMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Jira Agent\n\nCommands:\n  projects\n  search --jql <jql>\n  create --project <KEY> --type <Task|Bug> --summary <text> [--desc <text>] [--confirm]\n  comment --issue <KEY-123> --text <comment> [--confirm]\n`);
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
  const { client, transport } = await connectJiraMcp();
  try {
    if (cmd === 'projects') {
      const out = await callTool(client, 'jira_list_projects', {});
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'search') {
      const jql = getArg('--jql');
      if (!jql) throw new Error('Missing --jql');
      const out = await callTool(client, 'jira_search_issues', { jql });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'create') {
      const projectKey = getArg('--project');
      const issueType = getArg('--type');
      const summary = getArg('--summary');
      const description = getArg('--desc');
      if (!projectKey || !issueType || !summary) throw new Error('Missing --project/--type/--summary');
      const out = await callTool(client, 'jira_create_issue', {
        projectKey,
        issueType,
        summary,
        description: description || undefined,
        confirm: hasFlag('--confirm'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'comment') {
      const issueKey = getArg('--issue');
      const text = getArg('--text');
      if (!issueKey || !text) throw new Error('Missing --issue or --text');
      const out = await callTool(client, 'jira_add_comment', {
        issueKey,
        body: text,
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
