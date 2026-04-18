import express from 'express';
import { WebSocketServer } from 'ws';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { openDb, insertRun, insertEvent, listRuns, setRunStatus } from '@baf/db';
const PORT = Number(process.env.BAF_SERVER_PORT || 8788);
const db = openDb();
const app = express();
app.use(express.json());
app.get('/api/runs', (_req, res) => {
    res.json({ runs: listRuns(db) });
});
app.post('/api/runs', (req, res) => {
    const taskPath = String(req.body?.taskPath || '');
    if (!taskPath)
        return res.status(400).json({ error: 'taskPath is required' });
    const id = randomUUID();
    insertRun(db, { id, taskPath, startedAt: Date.now(), status: 'running' });
    // Spawn the CLI runner (built JS). We reference workspace path.
    const cliPath = new URL('../../cli/dist/cli.js', import.meta.url).pathname;
    const child = spawn('node', [cliPath, 'run', '--task', path.resolve(taskPath)], {
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    const onLine = (line) => {
        insertEvent(db, id, line);
        broadcast({ type: 'run_event', id, line });
    };
    child.stdout.setEncoding('utf-8');
    child.stdout.on('data', (chunk) => {
        for (const line of String(chunk).split('\n')) {
            if (line.trim())
                onLine(line);
        }
    });
    child.stderr.setEncoding('utf-8');
    child.stderr.on('data', (chunk) => {
        for (const line of String(chunk).split('\n')) {
            if (line.trim())
                onLine(JSON.stringify({ type: 'stderr', line }));
        }
    });
    child.on('exit', (code) => {
        const status = code === 0 ? 'done' : 'error';
        setRunStatus(db, id, status);
        broadcast({ type: 'run_status', id, status });
    });
    res.json({ id });
});
const server = app.listen(PORT, () => {
    console.log(`BAF server listening on http://localhost:${PORT}`);
});
const wss = new WebSocketServer({ server, path: '/ws' });
const sockets = new Set();
function broadcast(msg) {
    const data = JSON.stringify(msg);
    for (const ws of sockets) {
        try {
            ws.send(data);
        }
        catch {
            // ignore
        }
    }
}
wss.on('connection', (ws) => {
    sockets.add(ws);
    ws.on('close', () => sockets.delete(ws));
    ws.send(JSON.stringify({ type: 'hello' }));
});
