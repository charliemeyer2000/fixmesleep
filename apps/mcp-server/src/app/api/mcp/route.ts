import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  UltrahumanClient,
  UltrahumanError,
  type DailyMetricsQuery
} from "@repo/ultrahuman-client";
import {
  createDb,
  pokeActionLogs,
  upsertDailyMetrics,
  listCachedMetrics,
  findMetricByDate,
  buildSleepSummaryFromRow
} from "@repo/db";

const isoDateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, "Expected YYYY-MM-DD");

const fetchMetricsShape = {
  date: isoDateSchema.optional(),
  start_epoch: z.number().int().optional(),
  end_epoch: z.number().int().optional()
} as const;

const fetchMetricsInput = z
  .object(fetchMetricsShape)
  .refine(
    ({ date, start_epoch, end_epoch }) =>
      Boolean(date) !== Boolean(start_epoch && end_epoch),
    { message: "Provide either date or start/end epoch." }
  )
  .refine(
    ({ start_epoch, end_epoch }) => {
      if (!start_epoch || !end_epoch) return true;
      return end_epoch > start_epoch;
    },
    { message: "end_epoch must be greater than start_epoch" }
  )
  .refine(
    ({ start_epoch, end_epoch }) => {
      if (!start_epoch || !end_epoch) return true;
      return end_epoch - start_epoch <= 60 * 60 * 24 * 7;
    },
    { message: "Epoch range must be 7 days or less" }
  );

type FetchMetricsInput = z.infer<typeof fetchMetricsInput>;

const listCachedMetricsShape = {
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
  limit: z.number().int().min(1).max(90).default(14)
} as const;

const listCachedMetricsInput = z
  .object(listCachedMetricsShape)
  .refine(
    ({ startDate, endDate }) => {
      if (!startDate || !endDate) return true;
      return startDate <= endDate;
    },
    { message: "startDate must be <= endDate" }
  );

const metricSummaryShape = {
  date: isoDateSchema
} as const;

const metricSummaryInput = z.object(metricSummaryShape);

export const mcpHandler = createMcpHandler(
  server => {

    server.tool(
      "fetch_daily_metrics",
      "Fetch Ultrahuman daily metrics directly from the Partner API",
      fetchMetricsShape,
      async (rawInput: unknown) => {
        const input = fetchMetricsInput.parse(rawInput);
        const client = getUltrahumanClient();
        const requestPayload = toLogPayload(input);
        return runToolWithLogging({
          endpoint: "/api/mcp/fetch_daily_metrics",
          toolName: "fetch_daily_metrics",
          requestPayload,
          action: async () => {
            const metrics = await client.fetchDailyMetrics(toMetricsQuery(input));
            return {
              responsePayload: { count: metrics.length },
              result: {
                content: [
                  {
                    type: "text",
                    text: `Fetched ${metrics.length} day(s) of data from Ultrahuman.`
                  },
                  {
                    type: "text",
                    text: formatJson({ metrics })
                  }
                ]
              }
            };
          }
        });
      }
    );

    server.tool(
      "refresh_and_store_metrics",
      "Fetch metrics from Ultrahuman and upsert them into Postgres",
      fetchMetricsShape,
      async (rawInput: unknown) => {
        const input = fetchMetricsInput.parse(rawInput);
        const client = getUltrahumanClient();
        const requestPayload = toLogPayload(input);
        return runToolWithLogging({
          endpoint: "/api/mcp/refresh_and_store_metrics",
          toolName: "refresh_and_store_metrics",
          requestPayload,
          action: async () => {
            const metrics = await client.fetchDailyMetrics(toMetricsQuery(input));
            const upserted = await upsertDailyMetrics(metrics);
            return {
              responsePayload: { count: upserted },
              result: {
                content: [
                  {
                    type: "text",
                    text: `Stored ${upserted} day(s) of metrics in Postgres.`
                  }
                ]
              }
            };
          }
        });
      }
    );

    server.tool(
      "list_cached_metrics",
      "List cached daily metrics from Postgres with optional filters",
      listCachedMetricsShape,
      async (rawInput: unknown) => {
        const input = listCachedMetricsInput.parse(rawInput);
        const requestPayload = toLogPayload(input);
        return runToolWithLogging({
          endpoint: "/api/mcp/list_cached_metrics",
          toolName: "list_cached_metrics",
          requestPayload,
          action: async () => {
            const rows = await listCachedMetrics(input);
            const summaries = rows.map(row => ({
              date: row.metricDate,
              summary: buildSleepSummaryFromRow(row)
            }));
            return {
              responsePayload: { count: rows.length },
              result: {
                content: [
                  {
                    type: "text",
                    text: `Found ${rows.length} cached day(s).`
                  },
                  {
                    type: "text",
                    text: formatJson({ metrics: rows, summaries })
                  }
                ]
              }
            };
          }
        });
      }
    );

    server.tool(
      "get_metric_summary",
      "Get the cached sleep summary for a specific date",
      metricSummaryShape,
      async (rawInput: unknown) => {
        const input = metricSummaryInput.parse(rawInput);
        const requestPayload = toLogPayload(input);
        return runToolWithLogging({
          endpoint: "/api/mcp/get_metric_summary",
          toolName: "get_metric_summary",
          requestPayload,
          action: async () => {
            const record = await findMetricByDate(input);
            if (!record) {
              return {
                responsePayload: { found: false },
                result: {
                  content: [
                    {
                      type: "text",
                      text: `No cached metrics found for ${input.date}.`
                    }
                  ]
                }
              };
            }

            return {
              responsePayload: { found: true },
              result: {
                content: [
                  {
                    type: "text",
                    text: `Found cached metrics for ${input.date}.`
                  },
                  {
                    type: "text",
                    text: formatJson({
                      summary: buildSleepSummaryFromRow(record),
                      metric: record
                    })
                  }
                ]
              }
            };
          }
        });
      }
    );
  },
  undefined,
  { 
    basePath: "/api",
    redisUrl: process.env.KV_URL || process.env.REDIS_URL
  }
);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = mcpHandler;
export const POST = mcpHandler;
export const DELETE = mcpHandler;

