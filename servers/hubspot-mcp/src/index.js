import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function parseConfirmFlag(input = {}) {
  return Boolean(input.confirm);
}

async function hubspotFetch(path, { method = "GET", query = {}, body } = {}) {
  const token = requireEnv("HUBSPOT_PRIVATE_APP_TOKEN");

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) qs.append(k, String(item));
    } else {
      qs.set(k, String(v));
    }
  }

  const url = `https://api.hubapi.com${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
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
    const err = new Error(`HubSpot API error: HTTP ${res.status} ${res.statusText}`);
    err.details = { status: res.status, statusText: res.statusText, body: json };
    throw err;
  }
  return json;
}

const server = new McpServer({
  name: "hubspot-mcp",
  version: "0.1.0",
});

server.tool("hubspot_account_info", {}, async () => {
  // Returns info about the authenticated account.
  const data = await hubspotFetch("/account-info/v3/details");
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            portalId: data?.portalId ?? null,
            timeZone: data?.timeZone ?? null,
            companyCurrency: data?.companyCurrency ?? null,
            utcOffset: data?.utcOffset ?? null,
          },
          null,
          2
        ),
      },
    ],
  };
});

function normalizeObjectType(t) {
  const v = String(t || "").toLowerCase();
  if (["contacts", "contact"].includes(v)) return "contacts";
  if (["companies", "company"].includes(v)) return "companies";
  if (["deals", "deal"].includes(v)) return "deals";
  if (["tickets", "ticket"].includes(v)) return "tickets";
  throw new Error(`Unsupported object_type: ${t}. Supported: contacts, companies, deals, tickets.`);
}

server.tool(
  "hubspot_list_objects",
  {
    object_type: { type: "string", description: "contacts|companies|deals|tickets" },
    limit: { type: "number", description: "Page size (default 50, max 100).", optional: true },
    after: { type: "string", description: "Paging cursor from previous response.", optional: true },
    properties: {
      type: "array",
      description: "Properties to include (e.g., [\"firstname\",\"lastname\",\"email\"]).",
      items: { type: "string" },
      optional: true,
    },
  },
  async (input) => {
    const objectType = normalizeObjectType(input.object_type);
    const limit = Number.isFinite(input?.limit) ? Math.min(Math.max(input.limit, 1), 100) : 50;
    const properties = Array.isArray(input?.properties) ? input.properties : undefined;

    const data = await hubspotFetch(`/crm/v3/objects/${objectType}`, {
      query: {
        limit,
        after: input?.after,
        properties,
      },
    });

    const results = data?.results ?? [];
    const nextAfter = data?.paging?.next?.after ?? null;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              object_type: objectType,
              paging: { next_after: nextAfter },
              results: results.map((r) => ({
                id: r.id,
                createdAt: r.createdAt ?? null,
                updatedAt: r.updatedAt ?? null,
                archived: Boolean(r.archived),
                properties: r.properties ?? {},
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
  "hubspot_get_object",
  {
    object_type: { type: "string", description: "contacts|companies|deals|tickets" },
    object_id: { type: "string", description: "Object ID." },
    properties: {
      type: "array",
      description: "Properties to include (optional).",
      items: { type: "string" },
      optional: true,
    },
  },
  async (input) => {
    const objectType = normalizeObjectType(input.object_type);
    const properties = Array.isArray(input?.properties) ? input.properties : undefined;

    const data = await hubspotFetch(`/crm/v3/objects/${objectType}/${input.object_id}`, {
      query: { properties },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              object_type: objectType,
              object: {
                id: data?.id ?? input.object_id,
                createdAt: data?.createdAt ?? null,
                updatedAt: data?.updatedAt ?? null,
                archived: Boolean(data?.archived),
                properties: data?.properties ?? {},
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

server.tool(
  "hubspot_create_object",
  {
    object_type: { type: "string", description: "contacts|companies|deals|tickets" },
    properties: { type: "object", description: "HubSpot properties object." },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to create.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return {
        content: [
          {
            type: "text",
            text: `Write action blocked. Re-run with {"confirm": true} to create the HubSpot object.`,
          },
        ],
      };
    }

    const objectType = normalizeObjectType(input.object_type);
    const data = await hubspotFetch(`/crm/v3/objects/${objectType}`, {
      method: "POST",
      body: {
        properties: input.properties,
      },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              object_type: objectType,
              object: {
                id: data?.id ?? null,
                createdAt: data?.createdAt ?? null,
                properties: data?.properties ?? {},
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

