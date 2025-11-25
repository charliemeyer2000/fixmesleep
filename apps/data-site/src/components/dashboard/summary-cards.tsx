import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData } from "@/lib/metrics";

const formatter = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

export function SummaryCards({ summary }: { summary: DashboardData["summary"] }) {
  const items = [
    {
      label: "Avg sleep",
      value: `${formatter.format(summary.avgSleepHours)} hr`
    },
    {
      label: "Avg deep sleep",
      value: `${formatter.format(summary.avgDeepSleepHours)} hr`
    },
    {
      label: "Avg readiness",
      value: summary.avgReadiness != null ? `${formatter.format(summary.avgReadiness)}` : "—"
    },
    {
      label: "Avg HRV",
      value: summary.avgHrv != null ? `${formatter.format(summary.avgHrv)} ms` : "—"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map(item => (
        <Card key={item.label}>
          <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <p className="text-xl sm:text-2xl font-semibold tracking-tight">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
