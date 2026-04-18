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

async function stripeFetch(method, path, body) {
  const key = requireEnv("STRIPE_API_KEY");
  const base = "https://api.stripe.com/v1";

  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const url = `${base}${path}`;
  const params = new URLSearchParams();
  if (body && typeof body === "object") {
    for (const [k, v] of Object.entries(body)) {
      if (v === undefined || v === null) continue;
      // minimal: only primitive values
      params.set(k, String(v));
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: method === "GET" ? undefined : params.toString(),
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`Stripe API error: ${res.status}`);
    err.details = json;
    throw err;
  }
  return json;
}

const server = new McpServer({ name: "stripe-mcp", version: "0.1.0" });

server.tool(
  "stripe_list_customers",
  {
    limit: { type: "number", description: "Max customers (default 10).", optional: true },
    email: { type: "string", description: "Filter by email (server-side search not supported; client filter).", optional: true }
  },
  async (input) => {
    const limit = Number.isFinite(input?.limit) ? input.limit : 10;
    const qs = new URLSearchParams({ limit: String(limit) });
    const data = await stripeFetch("GET", `/customers?${qs.toString()}`);

    let customers = (data.data || []).map((c) => ({ id: c.id, email: c.email, name: c.name, created: c.created }));
    if (input?.email) customers = customers.filter((c) => (c.email || "").toLowerCase() === input.email.toLowerCase());

    return { content: [{ type: "text", text: JSON.stringify({ customers }, null, 2) }] };
  }
);

server.tool(
  "stripe_get_customer",
  {
    customer_id: { type: "string", description: "Customer id (cus_...)" }
  },
  async (input) => {
    const data = await stripeFetch("GET", `/customers/${encodeURIComponent(input.customer_id)}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "stripe_create_customer",
  {
    email: { type: "string", description: "Customer email.", optional: true },
    name: { type: "string", description: "Customer name.", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true }
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to create the customer.` }] };
    }
    const data = await stripeFetch("POST", "/customers", { email: input.email, name: input.name });
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id: data.id }, null, 2) }] };
  }
);

server.tool(
  "stripe_create_refund",
  {
    payment_intent: { type: "string", description: "PaymentIntent id (pi_...)" },
    amount: { type: "number", description: "Amount in smallest currency unit (optional; default full).", optional: true },
    reason: { type: "string", description: "duplicate|fraudulent|requested_by_customer (optional).", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true }
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to create the refund.` }] };
    }
    const data = await stripeFetch("POST", "/refunds", {
      payment_intent: input.payment_intent,
      amount: input.amount,
      reason: input.reason,
    });
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, id: data.id, status: data.status }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
