import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

function mkClient(name) {
  return new Client({ name, version: '0.1.0' }, { capabilities: {} });
}

async function connectLocalServer(relPathFromHere, clientName) {
  const serverPath = new URL(relPathFromHere, import.meta.url).pathname;
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: { ...process.env },
  });
  const client = mkClient(clientName);
  await client.connect(transport);
  return { client, transport };
}

export async function connectSlackMcp() {
  return connectLocalServer('../../../servers/slack-mcp/src/index.js', 'slack-agent');
}

export async function connectNotionMcp() {
  return connectLocalServer('../../../servers/notion-mcp/src/index.js', 'notion-agent');
}

export async function connectJiraMcp() {
  return connectLocalServer('../../../servers/jira-mcp/src/index.js', 'jira-agent');
}

export async function connectLinearMcp() {
  return connectLocalServer('../../../servers/linear-mcp/src/index.js', 'linear-agent');
}

export async function callTool(client, name, args) {
  const res = await client.callTool({ name, arguments: args });
  const text = res?.content?.find((c) => c.type === 'text')?.text;
  try {
    return text ? JSON.parse(text) : res;
  } catch {
    return text ?? res;
  }
}
