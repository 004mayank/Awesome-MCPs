import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
export type RunStatus = 'running' | 'done' | 'error';
export type RunRow = {
    id: string;
    taskPath: string;
    startedAt: number;
    status: RunStatus;
};
export declare function getBafHome(): string;
export declare function openDb(): BetterSqlite3.Database;
export declare function insertRun(db: Database.Database, run: RunRow): void;
export declare function setRunStatus(db: Database.Database, id: string, status: RunStatus): void;
export declare function listRuns(db: Database.Database): RunRow[];
export declare function insertEvent(db: Database.Database, runId: string, line: string): void;
export declare function listEvents(db: Database.Database, runId: string, limit?: number): unknown[];
