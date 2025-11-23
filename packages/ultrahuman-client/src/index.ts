import { z } from "zod";

const DEFAULT_BASE_URL = "https://partner.ultrahuman.com/api/v1/partner/";

// Zod schemas for the nested API response structure
const SleepObjectSchema = z.object({
  sleep_score: z.object({ score: z.number().optional() }).optional(),
  total_sleep: z.object({ minutes: z.number().optional() }).optional(),
  deep_sleep: z.object({ minutes: z.number().optional() }).optional(),
  rem_sleep: z.object({ minutes: z.number().optional() }).optional(),
  light_sleep: z.object({ minutes: z.number().optional() }).optional(),
  sleep_efficiency: z.object({ percentage: z.number().optional() }).optional(),
  temperature_deviation: z.object({ value: z.number().optional() }).optional(),
  restorative_sleep: z.object({ minutes: z.number().optional() }).optional(),
  night_rhr: z.object({ avg: z.number().optional() }).optional(),
  bedtime_start: z.number().optional(), // Unix timestamp
  bedtime_end: z.number().optional(), // Unix timestamp
  time_in_bed: z.object({ minutes: z.number().optional() }).optional(),
  toss_turn: z.object({ value: z.number().optional() }).optional(),
  tosses_and_turns: z.object({ count: z.number().optional() }).optional(),
  movements: z.object({ count: z.number().optional() }).optional(),
  morning_alertness: z.object({ minutes: z.number().optional() }).optional(),
  average_body_temperature: z.object({ celsius: z.number().optional() }).optional()
}).passthrough();

const SimpleValueSchema = z.object({
  value: z.number().nullable()
}).passthrough();

const MetricItemSchema = z.object({
  type: z.string(),
  object: z.unknown()
});

const ApiResponseSchema = z.object({
  data: z.object({
    metrics: z.record(z.string(), z.array(MetricItemSchema)),
    latest_time_zone: z.string().optional()
  }),
  error: z.unknown().nullable(),
  status: z.number()
});

// Normalized daily metric schema (flat structure for easier consumption)
const DailyMetricSchema = z.object({
  date: z.string(),
  email: z.string().optional(),
  user_timezone: z.string().optional(),
  created_at: z.string().optional(),
  // Sleep metrics
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
  temperature_deviation: z.number().nullable().optional(),
  // Additional sleep fields
  bedtime_start: z.number().nullable().optional(), // Unix timestamp
  bedtime_end: z.number().nullable().optional(), // Unix timestamp
  time_in_bed: z.number().nullable().optional(), // Minutes
  tosses_and_turns: z.number().nullable().optional(), // Count
  movements: z.number().nullable().optional(), // Count
  morning_alertness: z.number().nullable().optional(), // Minutes
  average_body_temp_celsius: z.number().nullable().optional(),
  // Recovery metrics
  readiness_score: z.number().nullable().optional(),
  recovery_index: z.number().nullable().optional(),
  movement_index: z.number().nullable().optional(),
  metabolic_score: z.number().nullable().optional(),
  // Activity metrics
  active_minutes: z.number().nullable().optional(),
  vo2_max: z.number().nullable().optional()
}).passthrough();

export type DailyMetric = z.infer<typeof DailyMetricSchema>;

export type DateQuery = {
  date: string;
};

export type EpochQuery = {
  start_epoch: number;
  end_epoch: number;
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
  accessCode: string;
  baseUrl?: string;
  fetchImplementation?: typeof fetch;
}

