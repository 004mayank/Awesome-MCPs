import {
  McpServer,
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/index.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN is required');
}

const BASE = 'https://api.github.com';

async function ghFetch(path, { method = 'GET', headers = {}, query } = {}) {
  const url = new URL(BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': headers.Accept || 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...headers,
    },
  });

  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = res.headers.get('x-ratelimit-reset');

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    const extra = remaining !== null ? ` (rate remaining=${remaining}, reset=${reset})` : '';
    throw new Error(`GitHub API error ${res.status}${extra}: ${txt || res.statusText}`);
  }

  return { res, remaining, reset };
}

async function ghJson(path, opts) {
  const { res, remaining, reset } = await ghFetch(path, opts);
  const data = await res.json();
  return { data, remaining, reset };
}

async function ghText(path, opts) {
  const { res, remaining, reset } = await ghFetch(path, opts);
  const text = await res.text();
  return { text, remaining, reset };
}

function clampPerPage(n) {
  const x = Number(n || 30);
  if (Number.isNaN(x)) return 30;
  return Math.max(1, Math.min(100, x));
}

const server = new McpServer({
  name: 'github-mcp',
  version: '0.1.0',
});

server.tool(
  'gh_list_issues',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    state: { type: 'string', description: 'open|closed|all', optional: true },
    labels: { type: 'string', description: 'Comma-separated label names', optional: true },
    per_page: { type: 'number', optional: true },
  },
  async ({ owner, repo, state, labels, per_page }) => {
    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/issues`, {
      query: {
        state: state || 'open',
        labels,
        per_page: clampPerPage(per_page),
      },
    });

    // Note: GitHub returns PRs in the issues API; filter them out.
    const issues = data.filter(i => !i.pull_request);

    return {
      content: [
        { type: 'text', text: JSON.stringify({ issues, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_list_prs',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    state: { type: 'string', description: 'open|closed|all', optional: true },
    base: { type: 'string', optional: true },
    head: { type: 'string', optional: true },
    per_page: { type: 'number', optional: true },
  },
  async ({ owner, repo, state, base, head, per_page }) => {
    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/pulls`, {
      query: {
        state: state || 'open',
        base,
        head,
        per_page: clampPerPage(per_page),
      },
    });

    return {
      content: [
        { type: 'text', text: JSON.stringify({ prs: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_get_pr',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    number: { type: 'number' },
  },
  async ({ owner, repo, number }) => {
    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/pulls/${number}`, {});
    return {
      content: [
        { type: 'text', text: JSON.stringify({ pr: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_get_pr_diff',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    number: { type: 'number' },
  },
  async ({ owner, repo, number }) => {
    const { text, remaining, reset } = await ghText(`/repos/${owner}/${repo}/pulls/${number}`, {
      headers: {
        Accept: 'application/vnd.github.v3.diff',
      },
    });
    return {
      content: [
        { type: 'text', text: JSON.stringify({ diff: text, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_list_workflow_runs',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    branch: { type: 'string', optional: true },
    status: { type: 'string', optional: true },
    per_page: { type: 'number', optional: true },
  },
  async ({ owner, repo, branch, status, per_page }) => {
    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/actions/runs`, {
      query: {
        branch,
        status,
        per_page: clampPerPage(per_page),
      },
    });
    return {
      content: [
        { type: 'text', text: JSON.stringify({ runs: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
