import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pg from "pg";

const { Client } = pg;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function confirmOk(input = {}) {
  return Boolean(input.confirm);
}

function ensureSingleStatement(sql) {
  const s = String(sql || "").trim();
  // naive guard: disallow semicolons except possibly trailing
  const semi = s.indexOf(";");
  if (semi !== -1 && semi !== s.length - 1) {
    throw new Error("Multiple statements are not allowed");
  }
}

function isSelectOnly(sql) {
  const s = String(sql || "").trim().toLowerCase();
  return s.startsWith("select") || s.startsWith("with");
}

async function withClient(fn) {
  const connectionString = requireEnv("PG_CONNECTION_STRING");
  const sslmode = (process.env.PG_SSLMODE || "").toLowerCase();

  const client = new Client({
    connectionString,
    ssl: sslmode === "require" ? { rejectUnauthorized: false } : undefined,
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 10000),
  });

  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}

const server = new McpServer({ name: "postgres-mcp", version: "0.1.0" });

server.tool(
  "pg_list_tables",
  {
    schema: { type: "string", description: "Schema name (default public).", optional: true },
  },
  async (input) => {
    const schema = input?.schema || "public";
    const rows = await withClient(async (c) => {
      const res = await c.query(
        `select table_name from information_schema.tables where table_schema = $1 and table_type='BASE TABLE' order by table_name`,
        [schema]
      );
      return res.rows;
    });
    return { content: [{ type: "text", text: JSON.stringify({ schema, tables: rows.map((r) => r.table_name) }, null, 2) }] };
  }
);

server.tool(
  "pg_describe_table",
  {
    table: { type: "string", description: "Table name (optionally schema-qualified like public.users)." },
  },
  async (input) => {
    const [schema, table] = input.table.includes(".") ? input.table.split(".") : ["public", input.table];

    const rows = await withClient(async (c) => {
      const res = await c.query(
        `select column_name, data_type, is_nullable, column_default
         from information_schema.columns
         where table_schema = $1 and table_name = $2
         order by ordinal_position`,
        [schema, table]
      );
      return res.rows;
    });

    return { content: [{ type: "text", text: JSON.stringify({ schema, table, columns: rows }, null, 2) }] };
  }
);

server.tool(
  "pg_query",
  {
    sql: { type: "string", description: "SELECT query only (single statement)." },
    params: { type: "array", description: "Positional params array (optional).", items: {}, optional: true },
    limit: { type: "number", description: "Max rows to return (default 200).", optional: true },
  },
  async (input) => {
    ensureSingleStatement(input.sql);
    if (!isSelectOnly(input.sql)) throw new Error("pg_query only allows SELECT/WITH queries");

    const limit = Number.isFinite(input?.limit) ? input.limit : 200;
    const sql = `select * from (${input.sql.replace(/;\s*$/, "")}) as _q limit ${Math.max(1, Math.min(limit, 5000))}`;

    const out = await withClient(async (c) => {
      const res = await c.query(sql, input?.params || []);
      return { rowCount: res.rowCount, rows: res.rows };
    });

    return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
  }
);

server.tool(
  "pg_execute",
  {
    sql: { type: "string", description: "Write query (INSERT/UPDATE/DELETE/DDL). Single statement." },
    params: { type: "array", description: "Positional params array (optional).", items: {}, optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true },
  },
  async (input) => {
    ensureSingleStatement(input.sql);
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to execute.` }] };
    }

    const out = await withClient(async (c) => {
      const res = await c.query(input.sql, input?.params || []);
      return { command: res.command, rowCount: res.rowCount };
    });

    return { content: [{ type: "text", text: JSON.stringify({ ok: true, ...out }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
