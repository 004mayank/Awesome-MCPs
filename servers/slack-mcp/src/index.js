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

async function slackApi(method, token, path, body) {
  const res = await fetch(`https://slack.com/api/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.ok) {
    const err = new Error(`Slack API error: ${json.error || "unknown_error"}`);
    err.details = json;
    throw err;
  }
  return json;
}

const server = new McpServer({
  name: "slack-mcp",
  version: "0.1.0",
});

server.tool(
  "slack_list_channels",
  {
    limit: { type: "number", description: "Max channels to return (default 100).", optional: true },
    cursor: { type: "string", description: "Slack cursor for pagination.", optional: true },
    types: { type: "string", description: "Comma-separated channel types (public_channel,private_channel).", optional: true },
    exclude_archived: { type: "boolean", description: "Exclude archived channels (default true).", optional: true },
  },
  async (input) => {
    const SLACK_BOT_TOKEN = requireEnv("SLACK_BOT_TOKEN");
    const limit = Number.isFinite(input?.limit) ? input.limit : 100;
    const exclude_archived = input?.exclude_archived ?? true;
    const types = input?.types ?? "public_channel,private_channel";

    const qs = new URLSearchParams({
      limit: String(limit),
      exclude_archived: exclude_archived ? "true" : "false",
      types,
    });
    if (input?.cursor) qs.set("cursor", input.cursor);

    const data = await slackApi("GET", SLACK_BOT_TOKEN, `conversations.list?${qs.toString()}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              channels: data.channels?.map((c) => ({ id: c.id, name: c.name, is_private: c.is_private })) ?? [],
              next_cursor: data.response_metadata?.next_cursor || null,
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
  "slack_send_message",
  {
    channel: { type: "string", description: "Channel ID (C...) or DM ID (D...)." },
    text: { type: "string", description: "Message text." },
    thread_ts: { type: "string", description: "Thread timestamp to reply in thread.", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to send.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return {
        content: [
          {
            type: "text",
            text: `Write action blocked. Re-run with {"confirm": true} to send the Slack message.`,
          },
        ],
      };
    }
    const SLACK_BOT_TOKEN = requireEnv("SLACK_BOT_TOKEN");
    const body = { channel: input.channel, text: input.text };
    if (input.thread_ts) body.thread_ts = input.thread_ts;

    const data = await slackApi("POST", SLACK_BOT_TOKEN, "chat.postMessage", body);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              channel: data.channel,
              ts: data.ts,
              message: { text: data.message?.text },
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
  "slack_search_messages",
  {
    query: { type: "string", description: "Slack search query." },
    count: { type: "number", description: "Results per page (default 20).", optional: true },
    page: { type: "number", description: "Page number (default 1).", optional: true },
  },
  async (input) => {
    const SLACK_BOT_TOKEN = requireEnv("SLACK_BOT_TOKEN");
    const count = Number.isFinite(input?.count) ? input.count : 20;
    const page = Number.isFinite(input?.page) ? input.page : 1;

    const qs = new URLSearchParams({ query: input.query, count: String(count), page: String(page) });
    const data = await slackApi("GET", SLACK_BOT_TOKEN, `search.messages?${qs.toString()}`);

    const matches = data.messages?.matches ?? [];
    const simplified = matches.map((m) => ({
      text: m.text,
      ts: m.ts,
      channel: { id: m.channel?.id, name: m.channel?.name },
      user: m.user,
      permalink: m.permalink,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total: data.messages?.total ?? null,
              paging: data.messages?.paging ?? null,
              matches: simplified,
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
