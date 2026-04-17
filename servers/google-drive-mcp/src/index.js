import {
  McpServer,
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/index.js';

import { ensureAccessToken } from '@awesome-mcps/google-auth';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';

async function gfetch(url, accessToken) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Google API error ${res.status}: ${txt || res.statusText}`);
  }
  return res;
}

async function driveJson(path, accessToken, query) {
  const u = new URL(DRIVE_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      u.searchParams.set(k, String(v));
    }
  }
  const res = await gfetch(u.toString(), accessToken);
  return res.json();
}

function clampPageSize(n) {
  const x = Number(n || 20);
  if (Number.isNaN(x)) return 20;
  return Math.max(1, Math.min(100, x));
}

const server = new McpServer({
  name: 'google-drive-mcp',
  version: '0.1.0',
});

server.tool(
  'drive_search',
  {
    q: { type: 'string', description: 'Drive search query (Drive API q syntax).' },
    pageSize: { type: 'number', optional: true },
    pageToken: { type: 'string', optional: true },
  },
  async ({ q, pageSize, pageToken }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES });
    const data = await driveJson('/files', accessToken, {
      q,
      pageSize: clampPageSize(pageSize),
      pageToken,
      fields: 'nextPageToken, files(id,name,mimeType,modifiedTime,size,parents,webViewLink)',
      corpora: 'user',
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'drive_get_metadata',
  {
    fileId: { type: 'string' },
  },
  async ({ fileId }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES });
    const data = await driveJson(`/files/${encodeURIComponent(fileId)}`, accessToken, {
      fields: 'id,name,mimeType,modifiedTime,size,parents,webViewLink,owners(displayName,emailAddress)',
      supportsAllDrives: 'true',
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'drive_list_folder',
  {
    folderId: { type: 'string' },
    pageSize: { type: 'number', optional: true },
    pageToken: { type: 'string', optional: true },
  },
  async ({ folderId, pageSize, pageToken }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES });
    const q = `'${folderId}' in parents and trashed=false`;
    const data = await driveJson('/files', accessToken, {
      q,
      pageSize: clampPageSize(pageSize),
      pageToken,
      fields: 'nextPageToken, files(id,name,mimeType,modifiedTime,size,parents,webViewLink)',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'drive_export_text',
  {
    fileId: { type: 'string' },
  },
  async ({ fileId }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES });

    // Export Google Docs to plain text. (For other types, callers should use metadata + decide.)
    const u = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export`);
    u.searchParams.set('mimeType', 'text/plain');

    const res = await gfetch(u.toString(), accessToken);
    const text = await res.text();

    return {
      content: [{ type: 'text', text: JSON.stringify({ fileId, text }, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
