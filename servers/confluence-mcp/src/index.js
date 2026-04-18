import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function confirmOk(input = {}) {
  return Boolean(input.confirm);
}

function baseUrl() {
  return requireEnv("CONFLUENCE_BASE_URL").replace(/\/$/, "");
}

function authHeader() {
  const email = requireEnv("CONFLUENCE_EMAIL");
  const token = requireEnv("CONFLUENCE_API_TOKEN");
  const basic = Buffer.from(`${email}:${token}`).toString("base64");
  return `Basic ${basic}`;
}

async function confFetch(method, path, body) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`Confluence API error: ${res.status}`);
    err.details = json;
    throw err;
  }
  return json;
}

const server = new McpServer({ name: "confluence-mcp", version: "0.1.0" });

server.tool(
  "confluence_search",
  {
    cql: { type: "string", description: "Confluence CQL query." },
    limit: { type: "number", description: "Max results (default 10).", optional: true },
  },
  async (input) => {
    const limit = Number.isFinite(input?.limit) ? input.limit : 10;
    const qs = new URLSearchParams({ cql: input.cql, limit: String(limit) });

    const data = await confFetch("GET", `/rest/api/content/search?${qs.toString()}`);
    const results = (data.results || []).map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      space: { key: r.space?.key, name: r.space?.name },
      url: r._links?.base && r._links?.webui ? `${r._links.base}${r._links.webui}` : undefined,
    }));

    return { content: [{ type: "text", text: JSON.stringify({ results }, null, 2) }] };
  }
);

server.tool(
  "confluence_get_page",
  {
    page_id: { type: "string", description: "Confluence content id." },
    expand: { type: "string", description: "Expand fields (default: body.storage,version,space).", optional: true },
  },
  async (input) => {
    const expand = input?.expand || "body.storage,version,space";
    const qs = new URLSearchParams({ expand });
    const data = await confFetch("GET", `/rest/api/content/${encodeURIComponent(input.page_id)}?${qs.toString()}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "confluence_create_page",
  {
    space_key: { type: "string", description: "Space key." },
    title: { type: "string", description: "Page title." },
    parent_page_id: { type: "string", description: "Optional parent page id.", optional: true },
    storage_html: { type: "string", description: "Confluence storage format HTML." },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true },
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to create the page.` }] };
    }

    const body = {
      type: "page",
      title: input.title,
      space: { key: input.space_key },
      ancestors: input.parent_page_id ? [{ id: input.parent_page_id }] : undefined,
      body: { storage: { value: input.storage_html, representation: "storage" } },
    };

    const data = await confFetch("POST", `/rest/api/content`, body);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id: data.id, title: data.title }, null, 2) }] };
  }
);

server.tool(
  "confluence_update_page",
  {
    page_id: { type: "string", description: "Page id." },
    title: { type: "string", description: "New title (optional).", optional: true },
    storage_html: { type: "string", description: "New storage HTML (required)." },
    version_number: { type: "number", description: "Current version number (will update to +1)." },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true },
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to update the page.` }] };
    }

    const body = {
      id: input.page_id,
      type: "page",
      title: input.title || undefined,
      version: { number: input.version_number + 1 },
      body: { storage: { value: input.storage_html, representation: "storage" } },
    };

    const data = await confFetch("PUT", `/rest/api/content/${encodeURIComponent(input.page_id)}`, body);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id: data.id, version: data.version?.number }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
