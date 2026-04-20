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

async function clickupFetch(path, { method = "GET", query = {}, body } = {}) {
  const token = requireEnv("CLICKUP_TOKEN");

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
  }

  const url = `https://api.clickup.com/api/v2/${path}${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: token,
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
    const err = new Error(`ClickUp API error: HTTP ${res.status} ${res.statusText}`);
    err.details = { status: res.status, statusText: res.statusText, body: json };
    throw err;
  }
  return json;
}

const server = new McpServer({
  name: "clickup-mcp",
  version: "0.1.0",
});

server.tool("clickup_list_teams", {}, async () => {
  const data = await clickupFetch("team");
  const teams = data?.teams ?? [];
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            teams: teams.map((t) => ({
              id: t.id,
              name: t.name,
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
  "clickup_list_spaces",
  {
    team_id: { type: "string", description: "Team (workspace) ID." },
    archived: { type: "boolean", description: "Include archived spaces (default false).", optional: true },
  },
  async (input) => {
    const archived = input?.archived ?? false;
    const data = await clickupFetch(`team/${input.team_id}/space`, { query: { archived } });
    const spaces = data?.spaces ?? [];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              team_id: input.team_id,
              spaces: spaces.map((s) => ({
                id: s.id,
                name: s.name,
                private: Boolean(s.private),
                archived: Boolean(s.archived),
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
  "clickup_list_lists",
  {
    space_id: { type: "string", description: "Space ID." },
    archived: { type: "boolean", description: "Include archived lists (default false).", optional: true },
  },
  async (input) => {
    const archived = input?.archived ?? false;
    const data = await clickupFetch(`space/${input.space_id}/list`, { query: { archived } });
    const lists = data?.lists ?? [];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              space_id: input.space_id,
              lists: lists.map((l) => ({
                id: l.id,
                name: l.name,
                archived: Boolean(l.archived),
                folder: l.folder?.id ? { id: l.folder.id, name: l.folder.name } : null,
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
  "clickup_list_tasks",
  {
    list_id: { type: "string", description: "List ID." },
    include_closed: { type: "boolean", description: "Include closed tasks (default false).", optional: true },
    page: { type: "number", description: "Page (0-based).", optional: true },
    order_by: {
      type: "string",
      description: "Order by (id, created, updated, due_date).",
      optional: true,
    },
    reverse: { type: "boolean", description: "Reverse sort (default false).", optional: true },
    subtasks: { type: "boolean", description: "Include subtasks (default true).", optional: true },
    limit: { type: "number", description: "Max tasks per page (default 100).", optional: true },
  },
  async (input) => {
    const include_closed = input?.include_closed ?? false;
    const page = Number.isFinite(input?.page) ? input.page : 0;
    const order_by = input?.order_by;
    const reverse = input?.reverse ?? false;
    const subtasks = input?.subtasks ?? true;
    const limit = Number.isFinite(input?.limit) ? input.limit : 100;

    const data = await clickupFetch(`list/${input.list_id}/task`, {
      query: {
        include_closed,
        page,
        order_by,
        reverse,
        subtasks,
        limit,
      },
    });
    const tasks = data?.tasks ?? [];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              list_id: input.list_id,
              page,
              tasks: tasks.map((t) => ({
                id: t.id,
                name: t.name,
                status: t.status?.status ?? null,
                url: t.url ?? null,
                due_date: t.due_date ?? null,
                assignees: (t.assignees ?? []).map((a) => ({ id: a.id, username: a.username, email: a.email ?? null })),
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
  "clickup_create_task",
  {
    list_id: { type: "string", description: "List ID to create task in." },
    name: { type: "string", description: "Task name." },
    description: { type: "string", description: "Task description (markdown supported).", optional: true },
    due_date_ms: { type: "number", description: "Due date as epoch milliseconds.", optional: true },
    assignee_ids: { type: "array", description: "Array of assignee user IDs.", items: { type: "string" }, optional: true },
    priority: { type: "number", description: "Priority 1 (urgent) .. 4 (low).", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to create.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return {
        content: [
          {
            type: "text",
            text: `Write action blocked. Re-run with {"confirm": true} to create the ClickUp task.`,
          },
        ],
      };
    }

    const body = {
      name: input.name,
    };
    if (input?.description) body.description = input.description;
    if (Number.isFinite(input?.due_date_ms)) body.due_date = input.due_date_ms;
    if (Array.isArray(input?.assignee_ids)) body.assignees = input.assignee_ids;
    if (Number.isFinite(input?.priority)) body.priority = input.priority;

    const task = await clickupFetch(`list/${input.list_id}/task`, {
      method: "POST",
      body,
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              task: {
                id: task.id,
                name: task.name,
                url: task.url ?? null,
                status: task.status?.status ?? null,
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

