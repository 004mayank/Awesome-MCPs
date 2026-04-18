#!/usr/bin/env node
import { runTaskFromFile } from './runner.js';
// (tsc will rewrite extension appropriately in dist)
import { loadSkill } from '@baf/skills';
import { planAndRun } from './plan-runner.js';
function usage() {
    console.log(`baf (Browser Agent Framework)\n\nCommands:\n  baf run --task <path-to-task.json|yaml>\n  baf run-skill --skill <path-to-skill.yaml|json> --task <taskName>\n  baf plan-run --goal <text> [--startUrl <url>]\n\nTask format (MVP):\n  {\n    "name": "string",\n    "steps": [\n      {"type":"goto","url":"https://example.com"},\n      {"type":"screenshot","path":"example"}\n    ]\n  }\n`);
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
    if (cmd === 'run-skill') {
        const skillPath = getArg('--skill');
        const taskName = getArg('--task');
        if (!skillPath || !taskName)
            throw new Error('Missing --skill or --task');
        const skill = await loadSkill(skillPath);
        const task = (skill.tasks || []).find((t) => t.name === taskName);
        if (!task)
            throw new Error(`Task not found in skill: ${taskName}`);
        // Write a temp task file? For MVP, just re-use runner by saving JSON to a temp path.
        const tmp = new URL(`file://${process.cwd()}/.baf-tmp-task.json`).pathname;
        await (await import('node:fs/promises')).writeFile(tmp, JSON.stringify(task, null, 2), 'utf-8');
        const runId = process.env.BAF_RUN_ID;
        const artifactsDir = process.env.BAF_ARTIFACTS_DIR;
        await runTaskFromFile(tmp, { runId: runId || undefined, artifactsDir: artifactsDir || undefined });
        return;
    }
    if (cmd === 'plan-run') {
        const goal = getArg('--goal');
        const startUrl = getArg('--startUrl');
        if (!goal)
            throw new Error('Missing --goal');
        await planAndRun({ goal, startUrl: startUrl || undefined });
        return;
    }
    throw new Error(`Unknown command: ${cmd}`);
}
main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
});
