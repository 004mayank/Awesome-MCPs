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

function sfBase() {
  // e.g. https://your-domain.my.salesforce.com
  return requireEnv("SALESFORCE_INSTANCE_URL").replace(/\/$/, "");
}

function sfToken() {
  return requireEnv("SALESFORCE_ACCESS_TOKEN");
}

async function sfFetch(method, path, body) {
  const res = await fetch(`${sfBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${sfToken()}`,
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
    const err = new Error(`Salesforce API error: ${res.status}`);
    err.details = json;
    throw err;
  }
  return json;
}

function apiVersion() {
  return process.env.SALESFORCE_API_VERSION || "v61.0";
}

const server = new McpServer({ name: "salesforce-mcp", version: "0.1.0" });

server.tool(
  "salesforce_limits",
  {},
  async () => {
    const data = await sfFetch("GET", `/services/data/${apiVersion()}/limits`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "salesforce_sobjects_list",
  {},
  async () => {
    const data = await sfFetch("GET", `/services/data/${apiVersion()}/sobjects`);
    const simplified = (data.sobjects || []).map((s) => ({ name: s.name, label: s.label, keyPrefix: s.keyPrefix }));
    return { content: [{ type: "text", text: JSON.stringify({ sobjects: simplified }, null, 2) }] };
  }
);

server.tool(
  "salesforce_query",
  {
    soql: { type: "string", description: "SOQL query." },
  },
  async (input) => {
    const qs = new URLSearchParams({ q: input.soql });
    const data = await sfFetch("GET", `/services/data/${apiVersion()}/query?${qs.toString()}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "salesforce_create_record",
  {
    sobject: { type: "string", description: "SObject API name, e.g. Account, Contact." },
    fields: { type: "object", description: "Record fields object." },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true },
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to create the record.` }] };
    }
    const data = await sfFetch(
      "POST",
      `/services/data/${apiVersion()}/sobjects/${encodeURIComponent(input.sobject)}`,
      input.fields
    );
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id: data.id, success: data.success }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
