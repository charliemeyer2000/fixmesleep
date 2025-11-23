import { NextResponse } from "next/server";
import { UltrahumanClient } from "@repo/ultrahuman-client";

export const runtime = "edge";

export async function GET() {
  console.log("[TEST] Starting Ultrahuman API test...");
  
  try {
    const apiToken = process.env.ULTRAHUMAN_API_TOKEN;
    const accessCode = process.env.ULTRAHUMAN_ACCESS_CODE;
    
    console.log("[TEST] Env vars check:");
    console.log("[TEST] - ULTRAHUMAN_API_TOKEN:", apiToken ? `SET (${apiToken.length} chars)` : "MISSING");
    console.log("[TEST] - ULTRAHUMAN_ACCESS_CODE:", accessCode ? `SET (${accessCode.length} chars)` : "MISSING");
    
    if (!apiToken || !accessCode) {
      return NextResponse.json({
        error: "Missing environment variables",
        details: {
          hasToken: !!apiToken,
          hasAccessCode: !!accessCode
        }
      }, { status: 500 });
    }
    
    console.log("[TEST] Creating client...");
    const client = new UltrahumanClient({ apiToken, accessCode });
    
    console.log("[TEST] Fetching data for 2025-11-22...");
    const metrics = await client.fetchDailyMetrics({ date: "2025-11-22" });
    
    console.log("[TEST] Success! Got", metrics.length, "metrics");
    
    return NextResponse.json({
      success: true,
      metricsCount: metrics.length,
      hasData: metrics.length > 0,
      sample: metrics[0] ? {
        date: metrics[0].date,
        hasSleep: !!metrics[0].total_sleep,
        totalSleep: metrics[0].total_sleep
      } : null
    });
    
  } catch (error) {
    console.error("[TEST] Error:", error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

