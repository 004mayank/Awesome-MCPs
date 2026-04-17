# Calendar Agent (end-to-end)

An end-to-end agent app that uses the **Google Calendar MCP** tools to inspect schedules, compute free/busy, and create events with explicit confirmation.

## Provider support
- OpenAI (`LLM_PROVIDER=openai`)
- Anthropic (`LLM_PROVIDER=anthropic`)

## Setup

```bash
cd agents/calendar-agent
npm i
```

Env:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default: `http://localhost:8787/oauth/callback`)

LLM:
- `LLM_PROVIDER=openai|anthropic`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

## Commands

### List calendars
```bash
node src/cli.js calendars
```

### Propose meeting slots (uses freebusy + LLM)
```bash
node src/cli.js propose --calendarIds primary --timeMin 2026-04-18T04:00:00Z --timeMax 2026-04-19T04:00:00Z --minutes 45
```

### Create an event (confirm)
```bash
node src/cli.js create --calendarId primary --summary "Design review" --start 2026-04-18T10:00:00+05:30 --end 2026-04-18T10:45:00+05:30 --confirm
```
