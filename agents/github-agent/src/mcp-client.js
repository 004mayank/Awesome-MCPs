import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export async function connectGithubMcp() {
  // Connect by spawning the MCP server process directly.
  // This avoids needing Claude Desktop; the agent is fully runnable itself.
  const transport = new StdioClientTransport({
    command: 'node',
    args: [new URL('../../../servers/github-mcp/src/index.js', import.meta.url).pathname],
    env: {
      ...process.env,
    },
  });

  const client = new Client(
    { name: 'github-agent', version: '0.1.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  return { client, transport };
}

export async function callTool(client, name, args) {
  const res = await client.callTool({ name, arguments: args });
  const text = res?.content?.find(c => c.type === 'text')?.text;
  try {
    return text ? JSON.parse(text) : res;
  } catch {
    return text ?? res;
  }
}
