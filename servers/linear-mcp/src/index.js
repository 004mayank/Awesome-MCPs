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

async function linearGraphQL(token, query, variables) {
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: variables || {} }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    const err = new Error(`Linear API error: ${json.errors[0]?.message || "unknown"}`);
    err.details = json.errors;
    throw err;
  }
  return json.data;
}

const server = new McpServer({ name: "linear-mcp", version: "0.1.0" });

server.tool(
  "linear_list_teams",
  {},
  async () => {
    const LINEAR_API_KEY = requireEnv("LINEAR_API_KEY");
    const data = await linearGraphQL(
      LINEAR_API_KEY,
      `query { teams { nodes { id key name } } }`
    );
    return { content: [{ type: "text", text: JSON.stringify({ teams: data.teams.nodes }, null, 2) }] };
  }
);

server.tool(
  "linear_search_issues",
  {
    query: { type: "string", description: "Text query to search (in title/description)." },
    first: { type: "number", description: "Max results (default 20).", optional: true },
  },
  async (input) => {
    const LINEAR_API_KEY = requireEnv("LINEAR_API_KEY");
    const first = Number.isFinite(input?.first) ? input.first : 20;
    const data = await linearGraphQL(
      LINEAR_API_KEY,
      `query($q: String!, $first: Int!) {
        issueSearch(query: $q, first: $first) {
          nodes { id identifier title url updatedAt state { name } assignee { name } }
        }
      }`,
      { q: input.query, first }
    );

    return { content: [{ type: "text", text: JSON.stringify({ issues: data.issueSearch.nodes }, null, 2) }] };
  }
);

server.tool(
  "linear_create_issue",
  {
    teamId: { type: "string", description: "Team id." },
    title: { type: "string", description: "Issue title." },
    description: { type: "string", description: "Issue description (markdown).", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to create.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to create the Linear issue.` }] };
    }
    const LINEAR_API_KEY = requireEnv("LINEAR_API_KEY");
    const data = await linearGraphQL(
      LINEAR_API_KEY,
      `mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id identifier title url }
        }
      }`,
      { input: { teamId: input.teamId, title: input.title, description: input.description || undefined } }
    );
    return { content: [{ type: "text", text: JSON.stringify(data.issueCreate, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
