import { streamText, convertToModelMessages, type UIMessage, stepCountIs } from "ai";
import { z } from "zod";
import { getDashboardData, getRecentActionLogs } from "@/lib/metrics";
import { listCachedMetrics, findMetricByDate, buildSleepSummaryFromRow } from "@repo/db";
import { UltrahumanClient } from "@repo/ultrahuman-client";

const MODEL = process.env.ANTHROPIC_MODEL ?? "anthropic/claude-4-sonnet";

export async function POST(req: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error("Missing AI_GATEWAY_API_KEY");
    return new Response(
      JSON.stringify({ error: "Missing AI_GATEWAY_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  
  const dashboard = await getDashboardData(7);

  const systemMessage = `You are fixmesleep, an AI assistant that helps analyze Ultrahuman sleep and health metrics.

Current context (last 7 days):
- Average sleep: ${dashboard.summary.avgSleepHours}h
- Average deep sleep: ${dashboard.summary.avgDeepSleepHours}h
- Average readiness: ${dashboard.summary.avgReadiness ?? 'N/A'}
- Average HRV: ${dashboard.summary.avgHrv ?? 'N/A'}

You have access to tools to:
1. Query detailed sleep metrics from the database (query_sleep_metrics)
2. Get specific date details (get_specific_date_details)
3. Fetch latest data from the Ultrahuman ring (fetch_latest_ultrahuman)
4. View recent MCP action logs (view_action_logs)

When answering questions:
- Use multiple tools if needed to provide comprehensive analysis
- Compare data across different dates when relevant
- Identify patterns and trends in the data
- Provide specific, actionable insights based on the metrics

Always provide your final analysis in clear, conversational language after gathering the necessary data.`;

  // Convert UIMessage[] to ModelMessage[]
  const modelMessages = convertToModelMessages(messages);

  try {
    const result = streamText({
      model: MODEL,
      system: systemMessage,
      messages: modelMessages,
      stopWhen: stepCountIs(10), // Allow up to 10 steps for multi-tool conversations
      tools: {
        query_sleep_metrics: {
          description: "Query sleep metrics from the database for a specific date range. Returns detailed sleep data including sleep score, HRV, REM, deep sleep, and readiness scores.",
          inputSchema: z.object({
            days: z.number().min(1).max(90).default(7).describe("Number of days to look back (1-90)"),
            startDate: z.string().optional().describe("Start date in YYYY-MM-DD format (optional)"),
            endDate: z.string().optional().describe("End date in YYYY-MM-DD format (optional)")
          }),
          execute: async ({ days, startDate, endDate }: { days: number; startDate?: string; endDate?: string }) => {
            const filters: any = { limit: days };
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            
            const rows = await listCachedMetrics(filters);
            
            return {
              metrics: rows.map(row => ({
                date: row.metricDate,
                sleepScore: row.sleepScore,
                totalSleepHours: row.totalSleepMinutes ? (row.totalSleepMinutes / 60).toFixed(1) : null,
                deepSleepHours: row.deepSleepMinutes ? (row.deepSleepMinutes / 60).toFixed(1) : null,
                remSleepHours: row.remSleepMinutes ? (row.remSleepMinutes / 60).toFixed(1) : null,
                lightSleepHours: row.lightSleepMinutes ? (row.lightSleepMinutes / 60).toFixed(1) : null,
                readinessScore: row.readinessScore,
                hrv: row.avgSleepHrv,
                rhr: row.nightRhr,
                sleepEfficiency: row.sleepEfficiency
              })),
              count: rows.length
            };
          }
        },
        
        get_specific_date_details: {
          description: "Get detailed metrics for a specific date, including full sleep breakdown and recovery data.",
          inputSchema: z.object({
            date: z.string().describe("Date in YYYY-MM-DD format")
          }),
          execute: async ({ date }: { date: string }) => {
            const row = await findMetricByDate({ date });
            
            if (!row) {
              return { error: `No data found for ${date}` };
            }
            
            const summary = buildSleepSummaryFromRow(row);
            
            return {
              date: row.metricDate,
              summary,
              details: {
                sleep: {
                  score: row.sleepScore,
                  total: row.totalSleepMinutes ? `${(row.totalSleepMinutes / 60).toFixed(1)}h` : null,
                  deep: row.deepSleepMinutes ? `${(row.deepSleepMinutes / 60).toFixed(1)}h` : null,
                  rem: row.remSleepMinutes ? `${(row.remSleepMinutes / 60).toFixed(1)}h` : null,
                  light: row.lightSleepMinutes ? `${(row.lightSleepMinutes / 60).toFixed(1)}h` : null,
                  efficiency: row.sleepEfficiency ? `${row.sleepEfficiency}%` : null,
                  bedtimeStart: row.bedtimeStart,
                  bedtimeEnd: row.bedtimeEnd
                },
                recovery: {
                  readiness: row.readinessScore,
                  hrv: row.avgSleepHrv,
                  rhr: row.nightRhr,
                  recoveryIndex: row.recoveryIndex
                },
                activity: {
                  activeMinutes: row.activeMinutes,
                  movementIndex: row.movementIndex
                }
              }
            };
          }
        },
        
        fetch_latest_ultrahuman: {
          description: "Fetch the latest data directly from the Ultrahuman ring (not from cache). Use this to get the most up-to-date information.",
          inputSchema: z.object({
            date: z.string().describe("Date to fetch in YYYY-MM-DD format (defaults to today)")
          }),
          execute: async ({ date }: { date: string }) => {
            const token = process.env.ULTRAHUMAN_API_TOKEN;
            const accessCode = process.env.ULTRAHUMAN_ACCESS_CODE;
            
            if (!token || !accessCode) {
              return { error: "Ultrahuman credentials not configured" };
            }
            
            try {
              const client = new UltrahumanClient({
                apiToken: token,
                accessCode: accessCode
              });
              
              const metrics = await client.fetchDailyMetrics({ date });
              const metric = metrics[0];
              
              if (!metric) {
                return { error: `No data available for ${date}` };
              }
              
              return {
                date: metric.date,
                fresh: true,
                sleep: {
                  score: metric.sleep_score,
                  totalMinutes: metric.total_sleep,
                  deepMinutes: metric.deep_sleep,
                  remMinutes: metric.rem_sleep,
                  lightMinutes: metric.light_sleep,
                  efficiency: metric.sleep_efficiency
                },
                recovery: {
                  hrv: metric.avg_sleep_hrv,
                  rhr: metric.night_rhr,
                  recoveryIndex: metric.recovery_index
                }
              };
            } catch (error: any) {
              return { error: error.message || "Failed to fetch from Ultrahuman" };
            }
          }
        },
        
        view_action_logs: {
          description: "View recent MCP action logs from Poke (Claude Desktop). Shows what actions the AI has been taking on your behalf.",
          inputSchema: z.object({
            limit: z.number().min(1).max(50).default(10).describe("Number of recent logs to return (1-50)")
          }),
          execute: async ({ limit }: { limit: number }) => {
            const logs = await getRecentActionLogs(limit);
            
            return {
              logs: logs.map(log => ({
                tool: log.toolName,
                endpoint: log.endpoint,
                statusCode: log.statusCode,
                durationMs: log.durationMs,
                timestamp: log.createdAt,
                request: log.requestPayload,
                clientId: log.clientId
              })),
              count: logs.length
            };
          }
        }
      }
    });

    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error("Error in streamText:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        cause: (error as any).cause
      });
    }
    throw error;
  }
}
