import fs from "node:fs";
import { google } from "googleapis";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

function parseConfirmFlag(input = {}) {
  return Boolean(input.confirm);
}

function getServiceAccountJson() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (keyPath) {
    const raw = fs.readFileSync(keyPath, "utf8");
    return JSON.parse(raw);
  }
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) return JSON.parse(rawJson);
  throw new Error(
    "Missing service account credentials. Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH (preferred) or GOOGLE_SERVICE_ACCOUNT_JSON."
  );
}

function getAuth(scopes) {
  const credentials = getServiceAccountJson();
  return new google.auth.GoogleAuth({ credentials, scopes });
}

async function getDriveClient() {
  const auth = getAuth(["https://www.googleapis.com/auth/drive.readonly"]);
  return google.drive({ version: "v3", auth });
}

async function getSheetsClient() {
  const auth = getAuth(["https://www.googleapis.com/auth/spreadsheets"]);
  return google.sheets({ version: "v4", auth });
}

const server = new McpServer({
  name: "google-sheets-mcp",
  version: "0.1.0",
});

server.tool(
  "gsheets_list_spreadsheets",
  {
    query: {
      type: "string",
      description: "Optional search string to match in file name.",
      optional: true,
    },
    page_size: {
      type: "number",
      description: "Max results per page (default 25, max 100).",
      optional: true,
    },
    page_token: {
      type: "string",
      description: "Drive page token for pagination.",
      optional: true,
    },
  },
  async (input) => {
    const drive = await getDriveClient();
    const pageSize = Number.isFinite(input?.page_size) ? Math.min(Math.max(input.page_size, 1), 100) : 25;

    // Search only spreadsheets.
    // Note: service accounts only see files explicitly shared with them.
    let q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
    if (input?.query) {
      const escaped = String(input.query).replace(/'/g, "\\'");
      q += ` and name contains '${escaped}'`;
    }

    const res = await drive.files.list({
      q,
      pageSize,
      pageToken: input?.page_token,
      fields: "nextPageToken, files(id,name,webViewLink,createdTime,modifiedTime,owners(emailAddress,displayName))",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = res.data.files ?? [];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              next_page_token: res.data.nextPageToken ?? null,
              spreadsheets: files.map((f) => ({
                id: f.id,
                name: f.name,
                url: f.webViewLink ?? null,
                createdTime: f.createdTime ?? null,
                modifiedTime: f.modifiedTime ?? null,
                owners: (f.owners ?? []).map((o) => ({
                  email: o.emailAddress ?? null,
                  name: o.displayName ?? null,
                })),
              })),
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
  "gsheets_list_sheets",
  {
    spreadsheet_id: { type: "string", description: "Spreadsheet ID." },
  },
  async (input) => {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.get({
      spreadsheetId: input.spreadsheet_id,
      fields: "spreadsheetId,properties.title,sheets(properties(sheetId,title,index,gridProperties(rowCount,columnCount)))",
    });

    const data = res.data;
    const tabs = data.sheets ?? [];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              spreadsheet_id: data.spreadsheetId,
              title: data.properties?.title ?? null,
              sheets: tabs.map((s) => ({
                sheetId: s.properties?.sheetId ?? null,
                title: s.properties?.title ?? null,
                index: s.properties?.index ?? null,
                grid: s.properties?.gridProperties
                  ? {
                      rowCount: s.properties.gridProperties.rowCount ?? null,
                      columnCount: s.properties.gridProperties.columnCount ?? null,
                    }
                  : null,
              })),
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
  "gsheets_read_range",
  {
    spreadsheet_id: { type: "string", description: "Spreadsheet ID." },
    range_a1: { type: "string", description: "A1 range (e.g., Sheet1!A1:D20)." },
    value_render_option: {
      type: "string",
      description: "FORMATTED_VALUE|UNFORMATTED_VALUE|FORMULA (default FORMATTED_VALUE).",
      optional: true,
    },
  },
  async (input) => {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: input.spreadsheet_id,
      range: input.range_a1,
      valueRenderOption: input?.value_render_option ?? "FORMATTED_VALUE",
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              range: res.data.range ?? input.range_a1,
              majorDimension: res.data.majorDimension ?? null,
              values: res.data.values ?? [],
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
  "gsheets_append_row",
  {
    spreadsheet_id: { type: "string", description: "Spreadsheet ID." },
    range_a1: {
      type: "string",
      description: "Target A1 range to append into (e.g., Sheet1!A:D).",
    },
    values: {
      type: "array",
      description: "Row values array (e.g., [\"a\",\"b\",\"c\"]).",
      items: { type: "string" },
    },
    value_input_option: {
      type: "string",
      description: "RAW|USER_ENTERED (default USER_ENTERED).",
      optional: true,
    },
    insert_data_option: {
      type: "string",
      description: "INSERT_ROWS|OVERWRITE (default INSERT_ROWS).",
      optional: true,
    },
    confirm: { type: "boolean", description: "REQUIRED for write actions. Set true to append.", optional: true },
  },
  async (input) => {
    if (!parseConfirmFlag(input)) {
      return {
        content: [
          {
            type: "text",
            text: `Write action blocked. Re-run with {"confirm": true} to append the row to Google Sheets.`,
          },
        ],
      };
    }

    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId: input.spreadsheet_id,
      range: input.range_a1,
      valueInputOption: input?.value_input_option ?? "USER_ENTERED",
      insertDataOption: input?.insert_data_option ?? "INSERT_ROWS",
      requestBody: {
        majorDimension: "ROWS",
        values: [input.values],
      },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              updates: res.data.updates ?? null,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

