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

Run SOQL query:
```bash
node src/cli.js query --soql "SELECT Id, Name FROM Account LIMIT 5"
```

Create record (confirm):
```bash
node src/cli.js create --sobject Account --fields '{"Name":"Acme"}' --confirm
```
