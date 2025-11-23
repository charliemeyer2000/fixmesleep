import "dotenv/config";
import { UltrahumanClient } from "@repo/ultrahuman-client";

async function testMCPFlow() {
  console.log("🔍 Simulating MCP server flow...\n");
  
  const apiToken = process.env.ULTRAHUMAN_API_TOKEN;
  const accessCode = process.env.ULTRAHUMAN_ACCESS_CODE;
  
  if (!apiToken) {
    console.error("❌ ULTRAHUMAN_API_TOKEN not set");
    process.exit(1);
  }
  
  console.log("1️⃣ Token length:", apiToken.length);
  console.log("2️⃣ Token ends with:", apiToken.substring(apiToken.length - 10));
  console.log("3️⃣ Has newline?", apiToken.includes('\n'));
  console.log("4️⃣ Access code:", accessCode || "NOT SET");
  
  if (!accessCode) {
    console.log("\n⚠️  ULTRAHUMAN_ACCESS_CODE not set - making it optional");
  }
  
  try {
    console.log("\n5️⃣ Creating client...");
    const client = new UltrahumanClient({ 
      apiToken, 
      accessCode: accessCode || ""  // Make it optional
    });
    
    console.log("✅ Client created");
    
    console.log("\n6️⃣ Fetching metrics for 2025-11-22...");
    const metrics = await client.fetchDailyMetrics({ date: "2025-11-22" });
    
    console.log(`✅ Got ${metrics.length} metrics`);
    if (metrics.length > 0) {
      console.log("   First metric date:", metrics[0].date);
      console.log("   Has sleep data:", !!metrics[0].total_sleep);
    }
    
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

testMCPFlow();

