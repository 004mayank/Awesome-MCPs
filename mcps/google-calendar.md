# Google Calendar MCP

## What users can do (use-cases)
- Check availability (“when am I free for 45 minutes next week?”).
- Summarize upcoming schedule and highlight conflicts.
- Create meetings/events with title, attendees, location, and agenda.
- Update or cancel events (optional, gated).

## Tools (developer view)
Common tool surface:
- `calendar.freebusy({ start, end, calendars? }) -> { busy[] }`
- `calendar.list_events({ calendarId, start, end, query? }) -> { events[] }`
- `calendar.create_event({ calendarId, title, start, end, attendees?, location?, description? }) -> { event }` *(write-gated)*
- `calendar.update_event({ calendarId, eventId, patch }) -> { event }` *(write-gated)*
- `calendar.delete_event({ calendarId, eventId }) -> { ok }` *(write-gated)*

## Auth / setup
- **OAuth** (Google).
- Recommended scopes:
  - read-only: `calendar.readonly`
  - write: `calendar.events`

## Safety / risk
- **Risk:** medium if writes enabled.
- Guardrails:
  - default to read-only
  - explicit confirmation before creating/updating/deleting events
  - avoid spamming attendees

## Example prompts
- “Find three 30-min slots I’m free this week (work hours only).”
- “Create an event titled ‘Design review’ next Tue 3pm IST (ask before creating).”
