import "dotenv/config";

import { UltrahumanClient, buildSleepSummary } from "@repo/ultrahuman-client";
import { getRecentDates } from "@repo/db";

type VerificationResult = {
  date: string;
  totalSleepMinutes?: number;
  readinessScore?: number;
  avgSleepHrv?: number;
  hasSleepPayload: boolean;
};

async function main() {
  const apiToken = process.env.ULTRAHUMAN_API_TOKEN;

  if (!apiToken) {
    throw new Error("Set ULTRAHUMAN_API_TOKEN before running verification.");
  }

  const accessCode = process.env.ULTRAHUMAN_ACCESS_CODE || "";
  const client = new UltrahumanClient({ apiToken, accessCode });
  const dates = getRecentDates(3);
  const results: VerificationResult[] = [];

  for (const date of dates) {
    const metrics = await client.fetchDailyMetrics({ date });

    if (metrics.length === 0) {
      console.warn(`[warn] No metrics returned for ${date}`);
      results.push({ date, hasSleepPayload: false });
      continue;
    }

    const summary = buildSleepSummary(metrics[0]);
    results.push({
      date,
      totalSleepMinutes: summary.totalSleepMinutes,
      readinessScore: summary.readinessScore,
      avgSleepHrv: summary.avgSleepHrv,
      hasSleepPayload: typeof summary.totalSleepMinutes === "number"
    });
  }

  report(results);
}

function report(results: VerificationResult[]) {
  const missingData = results.filter(result => !result.hasSleepPayload);

  console.table(
    results.map(result => ({
      date: result.date,
      "sleep (min)": result.totalSleepMinutes ?? "n/a",
      readiness: result.readinessScore ?? "n/a",
      "avg HRV": result.avgSleepHrv ?? "n/a"
    }))
  );

  if (missingData.length > 0) {
    console.error(
      `[fail] Missing sleep payload for: ${missingData
        .map(result => result.date)
        .join(", ")}`
    );
    process.exitCode = 1;
    return;
  }

  console.log("[pass] Ultrahuman API returned sleep payload for all sampled days.");
}

main().catch(error => {
  console.error("[error] Verification failed:", error);
  process.exitCode = 1;
});

