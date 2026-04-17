import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function connect(name, relPath) {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [new URL(relPath, import.meta.url).pathname],
    env: { ...process.env },
  });

  const client = new Client({ name, version: '0.1.0' }, { capabilities: {} });
  await client.connect(transport);
  return { client, transport };
}

export const connectSearchMcp = () => connect('workspace-agent-search', '../../../servers/search-mcp/src/index.js');
export const connectGithubMcp = () => connect('workspace-agent-github', '../../../servers/github-mcp/src/index.js');
export const connectDriveMcp = () => connect('workspace-agent-drive', '../../../servers/google-drive-mcp/src/index.js');
export const connectGmailMcp = () => connect('workspace-agent-gmail', '../../../servers/gmail-mcp/src/index.js');
export const connectCalendarMcp = () => connect('workspace-agent-calendar', '../../../servers/google-calendar-mcp/src/index.js');

export async function callTool(client, name, args) {
  const res = await client.callTool({ name, arguments: args });
  const text = res?.content?.find(c => c.type === 'text')?.text;
  try {
    return text ? JSON.parse(text) : res;
  } catch {
    return text ?? res;
  }
}
