import { spawn } from 'node:child_process';
import path from 'node:path';
import { loadTask } from '@baf/skills';
function collectEvents(output) {
    const lines = output.split('\n').map((l) => l.trim()).filter(Boolean);
    const events = [];
    for (const line of lines) {
        try {
            events.push(JSON.parse(line));
        }
        catch {
            // ignore
        }
    }
    return events;
}
async function runTask(taskPath) {
    const cliPath = new URL('../../cli/dist/cli.js', import.meta.url).pathname;
    const p = path.resolve(taskPath);
    const child = spawn('node', [cliPath, 'run', '--task', p], {
        env: { ...process.env, BAF_RUN_ID: `eval-${Date.now()}` },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');
    child.stdout.on('data', (c) => (out += c));
    child.stderr.on('data', (c) => (err += c));
    const code = await new Promise((resolve) => child.on('exit', (c) => resolve(c ?? 1)));
    return { code, out, err, events: collectEvents(out) };
}
const evals = [
    {
        name: 'example.com screenshot',
        taskPath: new URL('../../../evals/tasks/example-com.json', import.meta.url).pathname,
        expect: (events) => {
            const hasDone = events.some((e) => e.type === 'task_done');
            const hasShot = events.some((e) => e.type === 'step_result' && e.result?.path);
            return { ok: hasDone && hasShot, reason: `hasDone=${hasDone} hasShot=${hasShot}` };
        },
    },
];
async function main() {
    let pass = 0;
    let fail = 0;
    for (const t of evals) {
        // Validate task format
        await loadTask(t.taskPath);
        const res = await runTask(t.taskPath);
        const verdict = t.expect(res.events);
        if (res.code === 0 && verdict.ok) {
            pass++;
            console.log(JSON.stringify({ type: 'eval_pass', name: t.name }));
        }
        else {
            fail++;
            console.log(JSON.stringify({ type: 'eval_fail', name: t.name, code: res.code, verdict, stderr: res.err.slice(0, 2000) }));
        }
    }
    console.log(JSON.stringify({ type: 'eval_summary', pass, fail }));
    process.exit(fail ? 1 : 0);
}
main().catch((e) => {
    console.error(e?.stack || String(e));
    process.exit(1);
});
