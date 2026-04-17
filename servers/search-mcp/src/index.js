import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {
  McpServer,
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/index.js';

// -----------------------------
// Shared small helpers
// -----------------------------

function env(name, fallback = '') {
  const v = process.env[name];
  return (v === undefined || v === null || v === '') ? fallback : v;
}

function clamp(n, lo, hi, dflt) {
  const x = Number(n ?? dflt);
  if (Number.isNaN(x)) return dflt;
  return Math.max(lo, Math.min(hi, x));
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function jsonText(obj) {
  return JSON.stringify(obj, null, 2);
}

// -----------------------------
// Filesystem search (borrowed constraints)
// -----------------------------

const FS_ROOTS = env('FS_ROOTS', '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(r => path.resolve(r));

const FS_MAX_BYTES = Number(env('FS_MAX_BYTES', '200000'));

function fsIsWithinRoots(p) {
  const rp = path.resolve(p);
  return FS_ROOTS.some(root => {
    const rr = path.resolve(root) + path.sep;
    return rp === path.resolve(root) || rp.startsWith(rr);
  });
}

async function fsWalk(dir, out, limit) {
  if (out.length >= limit) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (out.length >= limit) return;
    const p = path.join(dir, e.name);
    if (!fsIsWithinRoots(p)) continue;
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      await fsWalk(p, out, limit);
    } else if (e.isFile()) {
      out.push(p);
    }
  }
}

async function searchFilesystem(query, limit) {
  if (!FS_ROOTS.length) return [];
  const files = [];
  // cap walking to avoid huge traversal
  const walkCap = Math.max(200, limit * 40);
  for (const root of FS_ROOTS) {
    if (files.length >= walkCap) break;
    try {
      await fsWalk(root, files, walkCap);
    } catch {
      // ignore
    }
  }

  const q = query.toLowerCase();
  const results = [];

  for (const f of files) {
    if (results.length >= limit) break;
    try {
      const st = await fs.stat(f);
      if (st.size > FS_MAX_BYTES) continue;
      const txt = await fs.readFile(f, 'utf8');
      const idx = txt.toLowerCase().indexOf(q);
      if (idx === -1) continue;
      const start = Math.max(0, idx - 80);
      const end = Math.min(txt.length, idx + q.length + 120);
      results.push({
        source: 'filesystem',
        title: path.basename(f),
        snippet: txt.slice(start, end),
        url: `file://${path.resolve(f)}`,
        id: path.resolve(f),
        metadata: { path: path.resolve(f), sizeBytes: st.size },
      });
    } catch {
      // ignore
    }
  }

  return results;
}

// -----------------------------
// GitHub search (issues/PRs)
// -----------------------------

const GITHUB_TOKEN = env('GITHUB_TOKEN');
const GITHUB_BASE = 'https://api.github.com';

async function ghFetch(pathname, { query } = {}) {
  if (!GITHUB_TOKEN) return null;
  const u = new URL(GITHUB_BASE + pathname);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      u.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(u.toString(), {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`GitHub API error ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

async function searchGitHub(query, limit) {
  if (!GITHUB_TOKEN) return [];
  // Simple strategy: use GitHub search/issues
  const perPage = clamp(limit, 1, 50, 10);
  const data = await ghFetch('/search/issues', {
    query: { q: query, per_page: perPage },
  });

  const items = (data?.items || []).slice(0, limit);
  return items.map(it => ({
    source: 'github',
    title: it.title,
    snippet: it.body ? it.body.slice(0, 240) : (it?.pull_request ? 'Pull request' : 'Issue'),
    url: it.html_url,
    id: String(it.id),
    metadata: {
      number: it.number,
      state: it.state,
      repo: it.repository_url,
      isPR: Boolean(it.pull_request),
    },
  }));
}

// -----------------------------
// Google OAuth (lightweight copy)
// To avoid cross-package installs in clients, Search MCP includes a minimal
// OAuth helper compatible with other servers.
// -----------------------------

function googleTokenPath() {
  return env('GOOGLE_TOKEN_PATH', path.resolve(process.cwd(), '..', '..', '.secrets/google-token.json'));
}

function googleConfig() {
  const clientId = env('GOOGLE_CLIENT_ID');
  const clientSecret = env('GOOGLE_CLIENT_SECRET');
  const redirectUri = env('GOOGLE_REDIRECT_URI', 'http://localhost:8787/oauth/callback');
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is required');
  if (!clientSecret) throw new Error('GOOGLE_CLIENT_SECRET is required');
  return { clientId, clientSecret, redirectUri, tokenPath: googleTokenPath() };
}

async function loadToken(p) {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

async function saveToken(p, tok) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(tok, null, 2), 'utf8');
}

function withExpiresAt(tok) {
  if (tok.expires_at) return tok;
  if (tok.expires_in) return { ...tok, expires_at: nowSec() + Number(tok.expires_in) - 30 };
  return tok;
}

function googleAuthUrl({ clientId, redirectUri, scope, state }) {
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', scope.join(' '));
  u.searchParams.set('access_type', 'offline');
  u.searchParams.set('prompt', 'consent');
  u.searchParams.set('include_granted_scopes', 'true');
  u.searchParams.set('state', state);
  return u.toString();
}

async function googleExchangeCode({ clientId, clientSecret, redirectUri, code }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Token exchange failed: ${res.status} ${txt || res.statusText}`);
  }
  return res.json();
}

async function googleRefresh({ clientId, clientSecret, refresh_token }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Token refresh failed: ${res.status} ${txt || res.statusText}`);
  }
  return res.json();
}

async function ensureGoogleAccessToken(scopes) {
  const cfg = googleConfig();
  let tok = await loadToken(cfg.tokenPath);

  if (tok?.access_token && tok?.expires_at && tok.expires_at > nowSec()) {
    return tok.access_token;
  }

  if (tok?.refresh_token) {
    const refreshed = await googleRefresh({
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      refresh_token: tok.refresh_token,
    });
    tok = withExpiresAt({ ...tok, ...refreshed, refresh_token: tok.refresh_token });
    await saveToken(cfg.tokenPath, tok);
    return tok.access_token;
  }

  const state = Math.random().toString(16).slice(2);
  const url = googleAuthUrl({ clientId: cfg.clientId, redirectUri: cfg.redirectUri, scope: scopes, state });
  const redirect = new URL(cfg.redirectUri);
  const port = Number(redirect.port || 80);

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const ru = new URL(req.url, `http://localhost:${port}`);
        if (ru.pathname !== redirect.pathname) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const gotState = ru.searchParams.get('state');
        const gotCode = ru.searchParams.get('code');
        const gotErr = ru.searchParams.get('error');
        if (gotErr) {
          res.writeHead(400);
          res.end(`Auth error: ${gotErr}`);
          server.close();
          reject(new Error(`Auth error: ${gotErr}`));
          return;
        }
        if (!gotCode) {
          res.writeHead(400);
          res.end('Missing code');
          return;
        }
        if (gotState !== state) {
          res.writeHead(400);
          res.end('State mismatch');
          server.close();
          reject(new Error('State mismatch'));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><body><h3>Google auth complete.</h3><p>You can close this window.</p></body></html>');
        server.close();
        resolve(gotCode);
      } catch (e) {
        server.close();
        reject(e);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      console.error('Open this URL to authorize Google:');
      console.error(url);
    });
  });

  const exchanged = await googleExchangeCode({
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    redirectUri: cfg.redirectUri,
    code,
  });

  tok = withExpiresAt(exchanged);
  await saveToken(cfg.tokenPath, tok);
  return tok.access_token;
}

