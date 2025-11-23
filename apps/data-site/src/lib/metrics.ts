import { listCachedMetrics, buildSleepSummaryFromRow, createDb, pokeActionLogs } from "@repo/db";
import type { SleepSummary } from "@repo/ultrahuman-client";
import { desc } from "drizzle-orm";

export type SleepSeriesPoint = {
  date: string;
  totalSleepHours: number;
  deepSleepHours: number;
  readinessScore: number | null;
  hrv: number | null;
};

export type DashboardData = {
  series: SleepSeriesPoint[];
  summary: {
    avgSleepHours: number;
    avgDeepSleepHours: number;
    avgReadiness: number | null;
    avgHrv: number | null;
  };
  latestSummary?: SleepSummary;
};

const DEFAULT_LOOKBACK_DAYS = 14;

export async function getDashboardData(days = DEFAULT_LOOKBACK_DAYS): Promise<DashboardData> {
  const rows = await listCachedMetrics({ limit: days });
  const ordered = [...rows].sort((a, b) => a.metricDate.localeCompare(b.metricDate));

  const series: SleepSeriesPoint[] = ordered.map(row => ({
    date: row.metricDate,
    totalSleepHours: minutesToHours(row.totalSleepMinutes),
    deepSleepHours: minutesToHours(row.deepSleepMinutes),
    readinessScore: row.readinessScore ?? null,
    hrv: row.avgSleepHrv ?? null
  }));

  const summary = computeSummary(series);
  const latest = ordered[ordered.length - 1];

  return {
    series: series.slice(-days),
    summary,
    latestSummary: latest ? buildSleepSummaryFromRow(latest) : undefined
  };
}

export async function getRecentActionLogs(limit = 40) {
  const db = createDb();
  return db
    .select()
    .from(pokeActionLogs)
    .orderBy(desc(pokeActionLogs.createdAt))
    .limit(limit);
}

export type ActionLogEntry = Awaited<ReturnType<typeof getRecentActionLogs>>[number];

function computeSummary(series: SleepSeriesPoint[]) {
  if (!series.length) {
    return {
      avgSleepHours: 0,
      avgDeepSleepHours: 0,
      avgReadiness: null,
      avgHrv: null
    };
  }

  const totals = series.reduce(
    (acc, point) => {
      // Only count days with actual sleep data (non-zero hours)
      if (point.totalSleepHours > 0) {
        acc.sleep.sum += point.totalSleepHours;
        acc.sleep.count += 1;
      }
      if (point.deepSleepHours > 0) {
        acc.deep.sum += point.deepSleepHours;
        acc.deep.count += 1;
      }
      if (point.readinessScore != null) {
        acc.readiness.sum += point.readinessScore;
        acc.readiness.count += 1;
      }
      if (point.hrv != null) {
        acc.hrv.sum += point.hrv;
        acc.hrv.count += 1;
      }
      return acc;
    },
    {
      sleep: { sum: 0, count: 0 },
      deep: { sum: 0, count: 0 },
      readiness: { sum: 0, count: 0 },
      hrv: { sum: 0, count: 0 }
    }
  );

  return {
    avgSleepHours:
      totals.sleep.count > 0 ? round(totals.sleep.sum / totals.sleep.count) : 0,
    avgDeepSleepHours:
      totals.deep.count > 0 ? round(totals.deep.sum / totals.deep.count) : 0,
    avgReadiness:
      totals.readiness.count > 0
        ? round(totals.readiness.sum / totals.readiness.count)
        : null,
    avgHrv:
      totals.hrv.count > 0 ? round(totals.hrv.sum / totals.hrv.count) : null
  };
}

function minutesToHours(value: number | null) {
  if (!value) return 0;
  return round(value / 60);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
