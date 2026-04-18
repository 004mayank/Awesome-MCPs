export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type LlmProvider = {
  completeJson: (args: {
    system: string;
    messages: ChatMessage[];
    jsonSchemaHint?: string;
  }) => Promise<unknown>;
};

export function getProvider(): LlmProvider {
  const p = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (p === 'openai') return openaiProvider();
  if (p === 'anthropic') return anthropicProvider();
  throw new Error('Set LLM_PROVIDER=openai|anthropic');
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function openaiProvider(): LlmProvider {
  const key = requireEnv('OPENAI_API_KEY');
  const model = process.env.LLM_MODEL || 'gpt-4.1-mini';
  return {
    async completeJson({ system, messages }) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: system }, ...messages],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${JSON.stringify(json)}`);
      const content = json.choices?.[0]?.message?.content;
      return content ? JSON.parse(content) : {};
    },
  };
}

function anthropicProvider(): LlmProvider {
  const key = requireEnv('ANTHROPIC_API_KEY');
  const model = process.env.LLM_MODEL || 'claude-3-5-sonnet-latest';
  return {
    async completeJson({ system, messages }) {
      // Minimal Messages API usage.
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          system,
          max_tokens: 800,
          temperature: 0.2,
          messages: messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${JSON.stringify(json)}`);
      const text = json.content?.find((c: any) => c.type === 'text')?.text;
      return text ? JSON.parse(text) : {};
    },
  };
}
