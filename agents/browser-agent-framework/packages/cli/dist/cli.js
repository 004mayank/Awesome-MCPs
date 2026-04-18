#!/usr/bin/env node
import { runTaskFromFile } from './runner.js';
// (tsc will rewrite extension appropriately in dist)
function usage() {
    console.log(`baf (Browser Agent Framework)\n\nCommands:\n  baf run --task <path-to-task.json>\n\nTask format (MVP):\n  {\n    "name": "string",\n    "steps": [\n      {"type":"goto","url":"https://example.com"},\n      {"type":"screenshot","path":"./out.png"}\n    ]\n  }\n`);
}
function getArg(flag) {
    const i = process.argv.indexOf(flag);
    if (i === -1)
        return null;
    return process.argv[i + 1] ?? null;
}
const cmd = process.argv[2];
if (!cmd || cmd === '--help' || cmd === '-h') {
    usage();
    process.exit(0);
}
async function main() {
    if (cmd === 'run') {
        const taskPath = getArg('--task');
        if (!taskPath)
            throw new Error('Missing --task');
        const runId = process.env.BAF_RUN_ID;
        const artifactsDir = process.env.BAF_ARTIFACTS_DIR;
        await runTaskFromFile(taskPath, { runId: runId || undefined, artifactsDir: artifactsDir || undefined });
        return;
    }
    throw new Error(`Unknown command: ${cmd}`);
}
main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
});
