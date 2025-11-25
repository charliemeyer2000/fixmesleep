export const dynamic = "force-dynamic";

import { SummaryCards } from "@/components/dashboard/summary-cards";
import { LatestMetricCard } from "@/components/dashboard/latest-metric-card";
import { SleepTrendChart } from "@/components/dashboard/sleep-trend-chart";
import { MetricsTable } from "@/components/dashboard/metrics-table";
import { RecentLogsCard } from "@/components/dashboard/recent-logs-card";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { getDashboardData, getRecentActionLogs } from "@/lib/metrics";

export default async function DashboardPage() {
  const [dashboardData, logs] = await Promise.all([
    getDashboardData(),
    getRecentActionLogs(5)
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col-reverse gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Your sleep command center</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Pull fresh Ultrahuman data, visualize trends, and keep an audit trail of MCP tool calls.
          </p>
        </div>
        <RefreshButton />
      </div>

      <SummaryCards summary={dashboardData.summary} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SleepTrendChart data={dashboardData.series} />
          <div className="overflow-x-auto">
            <MetricsTable data={dashboardData.series} />
          </div>
        </div>
        <div className="space-y-4">
          <LatestMetricCard summary={dashboardData.latestSummary} />
          <RecentLogsCard logs={logs} />
        </div>
      </div>
    </div>
  );
}
