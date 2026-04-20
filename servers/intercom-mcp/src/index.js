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

async function intercomFetch(path, { method = "GET", query = {}, body } = {}) {
  const token = requireEnv("INTERCOM_ACCESS_TOKEN");

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
  }
  const url = `https://api.intercom.io${path}${qs.toString() ? `?${qs.toString()}` : ""}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
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
    const err = new Error(`Intercom API error: HTTP ${res.status} ${res.statusText}`);
    err.details = { status: res.status, statusText: res.statusText, body: json };
    throw err;
  }
  return json;
}

const server = new McpServer({
  name: "intercom-mcp",
  version: "0.1.0",
});

server.tool("intercom_me", {}, async () => {
  const data = await intercomFetch("/me");
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            type: data?.type ?? null,
            id: data?.id ?? null,
            email: data?.email ?? null,
            name: data?.name ?? null,
          },
          null,
          2
        ),
      },
    ],
  };
});

server.tool(
  "intercom_list_contacts",
  {
    per_page: { type: "number", description: "Items per page (default 50).", optional: true },
    starting_after: { type: "string", description: "Cursor for pagination.", optional: true },
  },
  async (input) => {
    const per_page = Number.isFinite(input?.per_page) ? input.per_page : 50;
    const starting_after = input?.starting_after;

    const data = await intercomFetch("/contacts", {
      query: {
        per_page,
        starting_after,
      },
    });

    const contacts = data?.data ?? [];
    const next = data?.pages?.next?.starting_after ?? null;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              paging: { next_starting_after: next },
              contacts: contacts.map((c) => ({
                id: c.id,
                external_id: c.external_id ?? null,
                email: c.email ?? null,
                name: c.name ?? null,
                created_at: c.created_at ?? null,
                updated_at: c.updated_at ?? null,
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
  "intercom_list_conversations",
  {
    per_page: { type: "number", description: "Items per page (default 50).", optional: true },
    starting_after: { type: "string", description: "Cursor for pagination.", optional: true },
  },
  async (input) => {
    const per_page = Number.isFinite(input?.per_page) ? input.per_page : 50;
    const starting_after = input?.starting_after;

    const data = await intercomFetch("/conversations", {
      query: {
        per_page,
        starting_after,
      },
    });

    const convos = data?.conversations ?? data?.data ?? [];
    const next = data?.pages?.next?.starting_after ?? null;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              paging: { next_starting_after: next },
              conversations: (convos ?? []).map((c) => ({
                id: c.id,
                created_at: c.created_at ?? null,
                updated_at: c.updated_at ?? null,
                state: c.state ?? null,
                title: c.title ?? null,
                open: c.open ?? null,
                priority: c.priority ?? null,
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
  "intercom_get_conversation",
  {
    conversation_id: { type: "string", description: "Conversation ID." },
  },
  async (input) => {
    const data = await intercomFetch(`/conversations/${input.conversation_id}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "intercom_reply_to_conversation",
  {
    conversation_id: { type: "string", description: "Conversation ID." },
    message_type: { type: "string", description: "reply|note (default reply).", optional: true },
    body: { type: "string", description: "Message body." },
    admin_id: { type: "string", description: "Admin ID (author)." },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to send.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return {
        content: [
          {
            type: "text",
            text: `Write action blocked. Re-run with {"confirm": true} to reply to the Intercom conversation.`,
          },
        ],
      };
    }

    const message_type = input?.message_type ?? "reply";
    const data = await intercomFetch(`/conversations/${input.conversation_id}/reply`, {
      method: "POST",
      body: {
        message_type,
        type: "admin",
        admin_id: input.admin_id,
        body: input.body,
      },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ok: true, result: data }, null, 2),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

