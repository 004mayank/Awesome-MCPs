#!/usr/bin/env node

import fs from 'node:fs/promises';

import { connectCalendarMcp, callTool } from './mcp-client.js';
import { llmGenerate } from './llm.js';

function argMap(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (!nxt || nxt.startsWith('--')) out[k] = true;
      else { out[k] = nxt; i++; }
    } else out._.push(a);
  }
  return out;
}

function usage() {
  console.log(`Calendar Agent

Usage:
  node src/cli.js calendars
  node src/cli.js events --calendarId primary --timeMin <RFC3339> --timeMax <RFC3339>
  node src/cli.js freebusy --calendarIds primary --timeMin <RFC3339> --timeMax <RFC3339>
  node src/cli.js propose --calendarIds primary --timeMin <RFC3339> --timeMax <RFC3339> --minutes 45

Write (requires --confirm):
  node src/cli.js create --calendarId primary --summary "..." --start <RFC3339> --end <RFC3339> [--attendees "a@b.com,c@d.com"] [--confirm]

Env:
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
  LLM_PROVIDER=openai|anthropic
  OPENAI_API_KEY or ANTHROPIC_API_KEY
`);
}

async function systemPrompt() {
  return fs.readFile(new URL('../prompts/system.md', import.meta.url), 'utf8');
}

function csv(s) {
  return (s || '').split(',').map(x => x.trim()).filter(Boolean);
}

function parseIds(s) {
  const ids = csv(s);
  if (!ids.length) throw new Error('calendarIds is required');
  return ids;
}

async function main() {
  const args = argMap(process.argv.slice(2));
  const cmd = args._[0];
  if (!cmd || args.help) return usage();

  const confirm = args.confirm === true;
  const { client } = await connectCalendarMcp();
  const sys = await systemPrompt();

  if (cmd === 'calendars') {
    const data = await callTool(client, 'cal_list_calendars', {});
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'events') {
    const data = await callTool(client, 'cal_list_events', {
      calendarId: args.calendarId,
      timeMin: args.timeMin,
      timeMax: args.timeMax,
      q: args.q,
      maxResults: args.maxResults ? Number(args.maxResults) : undefined,
    });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'freebusy') {
    const data = await callTool(client, 'cal_freebusy', {
      calendarIds: parseIds(args.calendarIds),
      timeMin: args.timeMin,
      timeMax: args.timeMax,
    });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === 'propose') {
    const minutes = Number(args.minutes || 45);
    const fb = await callTool(client, 'cal_freebusy', {
      calendarIds: parseIds(args.calendarIds),
      timeMin: args.timeMin,
      timeMax: args.timeMax,
    });

    const proposal = await llmGenerate({
      system: sys,
      user: `Given this free/busy output, propose 3 meeting slots of ${minutes} minutes between timeMin and timeMax. Output as bullet list with RFC3339 start/end.\n\n${JSON.stringify({ minutes, freebusy: fb }).slice(0, 14000)}`,
    });

    console.log(proposal);
    return;
  }

  if (cmd === 'create') {
    const calendarId = args.calendarId;
    const summary = args.summary;
    const start = args.start;
    const end = args.end;
    const attendees = csv(args.attendees);

    if (!confirm) {
      console.log('Dry-run: re-run with --confirm to create event.');
      console.log(JSON.stringify({ calendarId, summary, start, end, attendees }, null, 2));
      return;
    }

    const data = await callTool(client, 'cal_create_event', {
      calendarId,
      summary,
      start,
      end,
      attendees,
      confirm: true,
    });

    console.log(JSON.stringify(data, null, 2));
    return;
  }

  usage();
}

main().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
