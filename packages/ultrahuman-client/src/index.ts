import { z } from "zod";

const DEFAULT_BASE_URL = "https://partner.ultrahuman.com/api/v1/partner";

const SleepMetricsSchema = z.object({
  sleep_score: z.number().nullable().optional(),
  total_sleep: z.number().nullable().optional(),
  deep_sleep: z.number().nullable().optional(),
  rem_sleep: z.number().nullable().optional(),
  light_sleep: z.number().nullable().optional(),
  sleep_efficiency: z.number().nullable().optional(),
  avg_sleep_hrv: z.number().nullable().optional(),
  night_rhr: z.number().nullable().optional(),
  sleep_rhr: z.number().nullable().optional(),
  restorative_sleep: z.number().nullable().optional(),
  temperature_deviation: z.number().nullable().optional()
});

const RecoveryMetricsSchema = z.object({
  readiness_score: z.number().nullable().optional(),
  recovery_index: z.number().nullable().optional(),
  movement_index: z.number().nullable().optional(),
  metabolic_score: z.number().nullable().optional()
});

const DailyMetricSchema = z
  .object({
    date: z.string(),
    email: z.string().optional(),
    user_timezone: z.string().optional(),
    created_at: z.string().optional()
  })
  .merge(SleepMetricsSchema.partial())
  .merge(RecoveryMetricsSchema.partial())
  .catchall(z.unknown());

const DailyMetricArraySchema = z.array(DailyMetricSchema);
const DailyMetricsEnvelopeSchema = z.object({
  data: DailyMetricArraySchema
});

export type DailyMetric = z.infer<typeof DailyMetricSchema>;

export type DateQuery = {
  date: string;
  email?: string;
};

export type EpochQuery = {
  start_epoch: number;
  end_epoch: number;
  email?: string;
};

export type DailyMetricsQuery = DateQuery | EpochQuery;

export type SleepSummary = {
  totalSleepMinutes?: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  readinessScore?: number;
  avgSleepHrv?: number;
  sleepScore?: number;
};

export class UltrahumanError extends Error {
  public readonly status?: number;
  public readonly payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = "UltrahumanError";
    this.status = status;
    this.payload = payload;
  }
}

export interface UltrahumanClientOptions {
  apiToken: string;
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
}

export class UltrahumanClient {
  private readonly apiToken: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: UltrahumanClientOptions) {
    if (!options.apiToken) {
      throw new Error("UltrahumanClient requires an apiToken");
    }

    this.apiToken = options.apiToken;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchImpl = options.fetchImplementation ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error("A fetch implementation must be available");
    }
  }

  async fetchDailyMetrics(query: DailyMetricsQuery): Promise<DailyMetric[]> {
    const url = new URL("daily_metrics", this.baseUrl);
    const params = new URLSearchParams();

    if (isDateQuery(query)) {
      params.append("date", query.date);
    } else {
      params.append("start_epoch", query.start_epoch.toString());
      params.append("end_epoch", query.end_epoch.toString());
    }

    if (query.email) {
      params.append("email", query.email);
    }

    url.search = params.toString();

    const response = await this.fetchImpl(url.toString(), {
      method: "GET",
      headers: {
        Authorization: this.apiToken,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const rawBody = await response.text();
      let errorPayload: unknown = rawBody;
      try {
        errorPayload = JSON.parse(rawBody);
      } catch {
        // leave as text payload
      }
      throw new UltrahumanError(
        `Ultrahuman API request failed with status ${response.status}`,
        response.status,
        errorPayload
      );
    }

    const data = await response.json();
    return normalizeDailyMetrics(data);
  }

  async fetchLatestSleep(date: string): Promise<SleepSummary | undefined> {
    const results = await this.fetchDailyMetrics({ date });
    const metric = results[0];
    if (!metric) {
      return undefined;
    }

    return buildSleepSummary(metric);
  }
}

function isDateQuery(query: DailyMetricsQuery): query is DateQuery {
  return (query as DateQuery).date !== undefined;
}

function normalizeDailyMetrics(payload: unknown): DailyMetric[] {
  // Handle new API format: { data: { metrics: { "YYYY-MM-DD": [...] } } }
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    typeof (payload as any).data === "object" &&
    "metrics" in (payload as any).data
  ) {
    const metricsData = (payload as any).data.metrics;
    const results: DailyMetric[] = [];

    // Iterate through each date in the metrics object
    for (const [date, metricsList] of Object.entries(metricsData)) {
      if (!Array.isArray(metricsList)) continue;

      // Parse the metrics array for this date
      const dailyMetric = parseMetricsArray(date, metricsList);
      results.push(dailyMetric);
    }

    return results;
  }

  // Fallback to old format
  if (Array.isArray(payload)) {
    return DailyMetricArraySchema.parse(payload);
  }

  if (hasDataArray(payload)) {
    return DailyMetricsEnvelopeSchema.parse(payload).data;
  }

  return [DailyMetricSchema.parse(payload)];
}

function parseMetricsArray(date: string, metricsList: any[]): DailyMetric {
  const metric: Partial<DailyMetric> = {
    date,
  };

  for (const item of metricsList) {
    const { type, object: obj } = item;

    switch (type) {
      case "sleep":
        metric.sleep_score = obj.sleep_score?.score ?? null;
        metric.total_sleep = obj.total_sleep?.minutes ?? null;
        metric.deep_sleep = obj.deep_sleep?.minutes ?? null;
        metric.rem_sleep = obj.rem_sleep?.minutes ?? null;
        metric.light_sleep = obj.light_sleep?.minutes ?? null;
        metric.sleep_efficiency = obj.sleep_efficiency?.percentage ?? null;
        metric.temperature_deviation = obj.temperature_deviation?.value ?? null;
        metric.restorative_sleep = obj.restorative_sleep?.minutes ?? null;
        metric.night_rhr = obj.night_rhr?.avg ?? null;
        break;
      case "avg_sleep_hrv":
        metric.avg_sleep_hrv = obj.value ?? null;
        break;
      case "sleep_rhr":
        metric.sleep_rhr = obj.value ?? null;
        break;
      case "recovery_index":
        metric.recovery_index = obj.value ?? null;
        break;
      case "movement_index":
        metric.movement_index = obj.value ?? null;
        break;
      case "night_rhr":
        if (!metric.night_rhr) {
          metric.night_rhr = obj.avg ?? obj.value ?? null;
        }
        break;
    }
  }

  // Use DailyMetricSchema to validate and fill in defaults
  return DailyMetricSchema.parse(metric);
}

function hasDataArray(payload: unknown): payload is { data: unknown } {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "data" in payload &&
      Array.isArray((payload as { data: unknown }).data)
  );
}

export function buildSleepSummary(metric: DailyMetric): SleepSummary {
  return {
    totalSleepMinutes: metric.total_sleep ?? undefined,
    deepSleepMinutes: metric.deep_sleep ?? undefined,
    remSleepMinutes: metric.rem_sleep ?? undefined,
    readinessScore: metric.readiness_score ?? undefined,
    avgSleepHrv: metric.avg_sleep_hrv ?? undefined,
    sleepScore: metric.sleep_score ?? undefined
  };
}

export const SleepSummarySchema = z.object({
  totalSleepMinutes: z.number().optional(),
  deepSleepMinutes: z.number().optional(),
  remSleepMinutes: z.number().optional(),
  readinessScore: z.number().optional(),
  avgSleepHrv: z.number().optional(),
  sleepScore: z.number().optional()
});
