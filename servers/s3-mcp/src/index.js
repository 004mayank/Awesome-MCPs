import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function confirmOk(input = {}) {
  return Boolean(input.confirm);
}

function makeClient() {
  const region = process.env.S3_REGION || "us-east-1";
  const accessKeyId = requireEnv("S3_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("S3_SECRET_ACCESS_KEY");
  const endpoint = process.env.S3_ENDPOINT || undefined; // e.g. https://<accountid>.r2.cloudflarestorage.com

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(process.env.S3_FORCE_PATH_STYLE || endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf-8");
}

const server = new McpServer({ name: "s3-mcp", version: "0.1.0" });

server.tool(
  "s3_list_buckets",
  {},
  async () => {
    const s3 = makeClient();
    const out = await s3.send(new ListBucketsCommand({}));
    const buckets = (out.Buckets || []).map((b) => ({ name: b.Name, creationDate: b.CreationDate }));
    return { content: [{ type: "text", text: JSON.stringify({ buckets }, null, 2) }] };
  }
);

server.tool(
  "s3_list_objects",
  {
    bucket: { type: "string", description: "Bucket name (defaults to S3_BUCKET env if omitted).", optional: true },
    prefix: { type: "string", description: "Prefix filter.", optional: true },
    maxKeys: { type: "number", description: "Max keys (default 50).", optional: true },
    continuationToken: { type: "string", description: "Continuation token.", optional: true },
  },
  async (input) => {
    const s3 = makeClient();
    const Bucket = input?.bucket || requireEnv("S3_BUCKET");

    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: input?.prefix || undefined,
        MaxKeys: Number.isFinite(input?.maxKeys) ? input.maxKeys : 50,
        ContinuationToken: input?.continuationToken || undefined,
      })
    );

    const objects = (out.Contents || []).map((o) => ({ key: o.Key, size: o.Size, lastModified: o.LastModified, etag: o.ETag }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              bucket: Bucket,
              prefix: input?.prefix || "",
              objects,
              isTruncated: out.IsTruncated || false,
              nextContinuationToken: out.NextContinuationToken || null,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "s3_get_object_text",
  {
    bucket: { type: "string", description: "Bucket name (defaults to S3_BUCKET env if omitted).", optional: true },
    key: { type: "string", description: "Object key." },
    maxBytes: { type: "number", description: "Max bytes to read (default 200000).", optional: true },
  },
  async (input) => {
    const s3 = makeClient();
    const Bucket = input?.bucket || requireEnv("S3_BUCKET");

    const head = await s3.send(new HeadObjectCommand({ Bucket, Key: input.key }));
    const size = head.ContentLength ?? null;

    const out = await s3.send(new GetObjectCommand({ Bucket, Key: input.key }));
    const body = out.Body;
    const text = body ? await streamToString(body) : "";

    const maxBytes = Number.isFinite(input?.maxBytes) ? input.maxBytes : 200000;
    const truncated = Buffer.byteLength(text, "utf-8") > maxBytes;
    const safeText = truncated ? text.slice(0, maxBytes) : text;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ bucket: Bucket, key: input.key, size, truncated, text: safeText }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "s3_put_object_text",
  {
    bucket: { type: "string", description: "Bucket name (defaults to S3_BUCKET env if omitted).", optional: true },
    key: { type: "string", description: "Object key." },
    text: { type: "string", description: "UTF-8 text to upload." },
    contentType: { type: "string", description: "Content-Type (default text/plain; charset=utf-8).", optional: true },
    confirm: { type: "boolean", description: "REQUIRED for write actions.", optional: true },
  },
  async (input) => {
    if (!confirmOk(input)) {
      return { content: [{ type: "text", text: `Write action blocked. Re-run with {"confirm": true} to upload the object.` }] };
    }

    const s3 = makeClient();
    const Bucket = input?.bucket || requireEnv("S3_BUCKET");

    await s3.send(
      new PutObjectCommand({
        Bucket,
        Key: input.key,
        Body: Buffer.from(input.text, "utf-8"),
        ContentType: input?.contentType || "text/plain; charset=utf-8",
      })
    );

    return { content: [{ type: "text", text: JSON.stringify({ ok: true, bucket: Bucket, key: input.key }, null, 2) }] };
  }
);

server.tool(
  "s3_presign_get",
  {
    bucket: { type: "string", description: "Bucket name (defaults to S3_BUCKET env if omitted).", optional: true },
    key: { type: "string", description: "Object key." },
    expiresInSeconds: { type: "number", description: "Expiry in seconds (default 900).", optional: true },
  },
  async (input) => {
    const s3 = makeClient();
    const Bucket = input?.bucket || requireEnv("S3_BUCKET");
    const expiresIn = Number.isFinite(input?.expiresInSeconds) ? input.expiresInSeconds : 900;

    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: input.key }), { expiresIn });
    return { content: [{ type: "text", text: JSON.stringify({ url, expiresInSeconds: expiresIn }, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
