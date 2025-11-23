import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import type { DailyMetric } from "@repo/ultrahuman-client";
import { buildSleepSummary, type SleepSummary } from "@repo/ultrahuman-client";

import { createDb, type CreateDbOptions, type DbClient } from "../client";
import { dailyMetrics, type DailyMetricRow } from "../schema";

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
      // Core sleep metrics
      totalSleepMinutes: metric.total_sleep ?? null,
      deepSleepMinutes: metric.deep_sleep ?? null,
      remSleepMinutes: metric.rem_sleep ?? null,
      lightSleepMinutes: metric.light_sleep ?? null,
      sleepScore: metric.sleep_score ?? null,
      sleepEfficiency: metric.sleep_efficiency ?? null,
      restorativeSleepMinutes: metric.restorative_sleep ?? null,
      temperatureDeviation: metric.temperature_deviation ?? null,
      // Sleep details
      bedtimeStart: metric.bedtime_start ?? null,
      bedtimeEnd: metric.bedtime_end ?? null,
      timeInBedMinutes: metric.time_in_bed ?? null,
      tossesAndTurns: metric.tosses_and_turns ?? null,
      movements: metric.movements ?? null,
      morningAlertnessMinutes: metric.morning_alertness ?? null,
      averageBodyTempCelsius: metric.average_body_temp_celsius ?? null,
      // Heart metrics
      avgSleepHrv: metric.avg_sleep_hrv ?? null,
      nightRhr: metric.night_rhr ?? null,
      sleepRhr: metric.sleep_rhr ?? null,
      // Recovery & activity
      readinessScore: metric.readiness_score ?? null,
      recoveryIndex: metric.recovery_index ?? null,
      movementIndex: metric.movement_index ?? null,
      activeMinutes: metric.active_minutes ?? null,
      vo2Max: metric.vo2_max ?? null,
      metabolicScore: metric.metabolic_score ?? null,
      // Full payload
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
        // Core sleep metrics
        totalSleepMinutes: sql`excluded.total_sleep_minutes`,
        deepSleepMinutes: sql`excluded.deep_sleep_minutes`,
        remSleepMinutes: sql`excluded.rem_sleep_minutes`,
        lightSleepMinutes: sql`excluded.light_sleep_minutes`,
        sleepScore: sql`excluded.sleep_score`,
        sleepEfficiency: sql`excluded.sleep_efficiency`,
        restorativeSleepMinutes: sql`excluded.restorative_sleep_minutes`,
        temperatureDeviation: sql`excluded.temperature_deviation`,
        // Sleep details
        bedtimeStart: sql`excluded.bedtime_start`,
        bedtimeEnd: sql`excluded.bedtime_end`,
        timeInBedMinutes: sql`excluded.time_in_bed_minutes`,
        tossesAndTurns: sql`excluded.tosses_and_turns`,
        movements: sql`excluded.movements`,
        morningAlertnessMinutes: sql`excluded.morning_alertness_minutes`,
        averageBodyTempCelsius: sql`excluded.average_body_temp_celsius`,
        // Heart metrics
        avgSleepHrv: sql`excluded.avg_sleep_hrv`,
        nightRhr: sql`excluded.night_rhr`,
        sleepRhr: sql`excluded.sleep_rhr`,
        // Recovery & activity
        readinessScore: sql`excluded.readiness_score`,
        recoveryIndex: sql`excluded.recovery_index`,
        movementIndex: sql`excluded.movement_index`,
        activeMinutes: sql`excluded.active_minutes`,
        vo2Max: sql`excluded.vo2_max`,
        metabolicScore: sql`excluded.metabolic_score`,
        // Full payload
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
    // Core sleep metrics
    total_sleep: row.totalSleepMinutes ?? undefined,
    deep_sleep: row.deepSleepMinutes ?? undefined,
    rem_sleep: row.remSleepMinutes ?? undefined,
    light_sleep: row.lightSleepMinutes ?? undefined,
    sleep_score: row.sleepScore ?? undefined,
    sleep_efficiency: row.sleepEfficiency ?? undefined,
    restorative_sleep: row.restorativeSleepMinutes ?? undefined,
    temperature_deviation: row.temperatureDeviation ?? undefined,
    // Sleep details
    bedtime_start: row.bedtimeStart ?? undefined,
    bedtime_end: row.bedtimeEnd ?? undefined,
    time_in_bed: row.timeInBedMinutes ?? undefined,
    tosses_and_turns: row.tossesAndTurns ?? undefined,
    movements: row.movements ?? undefined,
    morning_alertness: row.morningAlertnessMinutes ?? undefined,
    average_body_temp_celsius: row.averageBodyTempCelsius ?? undefined,
    // Heart metrics
    avg_sleep_hrv: row.avgSleepHrv ?? undefined,
    night_rhr: row.nightRhr ?? undefined,
    sleep_rhr: row.sleepRhr ?? undefined,
    // Recovery & activity
    readiness_score: row.readinessScore ?? undefined,
    recovery_index: row.recoveryIndex ?? undefined,
    movement_index: row.movementIndex ?? undefined,
    active_minutes: row.activeMinutes ?? undefined,
    vo2_max: row.vo2Max ?? undefined,
    metabolic_score: row.metabolicScore ?? undefined
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

