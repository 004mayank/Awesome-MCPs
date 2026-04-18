#!/usr/bin/env node
import {
  connectSlackMcp,
  connectNotionMcp,
  connectJiraMcp,
  connectLinearMcp,
  callTool,
} from './mcp-clients.js';

function usage() {
  console.log(`Slack/Notion/Jira/Linear Agent\n\nCommands:\n  slack:channels\n  slack:search --q <query>\n  slack:send --channel <id> --text <text> [--confirm]\n\n  notion:search --q <query>\n  notion:get --page <page_id>\n  notion:append --block <id> --text <paragraph> [--confirm]\n\n  jira:projects\n  jira:search --jql <jql>\n  jira:create --project <KEY> --type <Task|Bug> --summary <text> [--desc <text>] [--confirm]\n\n  linear:teams\n  linear:search --q <query>\n  linear:create --team <teamId> --title <text> [--desc <text>] [--confirm]\n`);
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
  if (cmd.startsWith('slack:')) {
    const { client, transport } = await connectSlackMcp();
    try {
      if (cmd === 'slack:channels') {
        const out = await callTool(client, 'slack_list_channels', {});
        console.log(JSON.stringify(out, null, 2));
      } else if (cmd === 'slack:search') {
        const q = getArg('--q');
        if (!q) throw new Error('Missing --q');
        const out = await callTool(client, 'slack_search_messages', { query: q });
        console.log(JSON.stringify(out, null, 2));
      } else if (cmd === 'slack:send') {
        const channel = getArg('--channel');
        const text = getArg('--text');
        if (!channel || !text) throw new Error('Missing --channel or --text');
        const out = await callTool(client, 'slack_send_message', {
          channel,
          text,
          confirm: hasFlag('--confirm'),
        });
        console.log(JSON.stringify(out, null, 2));
      } else {
        throw new Error(`Unknown command: ${cmd}`);
      }
    } finally {
      await transport.close();
    }
    return;
  }

  if (cmd.startsWith('notion:')) {
    const { client, transport } = await connectNotionMcp();
    try {
      if (cmd === 'notion:search') {
        const q = getArg('--q');
        const out = await callTool(client, 'notion_search', { query: q || undefined });
        console.log(JSON.stringify(out, null, 2));
      } else if (cmd === 'notion:get') {
        const page = getArg('--page');
        if (!page) throw new Error('Missing --page');
        const out = await callTool(client, 'notion_get_page', { page_id: page });
        console.log(JSON.stringify(out, null, 2));
      } else if (cmd === 'notion:append') {
        const block = getArg('--block');
        const text = getArg('--text');
        if (!block || !text) throw new Error('Missing --block or --text');
        const out = await callTool(client, 'notion_append_blocks', {
          block_id: block,
          paragraphs: [text],
          confirm: hasFlag('--confirm'),
        });
        console.log(JSON.stringify(out, null, 2));
      } else {
        throw new Error(`Unknown command: ${cmd}`);
      }
    } finally {
      await transport.close();
    }
    return;
  }

  if (cmd.startsWith('jira:')) {
    const { client, transport } = await connectJiraMcp();
    try {
      if (cmd === 'jira:projects') {
        const out = await callTool(client, 'jira_list_projects', {});
        console.log(JSON.stringify(out, null, 2));
      } else if (cmd === 'jira:search') {
        const jql = getArg('--jql');
        if (!jql) throw new Error('Missing --jql');
        const out = await callTool(client, 'jira_search_issues', { jql });
        console.log(JSON.stringify(out, null, 2));
      } else if (cmd === 'jira:create') {
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
      } else {
        throw new Error(`Unknown command: ${cmd}`);
      }
    } finally {
      await transport.close();
    }
    return;
  }

  if (cmd.startsWith('linear:')) {
    const { client, transport } = await connectLinearMcp();
    try {
      if (cmd === 'linear:teams') {
        const out = await callTool(client, 'linear_list_teams', {});
        console.log(JSON.stringify(out, null, 2));
      } else if (cmd === 'linear:search') {
        const q = getArg('--q');
        if (!q) throw new Error('Missing --q');
        const out = await callTool(client, 'linear_search_issues', { query: q });
        console.log(JSON.stringify(out, null, 2));
      } else if (cmd === 'linear:create') {
        const teamId = getArg('--team');
        const title = getArg('--title');
        const description = getArg('--desc');
        if (!teamId || !title) throw new Error('Missing --team/--title');
        const out = await callTool(client, 'linear_create_issue', {
          teamId,
          title,
          description: description || undefined,
          confirm: hasFlag('--confirm'),
        });
        console.log(JSON.stringify(out, null, 2));
      } else {
        throw new Error(`Unknown command: ${cmd}`);
      }
    } finally {
      await transport.close();
    }
    return;
  }

  throw new Error(`Unknown command: ${cmd}`);
}

main().catch((e) => {
  console.error(e?.stack || String(e));
  process.exit(1);
});
