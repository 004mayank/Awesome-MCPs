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

function zendeskBaseUrl() {
  const sub = requireEnv("ZENDESK_SUBDOMAIN");
  return `https://${sub}.zendesk.com`;
}

function zendeskAuthHeader() {
  const email = requireEnv("ZENDESK_EMAIL");
  const token = requireEnv("ZENDESK_API_TOKEN");
  const basic = Buffer.from(`${email}/token:${token}`).toString("base64");
  return `Basic ${basic}`;
}

async function zendeskFetch(method, path, body) {
  const res = await fetch(`${zendeskBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: zendeskAuthHeader(),
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
    const err = new Error(`Zendesk API error: ${res.status}`);
    err.details = json;
    throw err;
  }
  return json;
}

const server = new McpServer({ name: "zendesk-mcp", version: "0.1.0" });

server.tool(
  "zendesk_search_tickets",
  {
    query: { type: "string", description: "Zendesk search query, e.g. 'type:ticket status:open'." },
  },
  async (input) => {
    const qs = new URLSearchParams({ query: input.query });
    const data = await zendeskFetch("GET", `/api/v2/search.json?${qs.toString()}`);

    const results = (data.results || []).map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      updated_at: t.updated_at,
      url: t.url,
    }));

    return { content: [{ type: "text", text: JSON.stringify({ results }, null, 2) }] };
  }
);

server.tool(
  "zendesk_get_ticket",
  {
    ticket_id: { type: "number", description: "Ticket id." },
    include_comments: { type: "boolean", description: "Include comments (default false).", optional: true },
  },
  async (input) => {
    const ticket = await zendeskFetch("GET", `/api/v2/tickets/${input.ticket_id}.json`);
    if (input?.include_comments) {
      const comments = await zendeskFetch("GET", `/api/v2/tickets/${input.ticket_id}/comments.json`);
      return { content: [{ type: "text", text: JSON.stringify({ ticket: ticket.ticket, comments: comments.comments }, null, 2) }] };
    }
    return { content: [{ type: "text", text: JSON.stringify({ ticket: ticket.ticket }, null, 2) }] };
  }
);

server.tool(
  "zendesk_add_comment",
  {
    ticket_id: { type: "number", description: "Ticket id." },
    body: { type: "string", description: "Comment body." },
    public: { type: "boolean", description: "Public comment? default false.", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true },
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to add a comment.` }] };
    }
    const data = await zendeskFetch("PUT", `/api/v2/tickets/${input.ticket_id}.json`, {
      ticket: {
        comment: { body: input.body, public: input.public ?? false },
      },
    });
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, ticket: data.ticket?.id }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
