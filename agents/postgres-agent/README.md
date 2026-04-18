# Postgres Agent (end-to-end)

Uses the **Postgres MCP** tools.

## Setup
```bash
cd agents/postgres-agent
npm i
```

Env:
- `PG_CONNECTION_STRING`

## Commands
List tables:
```bash
node src/cli.js tables
```

Describe table:
```bash
node src/cli.js describe --table public.users
```

SELECT query:
```bash
node src/cli.js query --sql "select * from users" --limit 50
```

Write query (confirm):
```bash
node src/cli.js execute --sql "update users set active=true where id=1" --confirm
```
