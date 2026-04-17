function env(name, fallback = '') {
  const v = process.env[name];
  return (v === undefined || v === null || v === '') ? fallback : v;
}

export function llmConfig() {
  const provider = env('LLM_PROVIDER', '').toLowerCase();
  if (!provider) throw new Error('LLM_PROVIDER is required (openai|anthropic)');

  if (provider === 'openai') {
    const key = env('OPENAI_API_KEY');
    if (!key) throw new Error('OPENAI_API_KEY is required');
    return {
      provider,
      apiKey: key,
      model: env('LLM_MODEL', 'gpt-4.1-mini'),
    };
  }

  if (provider === 'anthropic') {
    const key = env('ANTHROPIC_API_KEY');
    if (!key) throw new Error('ANTHROPIC_API_KEY is required');
    return {
      provider,
      apiKey: key,
      model: env('LLM_MODEL', 'claude-3-5-sonnet-latest'),
    };
  }

  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}

export async function llmGenerate({ system, user }) {
  const cfg = llmConfig();

  if (cfg.provider === 'openai') {
    const body = {
      model: cfg.model,
      input: [
        { role: 'system', content: [{ type: 'text', text: system }] },
        { role: 'user', content: [{ type: 'text', text: user }] },
      ],
    };

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`OpenAI error ${res.status}: ${txt || res.statusText}`);
    }

    const data = await res.json();
    return data.output_text || '';
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 900,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Anthropic error ${res.status}: ${txt || res.statusText}`);
  }

  const data = await res.json();
  const text = data?.content?.find(c => c.type === 'text')?.text;
  return text || '';
}
