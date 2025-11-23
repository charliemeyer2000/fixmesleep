import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import type { DailyMetric } from "@repo/ultrahuman-client";
import { buildSleepSummary, type SleepSummary } from "@repo/ultrahuman-client";

import { createDb, type CreateDbOptions, type DbClient } from "../client.js";
import { dailyMetrics, type DailyMetricRow } from "../schema.js";

export interface MetricServiceOptions extends CreateDbOptions {
  db?: DbClient;
}

export interface ListMetricsFilters {
  email?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface MetricLookupFilters {
  date: string;
  email?: string;
}

const DEFAULT_LIMIT = 14;

export async function upsertDailyMetrics(
  metrics: DailyMetric[],
  options?: MetricServiceOptions
): Promise<number> {
  if (!metrics.length) return 0;

  const db = resolveDb(options);
  const now = new Date();

  const values = metrics.map(metric => {
    const rawDate = metric.date ?? "";
    if (!rawDate) {
      throw new Error("Ultrahuman response missing date field");
    }

    const metricDate = toDateOnly(rawDate);

    return {
      userEmail: metric.email ?? "self",
      metricDate,
      totalSleepMinutes: metric.total_sleep ?? null,
      deepSleepMinutes: metric.deep_sleep ?? null,
      remSleepMinutes: metric.rem_sleep ?? null,
      readinessScore: metric.readiness_score ?? null,
      avgSleepHrv: metric.avg_sleep_hrv ?? null,
      sleepScore: metric.sleep_score ?? null,
      payload: metric as Record<string, unknown>,
      updatedAt: now
    };
  });

  await db
    .insert(dailyMetrics)
    .values(values)
    .onConflictDoUpdate({
      target: [dailyMetrics.userEmail, dailyMetrics.metricDate],
      set: {
        totalSleepMinutes: sql`excluded.total_sleep_minutes`,
        deepSleepMinutes: sql`excluded.deep_sleep_minutes`,
        remSleepMinutes: sql`excluded.rem_sleep_minutes`,
        readinessScore: sql`excluded.readiness_score`,
        avgSleepHrv: sql`excluded.avg_sleep_hrv`,
        sleepScore: sql`excluded.sleep_score`,
        payload: sql`excluded.payload`,
        updatedAt: sql`excluded.updated_at`
      }
    });

  return values.length;
}

export async function listCachedMetrics(
  filters: ListMetricsFilters,
  options?: MetricServiceOptions
): Promise<DailyMetricRow[]> {
  const db = resolveDb(options);
  const limit = filters.limit ?? DEFAULT_LIMIT;
  const conditions: SQL[] = [];

  if (filters.email) {
    conditions.push(eq(dailyMetrics.userEmail, filters.email));
  }

  if (filters.startDate) {
    conditions.push(gte(dailyMetrics.metricDate, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(dailyMetrics.metricDate, filters.endDate));
  }

  const where = combineConditions(conditions);
  const baseQuery = db.select().from(dailyMetrics);
  const constrained = where ? baseQuery.where(where) : baseQuery;

  return constrained.orderBy(desc(dailyMetrics.metricDate)).limit(limit);
}

export async function findMetricByDate(
  filters: MetricLookupFilters,
  options?: MetricServiceOptions
): Promise<DailyMetricRow | undefined> {
  const db = resolveDb(options);
  const conditions: SQL[] = [eq(dailyMetrics.metricDate, filters.date)];

  if (filters.email) {
    conditions.push(eq(dailyMetrics.userEmail, filters.email));
  }

  const where = combineConditions(conditions);
  if (!where) {
    return undefined;
  }

  const query = db.select().from(dailyMetrics).where(where);
  const [record] = await query.limit(1);
  return record;
}

export function buildSleepSummaryFromRow(row: DailyMetricRow): SleepSummary {
  const metric = rowToMetric(row);
  return buildSleepSummary(metric);
}

export function rowToMetric(row: DailyMetricRow): DailyMetric {
  const payload = row.payload as Record<string, unknown>;
  const rawDate = (row.metricDate ?? payload?.["date"]) as string | undefined;
  return {
    ...payload,
    date: toDateOnly(rawDate),
    email: row.userEmail ?? undefined,
    total_sleep: row.totalSleepMinutes ?? undefined,
    deep_sleep: row.deepSleepMinutes ?? undefined,
    rem_sleep: row.remSleepMinutes ?? undefined,
    readiness_score: row.readinessScore ?? undefined,
    avg_sleep_hrv: row.avgSleepHrv ?? undefined,
    sleep_score: row.sleepScore ?? undefined
  } as DailyMetric;
}

function resolveDb(options?: MetricServiceOptions) {
  return options?.db ?? createDb(options);
}

function combineConditions(conditions: SQL[]): SQL | undefined {
  if (!conditions.length) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}

function toDateOnly(value: string | Date | null | undefined): string {
  if (!value) {
    throw new Error("metricDate is missing");
  }

  const isoString = typeof value === "string" ? value : value.toISOString();
  const [datePart] = isoString.split("T");
  return datePart!;
}

