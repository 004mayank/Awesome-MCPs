# Stripe MCP

Auth: API key via `STRIPE_API_KEY`.

Write actions are **write-gated** (must pass `confirm:true`).

## Env
- `STRIPE_API_KEY`

## Tools
- `stripe_list_customers`
- `stripe_get_customer`
- `stripe_create_customer` (**confirm:true**)
- `stripe_create_refund` (**confirm:true**)

## Run
```bash
cd servers/stripe-mcp
npm i
export STRIPE_API_KEY="..."
node src/index.js
```
