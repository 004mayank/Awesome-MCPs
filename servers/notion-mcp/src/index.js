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

async function notionFetch(method, token, path, body) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": process.env.NOTION_VERSION || "2022-06-28",
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
    const err = new Error(`Notion API error: ${res.status}`);
    err.details = json;
    throw err;
  }
  return json;
}

const server = new McpServer({ name: "notion-mcp", version: "0.1.0" });

server.tool(
  "notion_search",
  {
    query: { type: "string", description: "Search query string.", optional: true },
    page_size: { type: "number", description: "Max results (default 10).", optional: true },
    start_cursor: { type: "string", description: "Pagination cursor.", optional: true },
  },
  async (input) => {
    const NOTION_TOKEN = requireEnv("NOTION_TOKEN");
    const body = {
      query: input?.query || undefined,
      page_size: Number.isFinite(input?.page_size) ? input.page_size : 10,
      start_cursor: input?.start_cursor || undefined,
    };
    const data = await notionFetch("POST", NOTION_TOKEN, "search", body);

    const simplified = (data.results || []).map((r) => ({
      id: r.id,
      object: r.object,
      url: r.url,
      last_edited_time: r.last_edited_time,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ results: simplified, next_cursor: data.next_cursor || null, has_more: data.has_more }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "notion_get_page",
  {
    page_id: { type: "string", description: "Notion page id." },
  },
  async (input) => {
    const NOTION_TOKEN = requireEnv("NOTION_TOKEN");
    const data = await notionFetch("GET", NOTION_TOKEN, `pages/${input.page_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "notion_append_blocks",
  {
    block_id: { type: "string", description: "Parent block id (often the page id)." },
    paragraphs: { type: "array", description: "Array of paragraph strings to append.", items: { type: "string" } },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to append.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to append blocks.` }] };
    }
    const NOTION_TOKEN = requireEnv("NOTION_TOKEN");
    const children = (input.paragraphs || []).map((t) => ({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: String(t) } }] },
    }));

    const data = await notionFetch("PATCH", NOTION_TOKEN, `blocks/${input.block_id}/children`, { children });
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, result: data }, null, 2) }] };
  }
);

server.tool(
  "notion_create_page",
  {
    parent_database_id: { type: "string", description: "Database id to create page in." },
    title: { type: "string", description: "Page title." },
    properties: { type: "object", description: "Additional Notion properties object (raw).", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to create.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to create the page.` }] };
    }
    const NOTION_TOKEN = requireEnv("NOTION_TOKEN");
    const body = {
      parent: { database_id: input.parent_database_id },
      properties: {
        Name: { title: [{ type: "text", text: { content: input.title } }] },
        ...(input.properties || {}),
      },
    };
    const data = await notionFetch("POST", NOTION_TOKEN, "pages", body);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id: data.id, url: data.url }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
