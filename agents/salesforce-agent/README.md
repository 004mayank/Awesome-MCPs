# Salesforce Agent (end-to-end)

Uses the **Salesforce MCP** tools.

## Setup
```bash
cd agents/salesforce-agent
npm i
```

Env:
- `SALESFORCE_INSTANCE_URL`
- `SALESFORCE_ACCESS_TOKEN`
- `SALESFORCE_API_VERSION` (optional)

## Commands
List limits:
```bash
node src/cli.js limits
```

List sobjects:
```bash
node src/cli.js sobjects
```

Describe an sobject:
```bash
node src/cli.js describe --sobject Account
```

Run SOQL query:
```bash
node src/cli.js query --soql "SELECT Id, Name FROM Account LIMIT 5"
```

Run SOSL search:
```bash
node src/cli.js search --sosl "FIND {acme} IN ALL FIELDS RETURNING Account(Id,Name)"
```

Get record:
```bash
node src/cli.js get --sobject Account --id 001... --fields "Id,Name"
```

Create record (confirm):
```bash
node src/cli.js create --sobject Account --fields '{"Name":"Acme"}' --confirm
```

Update record (confirm):
```bash
node src/cli.js update --sobject Account --id 001... --fields '{"Name":"Acme 2"}' --confirm
```