let cachedClient: UltrahumanClient | null = null;

function getUltrahumanClient() {
  if (!cachedClient) {
    const apiToken = process.env.ULTRAHUMAN_API_TOKEN;
    const accessCode = process.env.ULTRAHUMAN_ACCESS_CODE;
    
    console.log("[MCP] Creating Ultrahuman client...");
    console.log("[MCP] Token defined:", !!apiToken);
    console.log("[MCP] Token length:", apiToken?.length || 0);
    console.log("[MCP] Access code defined:", !!accessCode);
    console.log("[MCP] Access code length:", accessCode?.length || 0);
    
    if (!apiToken) {
      throw new Error("ULTRAHUMAN_API_TOKEN is not configured");
    }
    if (!accessCode) {
      throw new Error("ULTRAHUMAN_ACCESS_CODE is not configured");
    }

    cachedClient = new UltrahumanClient({ apiToken, accessCode });
    console.log("[MCP] Client created successfully");
  }

  return cachedClient;
}

type LoggedToolActionResult<T> = {
  result: T;
  responsePayload: Record<string, unknown>;
  statusCode?: number;
};

async function runToolWithLogging<T>(config: {
  endpoint: string;
  toolName: string;
  requestPayload: Record<string, unknown>;
  action: () => Promise<LoggedToolActionResult<T>>;
}) {
  const startedAt = Date.now();
  try {
    const { result, responsePayload, statusCode = 200 } = await config.action();
    await logPokeAction({
      endpoint: config.endpoint,
      toolName: config.toolName,
      requestPayload: config.requestPayload,
      responsePayload,
      statusCode,
      startedAt
    });
    return result;
  } catch (error) {
    await logPokeAction({
      endpoint: config.endpoint,
      toolName: config.toolName,
      requestPayload: config.requestPayload,
      responsePayload: serializeError(error),
      statusCode: statusFromError(error),
      startedAt
    });
    throw error;
  }
}

async function logPokeAction(params: {
  endpoint: string;
  toolName: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  statusCode: number;
  startedAt: number;
}) {
  const durationMs = Math.max(1, Date.now() - params.startedAt);
  try {
    const db = createDb();
    await db.insert(pokeActionLogs).values({
      endpoint: params.endpoint,
      toolName: params.toolName,
      requestPayload: params.requestPayload,
      responsePayload: params.responsePayload,
      statusCode: params.statusCode,
      durationMs,
      clientId: "poke"
    });
  } catch (error) {
    console.error("Failed to log Poke action", error);
  }
}

function toLogPayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return { value };
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
  }
  return { error: String(error) };
}

function statusFromError(error: unknown) {
  if (error instanceof UltrahumanError && error.status) {
    return error.status;
  }
  return 500;
}

function toMetricsQuery(input: FetchMetricsInput): DailyMetricsQuery {
  if (input.date) {
    return {
      date: input.date
    };
  }

  return {
    start_epoch: input.start_epoch!,
    end_epoch: input.end_epoch!
  };
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
