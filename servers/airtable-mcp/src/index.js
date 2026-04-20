import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

function getAirtableToken() {
  // Prefer PAT; fall back to legacy API key.
  return process.env.AIRTABLE_PAT || process.env.AIRTABLE_API_KEY || null;
}

function requireAirtableToken() {
  const t = getAirtableToken();
  if (!t) throw new Error("Missing env var: AIRTABLE_PAT (preferred) or AIRTABLE_API_KEY (legacy)");
  return t;
}

function parseConfirmFlag(input = {}) {
  return Boolean(input.confirm);
}

async function airtableFetch(path, { method = "GET", query = {}, body } = {}) {
  const token = requireAirtableToken();

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) qs.append(k, String(item));
    } else {
      qs.set(k, String(v));
    }
  }

  const url = `https://api.airtable.com/v0${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`Airtable API error: HTTP ${res.status} ${res.statusText}`);
    err.details = { status: res.status, statusText: res.statusText, body: json };
    throw err;
  }
  return json;
}

async function airtableMetaFetch(path, { method = "GET", query = {}, body } = {}) {
  const token = requireAirtableToken();

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
  }

  const url = `https://api.airtable.com${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`Airtable API error: HTTP ${res.status} ${res.statusText}`);
    err.details = { status: res.status, statusText: res.statusText, body: json };
    throw err;
  }
  return json;
}

const server = new McpServer({
  name: "airtable-mcp",
  version: "0.1.0",
});

server.tool("airtable_list_bases", {}, async () => {
  // Uses the Airtable metadata API.
  const data = await airtableMetaFetch("/v0/meta/bases");
  const bases = data?.bases ?? [];
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            bases: bases.map((b) => ({
              id: b.id,
              name: b.name,
              permissionLevel: b.permissionLevel ?? null,
            })),
          },
          null,
          2
        ),
      },
    ],
  };
});

server.tool(
  "airtable_list_tables",
  {
    base_id: { type: "string", description: "Base ID (app...)." },
  },
  async (input) => {
    const data = await airtableMetaFetch(`/v0/meta/bases/${input.base_id}/tables`);
    const tables = data?.tables ?? [];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              base_id: input.base_id,
              tables: tables.map((t) => ({
                id: t.id,
                name: t.name,
                primaryFieldId: t.primaryFieldId ?? null,
                fields: (t.fields ?? []).map((f) => ({
                  id: f.id,
                  name: f.name,
                  type: f.type,
                })),
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "airtable_list_records",
  {
    base_id: { type: "string", description: "Base ID (app...)." },
    table: { type: "string", description: "Table name or table ID." },
    max_records: { type: "number", description: "Max records (default 100).", optional: true },
    page_size: { type: "number", description: "Page size (default 100).", optional: true },
    offset: { type: "string", description: "Offset for pagination (from previous call).", optional: true },
    view: { type: "string", description: "View name (optional).", optional: true },
    fields: { type: "array", description: "Fields to include (optional).", items: { type: "string" }, optional: true },
  },
  async (input) => {
    const maxRecords = Number.isFinite(input?.max_records) ? input.max_records : 100;
    const pageSize = Number.isFinite(input?.page_size) ? input.page_size : 100;

    const data = await airtableFetch(`/${encodeURIComponent(input.base_id)}/${encodeURIComponent(input.table)}`, {
      query: {
        maxRecords,
        pageSize,
        offset: input?.offset,
        view: input?.view,
        fields: input?.fields,
      },
    });

    const records = data?.records ?? [];
    const nextOffset = data?.offset ?? null;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              base_id: input.base_id,
              table: input.table,
              offset: nextOffset,
              records: records.map((r) => ({
                id: r.id,
                createdTime: r.createdTime ?? null,
                fields: r.fields ?? {},
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "airtable_create_record",
  {
    base_id: { type: "string", description: "Base ID (app...)." },
    table: { type: "string", description: "Table name or table ID." },
    fields: { type: "object", description: "Fields object for the new record." },
    typecast: { type: "boolean", description: "Enable Airtable typecast (default false).", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to create.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return {
        content: [
          {
            type: "text",
            text: `Write action blocked. Re-run with {"confirm": true} to create the Airtable record.`,
          },
        ],
      };
    }

    const data = await airtableFetch(`/${encodeURIComponent(input.base_id)}/${encodeURIComponent(input.table)}`, {
      method: "POST",
      query: { typecast: input?.typecast ?? false },
      body: {
        fields: input.fields,
      },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              record: {
                id: data?.id ?? null,
                createdTime: data?.createdTime ?? null,
                fields: data?.fields ?? {},
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

