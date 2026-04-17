import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  McpServer,
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/index.js';

function parseRoots() {
  const raw = process.env.FS_ROOTS || '';
  const roots = raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(r => path.resolve(r));
  if (!roots.length) {
    throw new Error('FS_ROOTS is required (comma-separated absolute paths).');
  }
  return roots;
}

const ROOTS = parseRoots();
const MAX_BYTES = Number(process.env.FS_MAX_BYTES || '200000');
const MAX_WRITE_BYTES = Number(process.env.FS_MAX_WRITE_BYTES || '200000');
const MAX_RESULTS = Number(process.env.FS_MAX_RESULTS || '50');

function isWithinRoots(p) {
  const rp = path.resolve(p);
  return ROOTS.some(root => {
    const rr = path.resolve(root) + path.sep;
    return rp === path.resolve(root) || rp.startsWith(rr);
  });
}

function assertAllowed(p) {
  if (!isWithinRoots(p)) {
    throw new Error(`Path is outside allowed roots: ${p}`);
  }
}

function ensureConfirm(confirm) {
  if (confirm !== true) {
    throw new Error('Write operation requires confirm=true');
  }
}

async function statSafe(p) {
  assertAllowed(p);
  const st = await fs.stat(p);
  return {
    path: path.resolve(p),
    type: st.isDirectory() ? 'dir' : st.isFile() ? 'file' : 'other',
    sizeBytes: st.size,
    mtimeMs: st.mtimeMs,
  };
}

async function listDir(dirPath) {
  assertAllowed(dirPath);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.map(e => ({
    name: e.name,
    path: path.join(dirPath, e.name),
    type: e.isDirectory() ? 'dir' : e.isFile() ? 'file' : 'other',
  }));
}

async function readFileText(filePath) {
  const info = await statSafe(filePath);
  if (info.type !== 'file') throw new Error('Not a file');
  if (info.sizeBytes > MAX_BYTES) {
    throw new Error(`File too large (${info.sizeBytes} bytes). Max is ${MAX_BYTES}.`);
  }
  const buf = await fs.readFile(filePath);
  // Best-effort UTF-8
  return buf.toString('utf8');
}

async function writeFileText(filePath, content) {
  assertAllowed(filePath);
  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > MAX_WRITE_BYTES) {
    throw new Error(`Content too large (${bytes} bytes). Max is ${MAX_WRITE_BYTES}.`);
  }
  await fs.writeFile(filePath, content, 'utf8');
  return statSafe(filePath);
}

async function mkdirp(dirPath) {
  assertAllowed(dirPath);
  await fs.mkdir(dirPath, { recursive: true });
  return statSafe(dirPath);
}

async function deleteFile(filePath) {
  const info = await statSafe(filePath);
  if (info.type !== 'file') {
    throw new Error('fs_delete only supports deleting files (not directories) in v0');
  }
  await fs.unlink(filePath);
  return { ok: true };
}

async function movePath(from, to) {
  assertAllowed(from);
  assertAllowed(to);
  await fs.rename(from, to);
  return { ok: true };
}

async function copyFile(from, to) {
  const info = await statSafe(from);
  if (info.type !== 'file') throw new Error('fs_copy only supports files in v0');
  assertAllowed(to);
  await fs.copyFile(from, to);
  return statSafe(to);
}

async function walk(dir, out) {
  if (out.length >= MAX_RESULTS) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (out.length >= MAX_RESULTS) return;
    const p = path.join(dir, e.name);
    if (!isWithinRoots(p)) continue;
    if (e.isDirectory()) {
      // Skip noisy dirs
      if (e.name === 'node_modules' || e.name === '.git') continue;
      await walk(p, out);
    } else if (e.isFile()) {
      out.push(p);
    }
  }
}

