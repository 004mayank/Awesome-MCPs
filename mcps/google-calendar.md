# Google Calendar MCP

Server implementation: `servers/google-calendar-mcp`

## What users can do (use-cases)
Read:
- List calendars.
- List events in a time window.
- Compute free/busy windows.

Write (with explicit confirmation):
- Create, update, delete events.

## Tools (developer view)
Read:
- `cal_list_calendars({})`
- `cal_list_events({ calendarId, timeMin, timeMax, q?, pageToken?, maxResults? })`
- `cal_freebusy({ timeMin, timeMax, calendarIds })`

Write (requires `confirm:true`):
- `cal_create_event({ calendarId, summary, start, end, description?, location?, attendees?, confirm? })`
- `cal_update_event({ calendarId, eventId, patch, confirm? })`
- `cal_delete_event({ calendarId, eventId, confirm? })`

## Auth / setup
- **OAuth** (Google) via localhost redirect (see server README).
- Scopes:
  - read: `calendar.readonly`
  - write (gated): `calendar.events`

## Safety / risk
- **Risk:** medium.
- Guardrails:
  - all writes require `confirm:true`
  - avoid spamming attendees

## Example prompts
- “Show my next 10 events on primary.”
- “Find free 45-min slots next week between 10:00–18:00.”
- “Create an event ‘Design review’ next Tue 3pm IST (confirm).”
