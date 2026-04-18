# Stripe Agent (end-to-end)

Uses the **Stripe MCP** tools.

## Setup
```bash
cd agents/stripe-agent
npm i
```

Env:
- `STRIPE_API_KEY`

## Commands
List customers:
```bash
node src/cli.js customers --limit 10
```

Get customer:
```bash
node src/cli.js customer --id cus_...
```

Create customer (confirm):
```bash
node src/cli.js create-customer --email "a@b.com" --name "Alice" --confirm
```

Refund a payment intent (confirm):
```bash
node src/cli.js refund --payment-intent pi_... --reason requested_by_customer --confirm
```
