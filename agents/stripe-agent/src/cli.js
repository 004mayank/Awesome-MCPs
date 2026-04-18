#!/usr/bin/env node
import { connectStripeMcp, callTool } from './mcp-client.js';

function usage() {
  console.log(`Stripe Agent\n\nCommands:\n  customers [--limit <n>] [--email <email>]\n  customer --id <cus_...>\n  create-customer [--email <email>] [--name <name>] [--confirm]\n  refund --payment-intent <pi_...> [--amount <n>] [--reason <reason>] [--confirm]\n`);
}

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

const cmd = process.argv[2];
if (!cmd || cmd === '--help' || cmd === '-h') {
  usage();
  process.exit(0);
}

async function main() {
  const { client, transport } = await connectStripeMcp();
  try {
    if (cmd === 'customers') {
      const limit = getArg('--limit');
      const email = getArg('--email');
      const out = await callTool(client, 'stripe_list_customers', {
        limit: limit ? Number(limit) : undefined,
        email: email || undefined,
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'customer') {
      const id = getArg('--id');
      if (!id) throw new Error('Missing --id');
      const out = await callTool(client, 'stripe_get_customer', { customer_id: id });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'create-customer') {
      const email = getArg('--email');
      const name = getArg('--name');
      const out = await callTool(client, 'stripe_create_customer', {
        email: email || undefined,
        name: name || undefined,
        confirm: hasFlag('--confirm'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    if (cmd === 'refund') {
      const pi = getArg('--payment-intent');
      const amount = getArg('--amount');
      const reason = getArg('--reason');
      if (!pi) throw new Error('Missing --payment-intent');
      const out = await callTool(client, 'stripe_create_refund', {
        payment_intent: pi,
        amount: amount ? Number(amount) : undefined,
        reason: reason || undefined,
        confirm: hasFlag('--confirm'),
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    throw new Error(`Unknown command: ${cmd}`);
  } finally {
    await transport.close();
  }
}

main().catch((e) => {
  console.error(e?.stack || String(e));
  process.exit(1);
});
