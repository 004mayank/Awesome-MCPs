# Gmail MCP

## What users can do (use-cases)
- Search emails/threads by sender/topic/time.
- Summarize a thread and extract action items.
- Draft a reply in the right tone.
- (Optional) Send the drafted reply with explicit confirmation.
- Apply labels / archive (optional, gated).

## Tools (developer view)
Common tool surface:
- `gmail.search({ query, maxResults?, pageToken? }) -> { messages[], nextPageToken? }`
- `gmail.get_thread({ threadId }) -> { thread }`
- `gmail.get_message({ messageId }) -> { message }`
- `gmail.create_draft_reply({ threadId, body }) -> { draftId }` *(write-gated)*
- `gmail.send_draft({ draftId }) -> { ok }` *(separately gated)*
- `gmail.modify_labels({ threadId, add[], remove[] }) -> { ok }` *(write-gated)*

## Auth / setup
- **OAuth** (Google).
- Recommended scopes:
  - read-only: `gmail.readonly`
  - drafting/sending: `gmail.compose` / `gmail.send` (only if needed)

## Safety / risk
- **Risk:** medium because messaging is sensitive.
- Strong recommendation:
  - default to read-only + draft-only
  - sending requires explicit confirmation
  - never auto-send

## Example prompts
- “Summarize the last email thread with Alice about onboarding.”
- “Draft a polite reply confirming next steps (don’t send).”
