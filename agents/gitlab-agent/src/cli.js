#!/usr/bin/env node
import { connectGitlabMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`GitLab Agent\n\nCommands:\n  projects [--search <text>]\n  mrs --project <id> [--state opened|merged|closed|all]\n  pipelines --project <id> [--ref <branch>]
  jobs --project <id> --pipeline <pipeline_id>
  comment-mr --project <id> --mr <iid> --text <comment> [--confirm]
  create-issue --project <id> --title <text> [--desc <text>] [--confirm]\n`);
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
  const { client, transport } = await connectGitlabMcp();
  try {
    if (cmd === 'projects') {
      const search = getArg('--search');
      const out = await callTool(client, 'gitlab_list_projects', { search: search || undefined });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'mrs') {
      const project = getArg('--project');
      const state = getArg('--state');
      if (!project) throw new Error('Missing --project');
      const out = await callTool(client, 'gitlab_list_merge_requests', {
        project_id: Number(project),
        state: state || undefined,
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    if (cmd === 'pipelines') {
      const project = getArg('--project');
      const ref = getArg('--ref');
      if (!project) throw new Error('Missing --project');
      const out = await callTool(client, 'gitlab_list_pipelines', {
        project_id: Number(project),
        ref: ref || undefined,
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'jobs') {
      const project = getArg('--project');
      const pipeline = getArg('--pipeline');
      if (!project || !pipeline) throw new Error('Missing --project or --pipeline');
      const out = await callTool(client, 'gitlab_list_pipeline_jobs', {
        project_id: Number(project),
        pipeline_id: Number(pipeline),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'comment-mr') {
      const project = getArg('--project');
      const mr = getArg('--mr');
      const text = getArg('--text');
      if (!project || !mr || !text) throw new Error('Missing --project/--mr/--text');
      const out = await callTool(client, 'gitlab_add_merge_request_note', {
        project_id: Number(project),
        mr_iid: Number(mr),
        body: text,
        confirm: hasFlag('--confirm'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'create-issue') {
      const project = getArg('--project');
      const title = getArg('--title');
      const description = getArg('--desc');
      if (!project || !title) throw new Error('Missing --project or --title');
      const out = await callTool(client, 'gitlab_create_issue', {
        project_id: Number(project),
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
