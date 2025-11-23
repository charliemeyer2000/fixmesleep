"use server";

import { revalidatePath } from "next/cache";
import {
  upsertDailyMetrics,
  createDb,
  pokeActionLogs,
  getRecentDates
} from "@repo/db";
import { UltrahumanClient } from "@repo/ultrahuman-client";

const DAYS_CAP = 7;
const DEFAULT_DAYS = 1;
const DASHBOARD_PATHS = ["/", "/logs"];

const ultrahumanClient = (() => {
  const token = process.env.ULTRAHUMAN_API_TOKEN;
  if (!token) {
    throw new Error("ULTRAHUMAN_API_TOKEN is not configured");
  }
  const accessCode = process.env.ULTRAHUMAN_ACCESS_CODE;
  if (!accessCode) throw new Error("ULTRAHUMAN_ACCESS_CODE not configured");
  return new UltrahumanClient({ apiToken: token, accessCode });
})();

export async function refreshMetricsAction(formData: FormData | { days?: number }) {
  const days = resolveRequestedDays(formData);
  const targetDates = getRecentDates(days);
  const upserted = await syncMetricsForDates(targetDates);

  await logSiteAction("data_site_refresh", { upserted, dates: targetDates });
  revalidateDashboardPaths();

  return { upserted, dates: targetDates };
}

async function logSiteAction(toolName: string, payload: Record<string, unknown>) {
  const db = createDb();
  await db.insert(pokeActionLogs).values({
    endpoint: "data-site",
    toolName,
    requestPayload: { initiatedBy: "data-site" },
    responsePayload: payload,
    statusCode: 200,
    durationMs: 0,
    clientId: "data-site"
  });
}

function resolveRequestedDays(source: FormData | { days?: number } | undefined) {
  if (!source) {
    return DEFAULT_DAYS;
  }

  const rawValue = source instanceof FormData ? Number(source.get("days")) : source.days;
  if (!Number.isFinite(rawValue)) {
    return DEFAULT_DAYS;
  }

  const normalized = Math.max(1, Math.floor(Number(rawValue)));
  return Math.min(DAYS_CAP, normalized);
}

async function syncMetricsForDates(dates: string[]) {
  if (!dates.length) {
    return 0;
  }

  const results = await Promise.all(
    dates.map(date => ultrahumanClient.fetchDailyMetrics({ date }))
  );

  const flattened = results.flat();
  return upsertDailyMetrics(flattened);
}

function revalidateDashboardPaths() {
  for (const path of DASHBOARD_PATHS) {
    revalidatePath(path);
  }
}