// -----------------------------
// Google Drive search
// -----------------------------

async function driveSearch(query, limit) {
  const clientId = env('GOOGLE_CLIENT_ID');
  if (!clientId) return [];

  const scopes = [
    'https://www.googleapis.com/auth/drive.metadata.readonly',
  ];
  const token = await ensureGoogleAccessToken(scopes);

  const u = new URL('https://www.googleapis.com/drive/v3/files');
  u.searchParams.set('q', `name contains '${query.replace(/'/g, "\\'")}' and trashed=false`);
  u.searchParams.set('pageSize', String(clamp(limit, 1, 50, 10)));
  u.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,webViewLink)');

  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Drive search error ${res.status}: ${txt || res.statusText}`);
  }
  const data = await res.json();
  const files = (data?.files || []).slice(0, limit);

  return files.map(f => ({
    source: 'google_drive',
    title: f.name,
    snippet: f.mimeType,
    url: f.webViewLink,
    id: f.id,
    metadata: { mimeType: f.mimeType, modifiedTime: f.modifiedTime },
  }));
}

// -----------------------------
// Gmail search
// -----------------------------

async function gmailSearch(query, limit) {
  const clientId = env('GOOGLE_CLIENT_ID');
  if (!clientId) return [];

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
  ];
  const token = await ensureGoogleAccessToken(scopes);

  const u = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  u.searchParams.set('q', query);
  u.searchParams.set('maxResults', String(clamp(limit, 1, 50, 10)));

  const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Gmail search error ${res.status}: ${txt || res.statusText}`);
  }
  const data = await res.json();
  const msgs = (data?.messages || []).slice(0, limit);

  return msgs.map(m => ({
    source: 'gmail',
    title: `Message ${m.id}`,
    snippet: 'Gmail message id (fetch thread/message for details)',
    url: `https://mail.google.com/mail/u/0/#all/${m.id}`,
    id: m.id,
    metadata: { threadId: m.threadId },
  }));
}

// -----------------------------
// MCP server
// -----------------------------

const server = new McpServer({
  name: 'search-mcp',
  version: '0.1.0',
});

server.tool('search_sources', {}, async () => {
  return {
    content: [{
      type: 'text',
      text: jsonText({
        sources: {
          filesystem: { enabled: FS_ROOTS.length > 0 },
          github: { enabled: Boolean(GITHUB_TOKEN) },
          google_drive: { enabled: Boolean(env('GOOGLE_CLIENT_ID')) },
          gmail: { enabled: Boolean(env('GOOGLE_CLIENT_ID')) },
        },
      }),
    }],
  };
});

server.tool(
  'search_query',
  {
    query: { type: 'string' },
    sources: { type: 'array', items: { type: 'string' }, optional: true, description: 'Subset of: filesystem, github, google_drive, gmail' },
    limit: { type: 'number', optional: true, description: 'Max total results (default 20, max 50)' },
  },
  async ({ query, sources, limit }) => {
    const lim = clamp(limit, 1, 50, 20);
    const want = new Set((sources && sources.length) ? sources : ['filesystem', 'github', 'google_drive', 'gmail']);

    // Simple fair-share per source
    const per = Math.max(3, Math.floor(lim / Math.max(1, want.size)));

    const out = [];

    if (want.has('filesystem')) {
      out.push(...await searchFilesystem(query, Math.min(per, lim - out.length)));
    }
    if (want.has('github') && out.length < lim) {
      out.push(...await searchGitHub(query, Math.min(per, lim - out.length)));
    }
    if (want.has('google_drive') && out.length < lim) {
      out.push(...await driveSearch(query, Math.min(per, lim - out.length)));
    }
    if (want.has('gmail') && out.length < lim) {
      out.push(...await gmailSearch(query, Math.min(per, lim - out.length)));
    }

    return {
      content: [{
        type: 'text',
        text: jsonText({
          query,
          count: out.length,
          results: out.slice(0, lim),
        }),
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
