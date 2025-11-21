"use server";

import { revalidatePath } from "next/cache";
import { upsertDailyMetrics, createDb, pokeActionLogs } from "@repo/db";
import { UltrahumanClient } from "@repo/ultrahuman-client";

const DAYS_CAP = 7;

const ultrahumanClient = (() => {
  const token = process.env.ULTRAHUMAN_API_TOKEN;
  if (!token) {
    throw new Error("ULTRAHUMAN_API_TOKEN is not configured");
  }
  return new UltrahumanClient({ apiToken: token });
})();

export async function refreshMetricsAction(formData: FormData | { days?: number }) {
  const rawDays =
    formData instanceof FormData ? Number(formData.get("days")) : formData?.days;
  const days = Number.isFinite(rawDays) && rawDays ? Math.min(DAYS_CAP, rawDays) : 1;
  const targetDates = getRecentDates(days);

  const results = await Promise.all(
    targetDates.map(date => ultrahumanClient.fetchDailyMetrics({ date }))
  );

  const flattened = results.flat();
  const upserted = await upsertDailyMetrics(flattened);

  await logSiteAction("data_site_refresh", {
    upserted,
    dates: targetDates
  });

  revalidatePath("/");
  revalidatePath("/logs");

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

function getRecentDates(days: number) {
  const dates: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(formatDate(date));
  }
  return dates;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
