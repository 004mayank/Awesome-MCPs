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

function trelloAuthParams() {
  const key = requireEnv("TRELLO_API_KEY");
  const token = requireEnv("TRELLO_TOKEN");
  return { key, token };
}

async function trelloFetch(path, { method = "GET", query = {}, body } = {}) {
  const { key, token } = trelloAuthParams();

  const qs = new URLSearchParams({ ...query, key, token });
  const url = `https://api.trello.com/1/${path}${path.includes("?") ? "&" : "?"}${qs.toString()}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Trello API error: HTTP ${res.status} ${res.statusText}`);
    err.details = { status: res.status, statusText: res.statusText, body: text };
    throw err;
  }

  // Trello almost always returns JSON.
  return await res.json();
}

const server = new McpServer({
  name: "trello-mcp",
  version: "0.1.0",
});

server.tool(
  "trello_list_boards",
  {
    include_closed: { type: "boolean", description: "Include closed boards (default false).", optional: true },
  },
  async (input) => {
    const includeClosed = input?.include_closed ?? false;
    const boards = await trelloFetch("members/me/boards", {
      query: {
        fields: "name,url,closed,idOrganization",
        lists: "none",
        filter: includeClosed ? "all" : "open",
      },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              boards: (boards ?? []).map((b) => ({
                id: b.id,
                name: b.name,
                url: b.url,
                closed: Boolean(b.closed),
                idOrganization: b.idOrganization ?? null,
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
  "trello_list_lists",
  {
    board_id: { type: "string", description: "Board ID." },
    include_closed: { type: "boolean", description: "Include closed lists (default false).", optional: true },
  },
  async (input) => {
    const includeClosed = input?.include_closed ?? false;
    const lists = await trelloFetch(`boards/${input.board_id}/lists`, {
      query: {
        fields: "name,closed,pos",
        filter: includeClosed ? "all" : "open",
      },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              board_id: input.board_id,
              lists: (lists ?? []).map((l) => ({
                id: l.id,
                name: l.name,
                closed: Boolean(l.closed),
                pos: l.pos,
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
  "trello_list_cards",
  {
    list_id: { type: "string", description: "List ID." },
    include_closed: { type: "boolean", description: "Include closed cards (default false).", optional: true },
  },
  async (input) => {
    const includeClosed = input?.include_closed ?? false;
    const cards = await trelloFetch(`lists/${input.list_id}/cards`, {
      query: {
        fields: "name,desc,url,closed,due,idList,pos",
        filter: includeClosed ? "all" : "open",
      },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              list_id: input.list_id,
              cards: (cards ?? []).map((c) => ({
                id: c.id,
                name: c.name,
                url: c.url,
                closed: Boolean(c.closed),
                due: c.due ?? null,
                idList: c.idList,
                pos: c.pos,
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
  "trello_create_card",
  {
    list_id: { type: "string", description: "List ID to create the card in." },
    name: { type: "string", description: "Card title." },
    desc: { type: "string", description: "Card description.", optional: true },
    due: { type: "string", description: "Due date as ISO-8601 (optional).", optional: true },
    pos: { type: "string", description: "Position: top|bottom or a positive number as string.", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to create.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return {
        content: [
          {
            type: "text",
            text: `Write action blocked. Re-run with {"confirm": true} to create the Trello card.`,
          },
        ],
      };
    }

    const query = {
      idList: input.list_id,
      name: input.name,
    };
    if (input?.desc) query.desc = input.desc;
    if (input?.due) query.due = input.due;
    if (input?.pos) query.pos = input.pos;

    const card = await trelloFetch("cards", {
      method: "POST",
      query,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              card: {
                id: card.id,
                name: card.name,
                url: card.url,
                idList: card.idList,
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

