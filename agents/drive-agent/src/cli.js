#!/usr/bin/env node

import fs from 'node:fs/promises';

import { connectDriveMcp, callTool } from './mcp-client.js';
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
  console.log(`Drive Agent

Usage:
  node src/cli.js search --q "..."
  node src/cli.js export-text --fileId <id>
  node src/cli.js summarize --fileId <id>

Write (requires --confirm):
  node src/cli.js create-folder --name "..." [--parentId <id>] [--confirm]
  node src/cli.js upload-text --name "file.txt" --content "..." [--parentId <id>] [--confirm]
  node src/cli.js copy --fileId <id> [--newName "..."] [--parentId <id>] [--confirm]
  node src/cli.js move --fileId <id> [--addParents "id1,id2"] [--removeParents "id3"] [--confirm]
  node src/cli.js delete --fileId <id> [--confirm]

Env:
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
  LLM_PROVIDER=openai|anthropic
  OPENAI_API_KEY or ANTHROPIC_API_KEY
  LLM_MODEL (optional)
`);
}

async function systemPrompt() {
  return fs.readFile(new URL('../prompts/system.md', import.meta.url), 'utf8');
}

function csv(s) {
  return (s || '').split(',').map(x => x.trim()).filter(Boolean);
}

async function main() {
  const args = argMap(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || args.help) return usage();

  const confirm = args.confirm === true;
  const { client } = await connectDriveMcp();
  const sys = await systemPrompt();

  if (cmd === 'search') {
    const q = args.q;
    const data = await callTool(client, 'drive_search', { q: `name contains '${q.replace(/'/g, "\\'")}' and trashed=false`, pageSize: 20 });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'export-text') {
    const fileId = args.fileId;
    const data = await callTool(client, 'drive_export_text', { fileId });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'summarize') {
    const fileId = args.fileId;
    const exported = await callTool(client, 'drive_export_text', { fileId });
    const summary = await llmSummarize({
      system: sys,
      user: `Summarize this document. Extract key decisions and action items.\n\n${JSON.stringify(exported).slice(0, 14000)}`,
    });
    console.log(summary);
    return;
  }

  // Write tools
  if (cmd === 'create-folder') {
    const name = args.name;
    const parentId = args.parentId;
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to create folder.');
      console.log(JSON.stringify({ name, parentId }, null, 2));
      return;
    }
    const data = await callTool(client, 'drive_create_folder', { name, parentId, confirm: true });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'upload-text') {
    const name = args.name;
    const content = args.content;
    const parentId = args.parentId;
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to upload.');
      console.log(JSON.stringify({ name, parentId, mimeType: 'text/plain', bytes: Buffer.byteLength(content || '', 'utf8') }, null, 2));
      return;
    }
    const data = await callTool(client, 'drive_upload_text', { name, content, parentId, mimeType: 'text/plain', confirm: true });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'copy') {
    const fileId = args.fileId;
    const newName = args.newName;
    const parentId = args.parentId;
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to copy.');
      console.log(JSON.stringify({ fileId, newName, parentId }, null, 2));
      return;
    }
    const data = await callTool(client, 'drive_copy_file', { fileId, newName, parentId, confirm: true });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'move') {
    const fileId = args.fileId;
    const addParents = csv(args.addParents);
    const removeParents = csv(args.removeParents);
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to move.');
      console.log(JSON.stringify({ fileId, addParents, removeParents }, null, 2));
      return;
    }
    const data = await callTool(client, 'drive_move_file', { fileId, addParents, removeParents, confirm: true });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'delete') {
    const fileId = args.fileId;
    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to delete file.');
      console.log(JSON.stringify({ fileId }, null, 2));
      return;
    }
    const data = await callTool(client, 'drive_delete_file', { fileId, confirm: true });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  usage();
}

main().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
