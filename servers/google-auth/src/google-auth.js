import http from 'node:http';
import { URL } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';

function env(name, fallback = '') {
  const v = process.env[name];
  return (v === undefined || v === null || v === '') ? fallback : v;
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

async function ensureDir(p) {
  await fs.mkdir(path.dirname(p), { recursive: true });
}

export function googleConfig() {
  const clientId = env('GOOGLE_CLIENT_ID');
  const clientSecret = env('GOOGLE_CLIENT_SECRET');
  const redirectUri = env('GOOGLE_REDIRECT_URI', 'http://localhost:8787/oauth/callback');
  const tokenPath = env('GOOGLE_TOKEN_PATH', path.resolve(process.cwd(), '.secrets/google-token.json'));

  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is required');
  if (!clientSecret) throw new Error('GOOGLE_CLIENT_SECRET is required');

  return { clientId, clientSecret, redirectUri, tokenPath };
}

export async function loadToken(tokenPath) {
  try {
    const raw = await fs.readFile(tokenPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveToken(tokenPath, token) {
  await ensureDir(tokenPath);
  await fs.writeFile(tokenPath, JSON.stringify(token, null, 2), 'utf8');
}

function authUrl({ clientId, redirectUri, scope, state }) {
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

async function exchangeCode({ clientId, clientSecret, redirectUri, code }) {
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

async function refreshToken({ clientId, clientSecret, refresh_token }) {
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

function withExpiresAt(token) {
  if (token.expires_at) return token;
  if (token.expires_in) {
    return { ...token, expires_at: nowSec() + Number(token.expires_in) - 30 };
  }
  return token;
}

export async function ensureAccessToken({ scopes }) {
  const cfg = googleConfig();
  let tok = await loadToken(cfg.tokenPath);

  // If we have a valid access token, return it.
  if (tok?.access_token && tok?.expires_at && tok.expires_at > nowSec()) {
    return { accessToken: tok.access_token, token: tok, cfg };
  }

  // If we can refresh, do it.
  if (tok?.refresh_token) {
    const refreshed = await refreshToken({
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      refresh_token: tok.refresh_token,
    });
    tok = withExpiresAt({
      ...tok,
      ...refreshed,
      refresh_token: tok.refresh_token,
    });
    await saveToken(cfg.tokenPath, tok);
    return { accessToken: tok.access_token, token: tok, cfg };
  }

  // Otherwise, do interactive auth via localhost redirect.
  const state = Math.random().toString(16).slice(2);
  const url = authUrl({ clientId: cfg.clientId, redirectUri: cfg.redirectUri, scope: scopes, state });

  const redirect = new URL(cfg.redirectUri);
  if (redirect.hostname !== 'localhost') {
    throw new Error(`This auth helper expects a localhost redirect. Got: ${cfg.redirectUri}`);
  }

  const port = Number(redirect.port || 80);
  const pathname = redirect.pathname;

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const ru = new URL(req.url, `http://localhost:${port}`);
        if (ru.pathname !== pathname) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const gotState = ru.searchParams.get('state');
        const gotCode = ru.searchParams.get('code');
        const gotErr = ru.searchParams.get('error');

        if (gotErr) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end(`Auth error: ${gotErr}`);
          server.close();
          reject(new Error(`Auth error: ${gotErr}`));
          return;
        }

        if (!gotCode) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing code');
          return;
        }

        if (gotState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
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
      // Print URL for user to open.
      // MCP clients will surface server stderr/stdout in logs.
      console.error('Open this URL to authorize:');
      console.error(url);
    });
  });

  const exchanged = await exchangeCode({
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    redirectUri: cfg.redirectUri,
    code,
  });

  tok = withExpiresAt(exchanged);
  await saveToken(cfg.tokenPath, tok);

  return { accessToken: tok.access_token, token: tok, cfg };
}