export class UltrahumanClient {
  private readonly apiToken: string;
  private readonly accessCode: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: UltrahumanClientOptions) {
    if (!options.apiToken) {
      throw new Error("UltrahumanClient requires an apiToken");
    }
    if (!options.accessCode) {
      throw new Error("UltrahumanClient requires an accessCode");
    }

    this.apiToken = options.apiToken.trim();
    this.accessCode = options.accessCode.trim();
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

    url.search = params.toString();

    const response = await this.fetchImpl(url.toString(), {
      method: "GET",
      headers: {
        Authorization: this.apiToken,
        "x-access-code": this.accessCode,
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
  // Parse and validate the API response structure
  const parsed = ApiResponseSchema.parse(payload);
  
  if (parsed.error) {
    throw new UltrahumanError(
      "API returned an error",
      parsed.status,
      parsed.error
    );
  }

  const results: DailyMetric[] = [];
  const { metrics, latest_time_zone } = parsed.data;

  // Iterate through each date in the metrics object
  for (const [date, metricsList] of Object.entries(metrics)) {
    const dailyMetric = parseMetricsArray(date, metricsList, latest_time_zone);
    results.push(dailyMetric);
  }

  return results;
}

function parseMetricsArray(
  date: string,
  metricsList: z.infer<typeof MetricItemSchema>[],
  timezone?: string
): DailyMetric {
  const metric: Partial<DailyMetric> = {
    date,
    user_timezone: timezone
  };

  for (const item of metricsList) {
    const { type, object: obj } = item;

    switch (type) {
      case "sleep": {
        const sleepData = SleepObjectSchema.parse(obj);
        metric.sleep_score = sleepData.sleep_score?.score ?? null;
        metric.total_sleep = sleepData.total_sleep?.minutes ?? null;
        metric.deep_sleep = sleepData.deep_sleep?.minutes ?? null;
        metric.rem_sleep = sleepData.rem_sleep?.minutes ?? null;
        metric.light_sleep = sleepData.light_sleep?.minutes ?? null;
        metric.sleep_efficiency = sleepData.sleep_efficiency?.percentage ?? null;
        metric.temperature_deviation = sleepData.temperature_deviation?.value ?? null;
        metric.restorative_sleep = sleepData.restorative_sleep?.minutes ?? null;
        if (!metric.night_rhr && sleepData.night_rhr?.avg) {
          metric.night_rhr = sleepData.night_rhr.avg;
        }
        // Additional sleep fields
        metric.bedtime_start = sleepData.bedtime_start ?? null;
        metric.bedtime_end = sleepData.bedtime_end ?? null;
        metric.time_in_bed = sleepData.time_in_bed?.minutes ?? null;
        metric.tosses_and_turns = sleepData.tosses_and_turns?.count ?? sleepData.toss_turn?.value ?? null;
        metric.movements = sleepData.movements?.count ?? null;
        metric.morning_alertness = sleepData.morning_alertness?.minutes ?? null;
        metric.average_body_temp_celsius = sleepData.average_body_temperature?.celsius ?? null;
        break;
      }
      case "avg_sleep_hrv": {
        const parsed = SimpleValueSchema.parse(obj);
        metric.avg_sleep_hrv = parsed.value;
        break;
      }
      case "sleep_rhr": {
        const parsed = SimpleValueSchema.parse(obj);
        metric.sleep_rhr = parsed.value;
        break;
      }
      case "recovery_index": {
        const parsed = SimpleValueSchema.parse(obj);
        metric.recovery_index = parsed.value;
        break;
      }
      case "movement_index": {
        const parsed = SimpleValueSchema.parse(obj);
        metric.movement_index = parsed.value;
        break;
      }
      case "night_rhr": {
        if (!metric.night_rhr) {
          const parsed = z.object({ avg: z.number().optional(), value: z.number().optional() }).passthrough().parse(obj);
          metric.night_rhr = parsed.avg ?? parsed.value ?? null;
        }
        break;
      }
      case "active_minutes": {
        const parsed = SimpleValueSchema.parse(obj);
        metric.active_minutes = parsed.value;
        break;
      }
      case "vo2_max": {
        const parsed = SimpleValueSchema.parse(obj);
        metric.vo2_max = parsed.value;
        break;
      }
      // Can add more metric types here as needed (glucose, metabolic_score, etc.)
    }
  }

  // Use DailyMetricSchema to validate and return
  return DailyMetricSchema.parse(metric);
}

export function buildSleepSummary(metric: DailyMetric): SleepSummary {
  return {
    totalSleepMinutes: metric.total_sleep ?? undefined,
    deepSleepMinutes: metric.deep_sleep ?? undefined,
    remSleepMinutes: metric.rem_sleep ?? undefined,
    readinessScore: metric.recovery_index ?? metric.readiness_score ?? undefined,
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

export const DailyMetricsResponseSchema = ApiResponseSchema;
