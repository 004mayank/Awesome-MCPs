import {
  McpServer,
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/index.js';

import { ensureAccessToken } from '@awesome-mcps/google-auth';

const SCOPES_READ = [
  'https://www.googleapis.com/auth/calendar.readonly',
];

const SCOPES_WRITE = [
  'https://www.googleapis.com/auth/calendar.events',
];

const CAL_BASE = 'https://www.googleapis.com/calendar/v3';

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
  const u = new URL(CAL_BASE + path);
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

function clampMaxResults(n) {
  const x = Number(n || 50);
  if (Number.isNaN(x)) return 50;
  return Math.max(1, Math.min(2500, x));
}

const server = new McpServer({
  name: 'google-calendar-mcp',
  version: '0.1.0',
});

server.tool(
  'cal_list_calendars',
  {},
  async () => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const data = await gjson('/users/me/calendarList', accessToken, {
      query: {
        maxResults: 250,
      },
    });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'cal_list_events',
  {
    calendarId: { type: 'string', description: 'Calendar ID, e.g. primary' },
    timeMin: { type: 'string', description: 'RFC3339 timestamp (inclusive)' },
    timeMax: { type: 'string', description: 'RFC3339 timestamp (exclusive)' },
    q: { type: 'string', optional: true },
    pageToken: { type: 'string', optional: true },
    maxResults: { type: 'number', optional: true },
  },
  async ({ calendarId, timeMin, timeMax, q, pageToken, maxResults }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const data = await gjson(`/calendars/${encodeURIComponent(calendarId)}/events`, accessToken, {
      query: {
        timeMin,
        timeMax,
        q,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: clampMaxResults(maxResults),
        pageToken,
      },
    });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'cal_freebusy',
  {
    timeMin: { type: 'string', description: 'RFC3339 timestamp' },
    timeMax: { type: 'string', description: 'RFC3339 timestamp' },
    calendarIds: { type: 'array', items: { type: 'string' }, description: 'List of calendar IDs' },
  },
  async ({ timeMin, timeMax, calendarIds }) => {
    const { accessToken } = await ensureAccessToken({ scopes: SCOPES_READ });
    const data = await gjson('/freeBusy', accessToken, {
      method: 'POST',
      body: {
        timeMin,
        timeMax,
        items: (calendarIds || []).map(id => ({ id })),
      },
    });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'cal_create_event',
  {
    calendarId: { type: 'string' },
    summary: { type: 'string' },
    start: { type: 'string', description: 'RFC3339 timestamp' },
    end: { type: 'string', description: 'RFC3339 timestamp' },
    description: { type: 'string', optional: true },
    location: { type: 'string', optional: true },
    attendees: { type: 'array', items: { type: 'string' }, optional: true, description: 'Attendee emails' },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ calendarId, summary, start, end, description, location, attendees, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const body = {
      summary,
      description: description || undefined,
      location: location || undefined,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: (Array.isArray(attendees) && attendees.length) ? attendees.map(email => ({ email })) : undefined,
    };

    const data = await gjson(`/calendars/${encodeURIComponent(calendarId)}/events`, accessToken, {
      method: 'POST',
      body,
    });

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'cal_update_event',
  {
    calendarId: { type: 'string' },
    eventId: { type: 'string' },
    patch: { type: 'object', description: 'Calendar event patch object (Calendar API event resource fields).' },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ calendarId, eventId, patch, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const data = await gjson(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, accessToken, {
      method: 'PATCH',
      body: patch,
    });

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  'cal_delete_event',
  {
    calendarId: { type: 'string' },
    eventId: { type: 'string' },
    confirm: { type: 'boolean', optional: true },
  },
  async ({ calendarId, eventId, confirm }) => {
    ensureConfirm(confirm);
    const { accessToken } = await ensureAccessToken({ scopes: [...SCOPES_READ, ...SCOPES_WRITE] });

    const data = await gjson(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, accessToken, {
      method: 'DELETE',
    });

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
