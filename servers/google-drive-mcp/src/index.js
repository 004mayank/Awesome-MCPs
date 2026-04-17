import {
  McpServer,
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/index.js';

import { ensureAccessToken } from '@awesome-mcps/google-auth';

const SCOPES_READ = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

const SCOPES_WRITE = [
  'https://www.googleapis.com/auth/drive.file',
];

function ensureConfirm(confirm) {
  if (confirm !== true) throw new Error('Write operation requires confirm=true');
}

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';

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

async function driveJson(path, accessToken, { method = 'GET', query, body } = {}) {
  const u = new URL(DRIVE_BASE + path);
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
  if (res.status === 204) return { ok: true };
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
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const data = await driveJson('/files', accessToken, {
      query: {
        q,
        pageSize: clampPageSize(pageSize),
        pageToken,
        fields: 'nextPageToken, files(id,name,mimeType,modifiedTime,size,parents,webViewLink)',
        corpora: 'user',
      }
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
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const data = await driveJson(`/files/${encodeURIComponent(fileId)}`, accessToken, {
      query: {
        fields: 'id,name,mimeType,modifiedTime,size,parents,webViewLink,owners(displayName,emailAddress)',
        supportsAllDrives: 'true',
      }
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
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const q = `'${folderId}' in parents and trashed=false`;
    const data = await driveJson('/files', accessToken, {
      query: {
        q,
        pageSize: clampPageSize(pageSize),
        pageToken,
        fields: 'nextPageToken, files(id,name,mimeType,modifiedTime,size,parents,webViewLink)',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      }
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
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });

    // Export Google Docs to plain text.
    const u = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export`);
    u.searchParams.set('mimeType', 'text/plain');

    const res = await gfetch(u.toString(), accessToken);
    const text = await res.text();

    return {
      content: [{ type: 'text', text: JSON.stringify({ fileId, mimeType: 'text/plain', text }, null, 2) }],
    };
  }
);

server.tool(
  'drive_export_html',
  {
    fileId: { type: 'string' },
  },
  async ({ fileId }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const u = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export`);
    u.searchParams.set('mimeType', 'text/html');
    const res = await gfetch(u.toString(), accessToken);
    const html = await res.text();
    return {
      content: [{ type: 'text', text: JSON.stringify({ fileId, mimeType: 'text/html', html }, null, 2) }],
    };
  }
);

server.tool(
  'drive_export_markdown',
  {
    fileId: { type: 'string' },
  },
  async ({ fileId }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    // Google Drive export supports text/html, text/plain, application/pdf, etc.
    // Markdown isn't a first-class export for Google Docs, but some docs support it.
    // We attempt text/markdown and return the result (or API error).
    const u = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export`);
    u.searchParams.set('mimeType', 'text/markdown');
    const res = await gfetch(u.toString(), accessToken);
    const md = await res.text();
    return {
      content: [{ type: 'text', text: JSON.stringify({ fileId, mimeType: 'text/markdown', markdown: md }, null, 2) }],
    };
  }
);

server.tool(
  'drive_download_base64',
  {
    fileId: { type: 'string' },
  },
  async ({ fileId }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const u = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
    u.searchParams.set('alt', 'media');

    const res = await gfetch(u.toString(), accessToken);
    const buf = Buffer.from(await res.arrayBuffer());
    const base64 = buf.toString('base64');

    return {
      content: [{ type: 'text', text: JSON.stringify({ fileId, base64 }, null, 2) }],
    };
  }
);

// ----------------------
// Write tools (gated)
// ----------------------

server.tool(
  'drive_create_folder',
  {
    name: { type: 'string' },
    parentId: { type: 'string', optional: true },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ name, parentId, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const body = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    };

    const data = await driveJson('/files', accessToken, {
      method: 'POST',
      body,
      query: {
        fields: 'id,name,mimeType,parents,webViewLink',
      },
    });

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'drive_upload_text',
  {
    name: { type: 'string' },
    content: { type: 'string' },
    parentId: { type: 'string', optional: true },
    mimeType: { type: 'string', optional: true, description: 'Default text/plain' },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ name, content, parentId, mimeType, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const boundary = '----flowvismcp' + Math.random().toString(16).slice(2);
    const meta = {
      name,
      parents: parentId ? [parentId] : undefined,
    };

    const mt = mimeType || 'text/plain';

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(meta)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mt}; charset=UTF-8\r\n\r\n` +
      `${content}\r\n` +
      `--${boundary}--`;

    const u = new URL('https://www.googleapis.com/upload/drive/v3/files');
    u.searchParams.set('uploadType', 'multipart');
    u.searchParams.set('fields', 'id,name,mimeType,parents,webViewLink');

    const res = await gfetch(u.toString(), accessToken, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    const data = await res.json();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'drive_copy_file',
  {
    fileId: { type: 'string' },
    newName: { type: 'string', optional: true },
    parentId: { type: 'string', optional: true },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ fileId, newName, parentId, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const body = {
      name: newName || undefined,
      parents: parentId ? [parentId] : undefined,
    };

    const data = await driveJson(`/files/${encodeURIComponent(fileId)}/copy`, accessToken, {
      method: 'POST',
      body,
      query: {
        fields: 'id,name,mimeType,parents,webViewLink',
      },
    });

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'drive_move_file',
  {
    fileId: { type: 'string' },
    addParents: { type: 'array', items: { type: 'string' }, optional: true },
    removeParents: { type: 'array', items: { type: 'string' }, optional: true },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ fileId, addParents, removeParents, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const data = await driveJson(`/files/${encodeURIComponent(fileId)}`, accessToken, {
      method: 'PATCH',
      query: {
        addParents: Array.isArray(addParents) ? addParents.join(',') : undefined,
        removeParents: Array.isArray(removeParents) ? removeParents.join(',') : undefined,
        fields: 'id,name,mimeType,parents,webViewLink',
        supportsAllDrives: 'true',
      },
    });

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'drive_delete_file',
  {
    fileId: { type: 'string' },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ fileId, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const data = await driveJson(`/files/${encodeURIComponent(fileId)}`, accessToken, {
      method: 'DELETE',
      query: {
        supportsAllDrives: 'true',
      },
    });

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
