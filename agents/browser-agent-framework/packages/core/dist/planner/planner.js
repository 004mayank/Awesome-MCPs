import { PlanResponseSchema } from './schema.js';
import { getProvider } from '../llm/providers.js';
export async function planNext(args) {
    const provider = getProvider();
    const system = `You are a browser automation planner.
Return ONLY valid JSON matching:
{
  "done": boolean,
  "reason": string (optional),
  "steps": [
    {"type":"goto","url":"https://..."} |
    {"type":"click","selector":"css"} |
    {"type":"type","selector":"css","text":"..."} |
    {"type":"waitFor","ms":123} |
    {"type":"extractText","selector":"css?"} |
    {"type":"screenshot","path":"name"}
  ]
}
Rules:
- Prefer stable selectors.
- Keep steps short (max 3 per turn).
- If you think the goal is achieved, set done=true and steps=[]
`;
    const user = `GOAL:\n${args.goal}\n\nOBSERVATION:\nurl=${args.observation.url}\ntext=${(args.observation.textSnippet || '').slice(0, 1500)}`;
    const messages = [...args.history, { role: 'user', content: user }];
    const raw = await provider.completeJson({ system, messages });
    const plan = PlanResponseSchema.parse(raw);
    const newHistory = messages.concat([{ role: 'assistant', content: JSON.stringify(plan) }]);
    return { plan, history: newHistory };
}
