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

function jiraAuthHeader(email, apiToken) {
  const basic = Buffer.from(`${email}:${apiToken}`).toString("base64");
  return `Basic ${basic}`;
}

async function jiraFetch(method, baseUrl, email, apiToken, path, body) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method,
    headers: {
      Authorization: jiraAuthHeader(email, apiToken),
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
    const err = new Error(`Jira API error: ${res.status}`);
    err.details = json;
    throw err;
  }
  return json;
}

const server = new McpServer({ name: "jira-mcp", version: "0.1.0" });

server.tool(
  "jira_list_projects",
  {
    expand: { type: "string", description: "Optional expand param.", optional: true },
  },
  async (input) => {
    const JIRA_BASE_URL = requireEnv("JIRA_BASE_URL"); // e.g. https://your-domain.atlassian.net
    const JIRA_EMAIL = requireEnv("JIRA_EMAIL");
    const JIRA_API_TOKEN = requireEnv("JIRA_API_TOKEN");

    const qs = new URLSearchParams();
    if (input?.expand) qs.set("expand", input.expand);

    const data = await jiraFetch(
      "GET",
      JIRA_BASE_URL,
      JIRA_EMAIL,
      JIRA_API_TOKEN,
      `/rest/api/3/project/search?${qs.toString()}`
    );

    const values = data.values || [];
    const simplified = values.map((p) => ({ id: p.id, key: p.key, name: p.name }));
    return { content: [{ type: "text", text: JSON.stringify({ projects: simplified, total: data.total }, null, 2) }] };
  }
);

server.tool(
  "jira_search_issues",
  {
    jql: { type: "string", description: "JQL query." },
    maxResults: { type: "number", description: "Max results (default 20).", optional: true },
    startAt: { type: "number", description: "Start offset (default 0).", optional: true },
    fields: { type: "array", description: "Fields to return (default summary,status,assignee,updated).", items: { type: "string" }, optional: true },
  },
  async (input) => {
    const JIRA_BASE_URL = requireEnv("JIRA_BASE_URL");
    const JIRA_EMAIL = requireEnv("JIRA_EMAIL");
    const JIRA_API_TOKEN = requireEnv("JIRA_API_TOKEN");

    const body = {
      jql: input.jql,
      maxResults: Number.isFinite(input?.maxResults) ? input.maxResults : 20,
      startAt: Number.isFinite(input?.startAt) ? input.startAt : 0,
      fields: input?.fields?.length ? input.fields : ["summary", "status", "assignee", "updated"],
    };

    const data = await jiraFetch("POST", JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, "/rest/api/3/search", body);

    const issues = (data.issues || []).map((i) => ({
      id: i.id,
      key: i.key,
      fields: i.fields,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ total: data.total, startAt: data.startAt, maxResults: data.maxResults, issues }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "jira_create_issue",
  {
    projectKey: { type: "string", description: "Project key, e.g. ENG." },
    issueType: { type: "string", description: "Issue type name, e.g. Task, Bug." },
    summary: { type: "string", description: "Issue summary." },
    description: { type: "string", description: "Plaintext description.", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to create.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to create the Jira issue.` }] };
    }
    const JIRA_BASE_URL = requireEnv("JIRA_BASE_URL");
    const JIRA_EMAIL = requireEnv("JIRA_EMAIL");
    const JIRA_API_TOKEN = requireEnv("JIRA_API_TOKEN");

    // Jira Cloud v3 expects ADF for description; we send minimal ADF when description provided.
    const fields = {
      project: { key: input.projectKey },
      issuetype: { name: input.issueType },
      summary: input.summary,
    };

    if (input.description) {
      fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: input.description }],
          },
        ],
      };
    }

    const data = await jiraFetch("POST", JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, "/rest/api/3/issue", { fields });
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id: data.id, key: data.key }, null, 2) }] };
  }
);

server.tool(
  "jira_add_comment",
  {
    issueKey: { type: "string", description: "Issue key, e.g. ENG-123." },
    body: { type: "string", description: "Comment text." },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to comment.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to add a comment.` }] };
    }
    const JIRA_BASE_URL = requireEnv("JIRA_BASE_URL");
    const JIRA_EMAIL = requireEnv("JIRA_EMAIL");
    const JIRA_API_TOKEN = requireEnv("JIRA_API_TOKEN");

    const body = {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: input.body }],
          },
        ],
      },
    };

    const data = await jiraFetch(
      "POST",
      JIRA_BASE_URL,
      JIRA_EMAIL,
      JIRA_API_TOKEN,
      `/rest/api/3/issue/${encodeURIComponent(input.issueKey)}/comment`,
      body
    );
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id: data.id }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
