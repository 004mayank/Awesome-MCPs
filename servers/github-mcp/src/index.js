import {
  McpServer,
  StdioServerTransport,
} from '@modelcontextprotocol/sdk/server/index.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
if (!GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN is required');
}

const BASE = 'https://api.github.com';

async function ghFetch(path, { method = 'GET', headers = {}, query, body } = {}) {
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
    body,
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

function jsonBody(obj) {
  return JSON.stringify(obj ?? {});
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

function ensureConfirm(confirm) {
  if (confirm !== true) {
    throw new Error('Write operation requires confirm=true');
  }
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
    per_page: { type: 'number', optional: true }
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
    per_page: { type: 'number', optional: true }
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
    per_page: { type: 'number', optional: true }
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

// ----------------------
// Write tools (gated)
// ----------------------

server.tool(
  'gh_create_issue',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string', optional: true },
    labels: { type: 'array', items: { type: 'string' }, optional: true },
    confirm: { type: 'boolean', optional: true, description: 'Must be true to execute.' }
  },
  async ({ owner, repo, title, body, labels, confirm }) => {
    ensureConfirm(confirm);

    const payload = {
      title,
      body: body || undefined,
      labels: (Array.isArray(labels) && labels.length) ? labels : undefined,
    };

    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: jsonBody(payload),
    });

    return {
      content: [
        { type: 'text', text: JSON.stringify({ issue: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_create_comment',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    issue_number: { type: 'number', description: 'Issue number (PRs are issues too).' },
    body: { type: 'string' },
    confirm: { type: 'boolean', optional: true, description: 'Must be true to execute.' }
  },
  async ({ owner, repo, issue_number, body, confirm }) => {
    ensureConfirm(confirm);

    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/issues/${issue_number}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: jsonBody({ body }),
    });

    return {
      content: [
        { type: 'text', text: JSON.stringify({ comment: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_add_labels',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    issue_number: { type: 'number' },
    labels: { type: 'array', items: { type: 'string' } },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ owner, repo, issue_number, labels, confirm }) => {
    ensureConfirm(confirm);
    if (!Array.isArray(labels) || labels.length === 0) throw new Error('labels must be a non-empty array');

    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/issues/${issue_number}/labels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: jsonBody({ labels }),
    });

    return {
      content: [
        { type: 'text', text: JSON.stringify({ labels: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_remove_label',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    issue_number: { type: 'number' },
    name: { type: 'string', description: 'Label name to remove (URL-encoded automatically).' },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ owner, repo, issue_number, name, confirm }) => {
    ensureConfirm(confirm);

    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/issues/${issue_number}/labels/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    return {
      content: [
        { type: 'text', text: JSON.stringify({ labels: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_close_issue',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    issue_number: { type: 'number' },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ owner, repo, issue_number, confirm }) => {
    ensureConfirm(confirm);

    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/issues/${issue_number}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: jsonBody({ state: 'closed' }),
    });

    return {
      content: [
        { type: 'text', text: JSON.stringify({ issue: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_reopen_issue',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    issue_number: { type: 'number' },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ owner, repo, issue_number, confirm }) => {
    ensureConfirm(confirm);

    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/issues/${issue_number}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: jsonBody({ state: 'open' }),
    });

    return {
      content: [
        { type: 'text', text: JSON.stringify({ issue: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_merge_pr',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    number: { type: 'number', description: 'PR number' },
    merge_method: { type: 'string', optional: true, description: 'merge|squash|rebase' },
    commit_title: { type: 'string', optional: true },
    commit_message: { type: 'string', optional: true },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ owner, repo, number, merge_method, commit_title, commit_message, confirm }) => {
    ensureConfirm(confirm);

    const payload = {
      merge_method: merge_method || undefined,
      commit_title: commit_title || undefined,
      commit_message: commit_message || undefined,
    };

    const { data, remaining, reset } = await ghJson(`/repos/${owner}/${repo}/pulls/${number}/merge`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: jsonBody(payload),
    });

    return {
      content: [
        { type: 'text', text: JSON.stringify({ merge: data, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

server.tool(
  'gh_trigger_workflow_dispatch',
  {
    owner: { type: 'string' },
    repo: { type: 'string' },
    workflow_id: { type: 'string', description: 'Workflow file name or ID (e.g., build.yml)' },
    ref: { type: 'string', description: 'Git ref (branch/tag/SHA)' },
    inputs: { type: 'object', optional: true, description: 'Workflow inputs object' },
    confirm: { type: 'boolean', optional: true }
  },
  async ({ owner, repo, workflow_id, ref, inputs, confirm }) => {
    ensureConfirm(confirm);

    const { res, remaining, reset } = await ghFetch(`/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: jsonBody({ ref, inputs: inputs || undefined }),
    });

    // dispatch returns 204 No Content
    return {
      content: [
        { type: 'text', text: JSON.stringify({ ok: true, status: res.status, rateLimit: { remaining, reset } }, null, 2) },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
