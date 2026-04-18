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

async function asanaFetch(method, token, path, body) {
  const res = await fetch(`https://app.asana.com/api/1.0/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
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
    const err = new Error(`Asana API error: ${res.status}`);
    err.details = json;
    throw err;
  }
  return json;
}

const server = new McpServer({ name: "asana-mcp", version: "0.1.0" });

server.tool(
  "asana_list_workspaces",
  {},
  async () => {
    const ASANA_TOKEN = requireEnv("ASANA_TOKEN");
    const data = await asanaFetch("GET", ASANA_TOKEN, "workspaces");
    const workspaces = (data.data || []).map((w) => ({ gid: w.gid, name: w.name }));
    return { content: [{ type: "text", text: JSON.stringify({ workspaces }, null, 2) }] };
  }
);

server.tool(
  "asana_search_tasks",
  {
    workspace_gid: { type: "string", description: "Workspace GID." },
    text: { type: "string", description: "Text to search for.", optional: true },
    assignee: { type: "string", description: "Assignee GID (optional).", optional: true },
    completed: { type: "boolean", description: "Completed filter (optional).", optional: true },
    limit: { type: "number", description: "Max results (default 20).", optional: true },
  },
  async (input) => {
    const ASANA_TOKEN = requireEnv("ASANA_TOKEN");
    const limit = Number.isFinite(input?.limit) ? input.limit : 20;

    const qs = new URLSearchParams({
      limit: String(limit),
      opt_fields: "gid,name,completed,assignee.name,permalink_url,modified_at",
    });
    if (input?.text) qs.set("text", input.text);
    if (typeof input?.completed === "boolean") qs.set("completed", input.completed ? "true" : "false");
    if (input?.assignee) qs.set("assignee", input.assignee);

    const data = await asanaFetch(
      "GET",
      ASANA_TOKEN,
      `workspaces/${encodeURIComponent(input.workspace_gid)}/tasks/search?${qs.toString()}`
    );

    return { content: [{ type: "text", text: JSON.stringify({ tasks: data.data || [] }, null, 2) }] };
  }
);

server.tool(
  "asana_create_task",
  {
    workspace_gid: { type: "string", description: "Workspace GID." },
    name: { type: "string", description: "Task name." },
    notes: { type: "string", description: "Task notes/description.", optional: true },
    assignee: { type: "string", description: "Assignee GID.", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true },
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to create the task.` }] };
    }
    const ASANA_TOKEN = requireEnv("ASANA_TOKEN");
    const body = {
      data: {
        workspace: input.workspace_gid,
        name: input.name,
        notes: input.notes || undefined,
        assignee: input.assignee || undefined,
      },
    };

    const data = await asanaFetch("POST", ASANA_TOKEN, "tasks", body);
    const t = data.data;
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, gid: t?.gid }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
