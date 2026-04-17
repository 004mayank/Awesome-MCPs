# Google Calendar MCP

Google Calendar MCP server using Google OAuth (localhost redirect).

## Auth setup (required)
Env vars:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default: `http://localhost:8787/oauth/callback`)
- `GOOGLE_TOKEN_PATH` (default: `Awesome-MCPs/.secrets/google-token.json`)

Scopes used:
- Read: `https://www.googleapis.com/auth/calendar.readonly`
- Write (gated with `confirm=true`): `https://www.googleapis.com/auth/calendar.events`

## Run

```bash
cd servers/google-calendar-mcp
npm i
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export GOOGLE_REDIRECT_URI="http://localhost:8787/oauth/callback"

npm start
```

## Tools
Read:
- `cal_list_calendars({})`
- `cal_list_events({ calendarId, timeMin, timeMax, q?, pageToken?, maxResults? })`
- `cal_freebusy({ timeMin, timeMax, calendarIds })`

Write (requires `confirm:true`):
- `cal_create_event({ calendarId, summary, start, end, description?, location?, attendees?, confirm? })`
- `cal_update_event({ calendarId, eventId, patch, confirm? })`
- `cal_delete_event({ calendarId, eventId, confirm? })`
