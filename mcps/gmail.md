# Gmail MCP

Server implementation: `servers/gmail-mcp`

## What users can do (use-cases)
Read:
- Search emails/threads by sender/topic/time.
- Fetch a thread or message.

Write (with explicit confirmation):
- Create a draft reply.
- Send a draft.

## Tools (developer view)
Read:
- `gmail_search({ q, maxResults?, pageToken? })`
- `gmail_get_thread({ threadId, format? })`
- `gmail_get_message({ messageId, format? })`

Write (requires `confirm:true`):
- `gmail_create_draft_reply({ threadId, body, confirm? })`
- `gmail_send_draft({ draftId, confirm? })`

## Auth / setup
- **OAuth** (Google) via localhost redirect (see server README).
- Scopes:
  - read: `gmail.readonly`
  - write (gated): `gmail.compose`, `gmail.send`

## Safety / risk
- **Risk:** medium (messaging).
- Guardrails:
  - never auto-send
  - writes require `confirm:true`

## Example prompts
- “Search: from:alice subject:onboarding newer_than:30d”
- “Summarize thread <threadId>.”
- “Draft a reply to thread <threadId> with these points (confirm).”
