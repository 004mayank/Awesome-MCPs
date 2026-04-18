import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function figmaFetch(path) {
  const token = requireEnv("FIGMA_TOKEN");
  const res = await fetch(`https://api.figma.com/v1/${path}`, {
    headers: {
      "X-Figma-Token": token,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Figma API error: ${res.status}`);
    err.details = json;
    throw err;
  }
  return json;
}

const server = new McpServer({ name: "figma-mcp", version: "0.1.0" });

server.tool(
  "figma_get_file",
  {
    file_key: { type: "string", description: "Figma file key." },
  },
  async (input) => {
    const data = await figmaFetch(`files/${encodeURIComponent(input.file_key)}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "figma_get_file_nodes",
  {
    file_key: { type: "string", description: "Figma file key." },
    ids: { type: "string", description: "Comma-separated node ids." },
  },
  async (input) => {
    const qs = new URLSearchParams({ ids: input.ids });
    const data = await figmaFetch(`files/${encodeURIComponent(input.file_key)}/nodes?${qs.toString()}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "figma_list_team_projects",
  {
    team_id: { type: "string", description: "Figma team id." },
  },
  async (input) => {
    const data = await figmaFetch(`teams/${encodeURIComponent(input.team_id)}/projects`);
    const projects = (data.projects || []).map((p) => ({ id: p.id, name: p.name }));
    return { content: [{ type: "text", text: JSON.stringify({ projects }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
