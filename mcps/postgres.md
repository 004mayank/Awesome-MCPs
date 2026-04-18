# Postgres MCP

Auth: `PG_CONNECTION_STRING`.

Read-only by default:
- `pg_query` only allows `SELECT/WITH`

Write actions are **write-gated** (must pass `confirm:true`) via `pg_execute`.

## Env
- `PG_CONNECTION_STRING`
- `PG_SSLMODE` (optional: `disable`|`require`)
- `PG_STATEMENT_TIMEOUT_MS` (optional, default 10000)

## Tools
- `pg_list_tables`
- `pg_describe_table`
- `pg_query` (SELECT/WITH only)
- `pg_execute` (**confirm:true**)

## Run
```bash
cd servers/postgres-mcp
npm i
export PG_CONNECTION_STRING="postgres://user:pass@host:5432/db"
node src/index.js
```
