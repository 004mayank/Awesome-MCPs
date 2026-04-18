# S3 Agent (end-to-end)

Uses the **S3 MCP** tools (S3-compatible: AWS S3 / Cloudflare R2 / MinIO).

## Setup
```bash
cd agents/s3-agent
npm i
```

Env:
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_REGION`
- `S3_ENDPOINT` (optional)
- `S3_BUCKET`

## Commands
List buckets:
```bash
node src/cli.js buckets
```

List objects:
```bash
node src/cli.js list --prefix "logs/"
```

Get object (text):
```bash
node src/cli.js get --key "notes/hello.txt"
```

Put object (confirm):
```bash
node src/cli.js put --key "notes/hello.txt" --text "hi" --confirm
```

Presign GET:
```bash
node src/cli.js presign-get --key "notes/hello.txt" --expires 900
```
