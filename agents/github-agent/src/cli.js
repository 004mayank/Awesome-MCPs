#!/usr/bin/env node

import fs from 'node:fs/promises';

import { connectGithubMcp, callTool } from './mcp-client.js';
import { llmSummarize } from './llm.js';

function argMap(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (!nxt || nxt.startsWith('--')) {
        out[k] = true;
      } else {
        out[k] = nxt;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function usage() {
  console.log(`GitHub Agent

Usage:
  node src/cli.js prs --owner <o> --repo <r>
  node src/cli.js issues --owner <o> --repo <r>
  node src/cli.js analyze-pr --owner <o> --repo <r> --number <n>
  node src/cli.js search --q "..." [--limit 10]
  node src/cli.js file --owner <o> --repo <r> --path <filePath> [--ref <branch|sha>]

Actions / CI:
  node src/cli.js workflow-runs --owner <o> --repo <r> [--branch main]
  node src/cli.js workflow-run --owner <o> --repo <r> --runId <id>
  node src/cli.js workflow-logs --owner <o> --repo <r> --runId <id>

Write (requires --confirm):
  node src/cli.js create-issue --owner <o> --repo <r> --title "..." [--body "..."] [--labels "a,b"] [--confirm]
  node src/cli.js comment --owner <o> --repo <r> --number <issueOrPr> --body "..." [--confirm]
  node src/cli.js label-add --owner <o> --repo <r> --number <issueOrPr> --labels "a,b" [--confirm]
  node src/cli.js label-remove --owner <o> --repo <r> --number <issueOrPr> --name "label" [--confirm]
  node src/cli.js close --owner <o> --repo <r> --number <issue> [--confirm]
  node src/cli.js reopen --owner <o> --repo <r> --number <issue> [--confirm]
  node src/cli.js merge --owner <o> --repo <r> --number <pr> [--method merge|squash|rebase] [--confirm]
  node src/cli.js workflow-dispatch --owner <o> --repo <r> --workflow <fileOrId> --ref <branch|tag|sha> [--inputs '{"k":"v"}'] [--confirm]

Env:
  GITHUB_TOKEN (required)
  LLM_PROVIDER=openai|anthropic
  OPENAI_API_KEY or ANTHROPIC_API_KEY
  LLM_MODEL (optional)
`);
}

async function systemPrompt() {
  return fs.readFile(new URL('../prompts/system.md', import.meta.url), 'utf8');
}

function csvLabels(s) {
  return (s || '').split(',').map(x => x.trim()).filter(Boolean);
}

async function main() {
  const argv = process.argv.slice(2);
  const args = argMap(argv);
  const cmd = args._[0];
  if (!cmd || args.help) return usage();

  const { client } = await connectGithubMcp();
  const sys = await systemPrompt();

  const owner = args.owner;
  const repo = args.repo;
  const confirm = args.confirm === true;

  if (cmd === 'prs') {
    const prs = await callTool(client, 'gh_list_prs', { owner, repo, state: 'open', per_page: 20 });
    const summary = await llmSummarize({
      system: sys,
      user: `Summarize these PRs for a human. Focus on risk, size, and what to review first.\n\n${JSON.stringify(prs).slice(0, 12000)}`,
    });
    console.log(summary);
    return;
  }

  if (cmd === 'issues') {
    const issues = await callTool(client, 'gh_list_issues', { owner, repo, state: 'open', per_page: 20 });
    const summary = await llmSummarize({
      system: sys,
      user: `Summarize these issues for a human. Cluster by theme and suggest next actions.\n\n${JSON.stringify(issues).slice(0, 12000)}`,
    });
    console.log(summary);
    return;
  }

  if (cmd === 'analyze-pr') {
    const number = Number(args.number);
    const pr = await callTool(client, 'gh_get_pr', { owner, repo, number });
    const diff = await callTool(client, 'gh_get_pr_diff', { owner, repo, number });

    const report = await llmSummarize({
      system: sys,
      user: `Analyze this PR. Provide: (1) what changed (2) risks (3) suggested tests (4) review checklist.\n\nPR:\n${JSON.stringify(pr).slice(0, 12000)}\n\nDIFF (truncated):\n${JSON.stringify(diff).slice(0, 12000)}`,
    });

    console.log(report);
    return;
  }

  if (cmd === 'file') {
    const file_path = args.path;
    const ref = args.ref;
    const data = await callTool(client, 'gh_get_file', { owner, repo, file_path, ref });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'workflow-runs') {
    const branch = args.branch;
    const data = await callTool(client, 'gh_list_workflow_runs', { owner, repo, branch, per_page: 20 });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'workflow-run') {
    const run_id = Number(args.runId);
    const data = await callTool(client, 'gh_get_workflow_run', { owner, repo, run_id });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'workflow-logs') {
    const run_id = Number(args.runId);
    const data = await callTool(client, 'gh_get_workflow_run_logs_url', { owner, repo, run_id });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'search') {
    const q = args.q;
    const limit = Number(args.limit || 10);
    const results = await callTool(client, 'gh_search_issues_prs', { q, per_page: limit });
    const summary = await llmSummarize({
      system: sys,
      user: `Summarize these GitHub search results and suggest which to open first.\n\n${JSON.stringify(results).slice(0, 12000)}`,
    });
    console.log(summary);
    return;
  }

  // ----------------
  // Write commands
  // ----------------

  if (cmd === 'create-issue') {
    const title = args.title;
    const body = args.body;
    const labels = csvLabels(args.labels);
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to create issue.');
      console.log(JSON.stringify({ owner, repo, title, body, labels }, null, 2));
      return;
    }
    const issue = await callTool(client, 'gh_create_issue', { owner, repo, title, body, labels, confirm: true });
    console.log(JSON.stringify(issue, null, 2));
    return;
  }

  if (cmd === 'comment') {
    const number = Number(args.number);
    const body = args.body;
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to comment.');
      console.log(JSON.stringify({ owner, repo, issue_number: number, body }, null, 2));
      return;
    }
    const res = await callTool(client, 'gh_create_comment', { owner, repo, issue_number: number, body, confirm: true });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === 'label-add') {
    const number = Number(args.number);
    const labels = csvLabels(args.labels);
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to add labels.');
      console.log(JSON.stringify({ owner, repo, issue_number: number, labels }, null, 2));
      return;
    }
    const res = await callTool(client, 'gh_add_labels', { owner, repo, issue_number: number, labels, confirm: true });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === 'label-remove') {
    const number = Number(args.number);
    const name = args.name;
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to remove label.');
      console.log(JSON.stringify({ owner, repo, issue_number: number, name }, null, 2));
      return;
    }
    const res = await callTool(client, 'gh_remove_label', { owner, repo, issue_number: number, name, confirm: true });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === 'close') {
    const number = Number(args.number);
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to close issue.');
      console.log(JSON.stringify({ owner, repo, issue_number: number }, null, 2));
      return;
    }
    const res = await callTool(client, 'gh_close_issue', { owner, repo, issue_number: number, confirm: true });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === 'reopen') {
    const number = Number(args.number);
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to reopen issue.');
      console.log(JSON.stringify({ owner, repo, issue_number: number }, null, 2));
      return;
    }
    const res = await callTool(client, 'gh_reopen_issue', { owner, repo, issue_number: number, confirm: true });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === 'merge') {
    const number = Number(args.number);
    const merge_method = args.method;
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to merge PR.');
      console.log(JSON.stringify({ owner, repo, number, merge_method }, null, 2));
      return;
    }
    const res = await callTool(client, 'gh_merge_pr', { owner, repo, number, merge_method, confirm: true });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  if (cmd === 'workflow-dispatch') {
    const workflow_id = args.workflow;
    const ref = args.ref;
    let inputs = undefined;
    if (args.inputs) {
      try { inputs = JSON.parse(args.inputs); } catch { throw new Error('inputs must be valid JSON'); }
    }

    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to dispatch workflow.');
      console.log(JSON.stringify({ owner, repo, workflow_id, ref, inputs }, null, 2));
      return;
    }

    const res = await callTool(client, 'gh_trigger_workflow_dispatch', { owner, repo, workflow_id, ref, inputs, confirm: true });
    console.log(JSON.stringify(res, null, 2));
    return;
  }

  usage();
}

main().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
