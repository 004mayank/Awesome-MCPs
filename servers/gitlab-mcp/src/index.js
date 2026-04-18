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
  return (process.env.GITLAB_BASE_URL || "https://gitlab.com").replace(/\/$/, "");
}

async function gitlabFetch(method, path, body) {
  const token = requireEnv("GITLAB_TOKEN");
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      "PRIVATE-TOKEN": token,
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
    const err = new Error(`GitLab API error: ${res.status}`);
    err.details = json;
    throw err;
  }
  return json;
}

const server = new McpServer({ name: "gitlab-mcp", version: "0.1.0" });

server.tool(
  "gitlab_list_projects",
  {
    search: { type: "string", description: "Search string.", optional: true },
    per_page: { type: "number", description: "Per page (default 20).", optional: true },
    page: { type: "number", description: "Page (default 1).", optional: true },
  },
  async (input) => {
    const qs = new URLSearchParams();
    if (input?.search) qs.set("search", input.search);
    qs.set("per_page", String(Number.isFinite(input?.per_page) ? input.per_page : 20));
    qs.set("page", String(Number.isFinite(input?.page) ? input.page : 1));

    const data = await gitlabFetch("GET", `/api/v4/projects?${qs.toString()}`);
    const simplified = (data || []).map((p) => ({ id: p.id, name: p.name, path_with_namespace: p.path_with_namespace, web_url: p.web_url }));
    return { content: [{ type: "text", text: JSON.stringify({ projects: simplified }, null, 2) }] };
  }
);

server.tool(
  "gitlab_list_merge_requests",
  {
    project_id: { type: "number", description: "Project id." },
    state: { type: "string", description: "opened|merged|closed|all (default opened).", optional: true },
  },
  async (input) => {
    const state = input?.state || "opened";
    const qs = new URLSearchParams({ state });
    const data = await gitlabFetch(
      "GET",
      `/api/v4/projects/${encodeURIComponent(String(input.project_id))}/merge_requests?${qs.toString()}`
    );
    const simplified = (data || []).map((mr) => ({ iid: mr.iid, title: mr.title, state: mr.state, web_url: mr.web_url }));
    return { content: [{ type: "text", text: JSON.stringify({ merge_requests: simplified }, null, 2) }] };
  }
);

server.tool(
  "gitlab_create_issue",
  {
    project_id: { type: "number", description: "Project id." },
    title: { type: "string", description: "Issue title." },
    description: { type: "string", description: "Issue description.", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true },
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to create the GitLab issue.` }] };
    }
    const body = { title: input.title, description: input.description || undefined };
    const data = await gitlabFetch(
      "POST",
      `/api/v4/projects/${encodeURIComponent(String(input.project_id))}/issues`,
      body
    );
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, iid: data.iid, web_url: data.web_url }, null, 2) }] };
  }
);

server.tool(
  "gitlab_list_pipelines",
  {
    project_id: { type: "number", description: "Project id." },
    ref: { type: "string", description: "Branch/ref filter (optional).", optional: true },
    per_page: { type: "number", description: "Per page (default 20).", optional: true },
    page: { type: "number", description: "Page (default 1).", optional: true }
  },
  async (input) => {
    const qs = new URLSearchParams();
    if (input?.ref) qs.set("ref", input.ref);
    qs.set("per_page", String(Number.isFinite(input?.per_page) ? input.per_page : 20));
    qs.set("page", String(Number.isFinite(input?.page) ? input.page : 1));

    const data = await gitlabFetch(
      "GET",
      `/api/v4/projects/${encodeURIComponent(String(input.project_id))}/pipelines?${qs.toString()}`
    );
    const simplified = (data || []).map((p) => ({ id: p.id, iid: p.iid, ref: p.ref, status: p.status, web_url: p.web_url, updated_at: p.updated_at }));
    return { content: [{ type: "text", text: JSON.stringify({ pipelines: simplified }, null, 2) }] };
  }
);

server.tool(
  "gitlab_list_pipeline_jobs",
  {
    project_id: { type: "number", description: "Project id." },
    pipeline_id: { type: "number", description: "Pipeline id." }
  },
  async (input) => {
    const data = await gitlabFetch(
      "GET",
      `/api/v4/projects/${encodeURIComponent(String(input.project_id))}/pipelines/${encodeURIComponent(String(input.pipeline_id))}/jobs`
    );
    const simplified = (data || []).map((j) => ({ id: j.id, name: j.name, status: j.status, stage: j.stage, web_url: j.web_url }));
    return { content: [{ type: "text", text: JSON.stringify({ jobs: simplified }, null, 2) }] };
  }
);

server.tool(
  "gitlab_add_merge_request_note",
  {
    project_id: { type: "number", description: "Project id." },
    mr_iid: { type: "number", description: "Merge request IID (not id)." },
    body: { type: "string", description: "Note/comment body." },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true }
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to comment on the merge request.` }] };
    }
    const data = await gitlabFetch(
      "POST",
      `/api/v4/projects/${encodeURIComponent(String(input.project_id))}/merge_requests/${encodeURIComponent(String(input.mr_iid))}/notes`,
      { body: input.body }
    );
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id: data.id, created_at: data.created_at }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
