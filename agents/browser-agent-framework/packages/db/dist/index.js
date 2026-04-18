import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
export function getBafHome() {
    // Default: project-local .baf directory next to this workspace.
    const override = process.env.BAF_HOME;
    if (override)
        return override;
    const root = new URL('../../../', import.meta.url).pathname; // agents/browser-agent-framework/
    return path.join(root, '.baf');
}
export function openDb() {
    const home = getBafHome();
    fs.mkdirSync(home, { recursive: true });
    const dbPath = path.join(home, 'baf.sqlite');
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
    create table if not exists runs (
      id text primary key,
      taskPath text not null,
      startedAt integer not null,
      status text not null
    );

    create table if not exists events (
      id integer primary key autoincrement,
      runId text not null,
      ts integer not null,
      line text not null
    );
  `);
    return db;
}
export function insertRun(db, run) {
    db.prepare('insert into runs (id, taskPath, startedAt, status) values (?, ?, ?, ?)')
        .run(run.id, run.taskPath, run.startedAt, run.status);
}
export function setRunStatus(db, id, status) {
    db.prepare('update runs set status = ? where id = ?').run(status, id);
}
export function listRuns(db) {
    return db.prepare('select id, taskPath, startedAt, status from runs order by startedAt desc limit 200').all();
}
export function insertEvent(db, runId, line) {
    db.prepare('insert into events (runId, ts, line) values (?, ?, ?)').run(runId, Date.now(), line);
}
export function listEvents(db, runId, limit = 200) {
    return db.prepare('select ts, line from events where runId = ? order by id desc limit ?').all(runId, limit);
}
