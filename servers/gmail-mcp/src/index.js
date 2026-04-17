import {
  McpServer,
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/index.js';

import { ensureAccessToken } from '@awesome-mcps/google-auth';

const SCOPES_READ = [
  'https://www.googleapis.com/auth/gmail.readonly',
];

const SCOPES_WRITE = [
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
];

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1';

function ensureConfirm(confirm) {
  if (confirm !== true) throw new Error('Write operation requires confirm=true');
}

async function gfetch(url, accessToken, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    body,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Google API error ${res.status}: ${txt || res.statusText}`);
  }
  return res;
}

async function gjson(path, accessToken, { method = 'GET', query, body } = {}) {
  const u = new URL(GMAIL_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      u.searchParams.set(k, String(v));
    }
  }
  const res = await gfetch(u.toString(), accessToken, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function clampMaxResults(n) {
  const x = Number(n || 20);
  if (Number.isNaN(x)) return 20;
  return Math.max(1, Math.min(100, x));
}

function encodeBase64Url(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function makeRawReply({ threadId, bodyText }) {
  // Minimal RFC 2822-ish message. Gmail will set From.
  // We set threadId separately when creating the draft.
  const msg = [
    `To: me`,
    `Subject: Re:`,
    `In-Reply-To: ${threadId}`,
    `References: ${threadId}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    bodyText,
  ].join('\r\n');
  return encodeBase64Url(msg);
}

const server = new McpServer({
  name: 'gmail-mcp',
  version: '0.1.0',
});

server.tool(
  'gmail_search',
  {
    q: { type: 'string', description: 'Gmail search query.' },
    maxResults: { type: 'number', optional: true },
    pageToken: { type: 'string', optional: true },
  },
  async ({ q, maxResults, pageToken }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const data = await gjson('/users/me/messages', accessToken, {
      query: {
        q,
        maxResults: clampMaxResults(maxResults),
        pageToken,
      },
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'gmail_get_thread',
  {
    threadId: { type: 'string' },
    format: { type: 'string', optional: true, description: 'full|metadata|minimal (default full)' },
  },
  async ({ threadId, format }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const data = await gjson(`/users/me/threads/${encodeURIComponent(threadId)}`, accessToken, {
      query: {
        format: format || 'full',
      },
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'gmail_get_message',
  {
    messageId: { type: 'string' },
    format: { type: 'string', optional: true, description: 'full|metadata|minimal|raw (default full)' },
  },
  async ({ messageId, format }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const data = await gjson(`/users/me/messages/${encodeURIComponent(messageId)}`, accessToken, {
      query: {
        format: format || 'full',
      },
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'gmail_create_draft_reply',
  {
    threadId: { type: 'string' },
    body: { type: 'string', description: 'Plain text email body.' },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ threadId, body, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const raw = makeRawReply({ threadId, bodyText: body });

    const data = await gjson('/users/me/drafts', accessToken, {
      method: 'POST',
      body: {
        message: {
          threadId,
          raw,
        },
      },
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'gmail_send_draft',
  {
    draftId: { type: 'string' },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ draftId, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const data = await gjson('/users/me/drafts/send', accessToken, {
      method: 'POST',
      body: {
        id: draftId,
      },
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