async function search(root, query) {
  assertAllowed(root);
  const files = [];
  await walk(root, files);

  const matches = [];
  for (const f of files) {
    if (matches.length >= MAX_RESULTS) break;
    try {
      const st = await fs.stat(f);
      if (st.size > MAX_BYTES) continue;
      const txt = await fs.readFile(f, 'utf8');
      const idx = txt.toLowerCase().indexOf(query.toLowerCase());
      if (idx === -1) continue;
      // Provide small snippet around match
      const start = Math.max(0, idx - 80);
      const end = Math.min(txt.length, idx + query.length + 120);
      matches.push({
        path: f,
        index: idx,
        snippet: txt.slice(start, end),
      });
    } catch {
      // ignore unreadable
    }
  }
  return matches;
}

const server = new McpServer({
  name: 'filesystem-mcp',
  version: '0.1.0',
});

server.tool(
  'fs_list',
  {
    path: { type: 'string', description: 'Directory path (must be within FS_ROOTS allowlist).' },
  },
  async ({ path: p }) => {
    const info = await statSafe(p);
    if (info.type !== 'dir') throw new Error('Not a directory');
    const entries = await listDir(p);
    return {
      content: [
        { type: 'text', text: JSON.stringify({ info, entries }, null, 2) },
      ],
    };
  }
);

server.tool(
  'fs_read',
  {
    path: { type: 'string', description: 'File path (must be within FS_ROOTS allowlist).' },
  },
  async ({ path: p }) => {
    const info = await statSafe(p);
    const text = await readFileText(p);
    return {
      content: [
        { type: 'text', text: JSON.stringify({ info, text }, null, 2) },
      ],
    };
  }
);

server.tool(
  'fs_search',
  {
    root: { type: 'string', description: 'Root directory to search (must be within FS_ROOTS allowlist).' },
    query: { type: 'string', description: 'Case-insensitive substring to search for.' }
  },
  async ({ root, query }) => {
    const matches = await search(root, query);
    return {
      content: [
        { type: 'text', text: JSON.stringify({ root, query, matches }, null, 2) },
      ],
    };
  }
);

// ----------------------
// Write tools (gated)
// ----------------------

server.tool(
  'fs_write',
  {
    path: { type: 'string', description: 'File path (must be within FS_ROOTS allowlist).' },
    content: { type: 'string' },
    confirm: { type: 'boolean', optional: true, description: 'Must be true to execute.' }
  },
  async ({ path: p, content, confirm }) => {
    ensureConfirm(confirm);
    const info = await writeFileText(p, content);
    return {
      content: [
        { type: 'text', text: JSON.stringify({ ok: true, info }, null, 2) },
      ],
    };
  }
);

server.tool(
  'fs_mkdir',
  {
    path: { type: 'string', description: 'Directory path (must be within FS_ROOTS allowlist).' },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ path: p, confirm }) => {
    ensureConfirm(confirm);
    const info = await mkdirp(p);
    return {
      content: [
        { type: 'text', text: JSON.stringify({ ok: true, info }, null, 2) },
      ],
    };
  }
);

server.tool(
  'fs_delete',
  {
    path: { type: 'string', description: 'File path to delete (files only in v0).' },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ path: p, confirm }) => {
    ensureConfirm(confirm);
    const res = await deleteFile(p);
    return {
      content: [
        { type: 'text', text: JSON.stringify(res, null, 2) },
      ],
    };
  }
);

server.tool(
  'fs_move',
  {
    from: { type: 'string' },
    to: { type: 'string' },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ from, to, confirm }) => {
    ensureConfirm(confirm);
    const res = await movePath(from, to);
    return {
      content: [
        { type: 'text', text: JSON.stringify(res, null, 2) },
      ],
    };
  }
);

server.tool(
  'fs_copy',
  {
    from: { type: 'string' },
    to: { type: 'string' },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ from, to, confirm }) => {
    ensureConfirm(confirm);
    const info = await copyFile(from, to);
    return {
      content: [
        { type: 'text', text: JSON.stringify({ ok: true, info }, null, 2) },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
