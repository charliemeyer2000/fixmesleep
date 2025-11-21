import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SleepSummary } from "@repo/ultrahuman-client";

const numberFormatter = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

export function LatestMetricCard({ summary }: { summary?: SleepSummary }) {
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest nightly summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No cached metrics yet. Use the Refresh data button to pull your latest ring readings.
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      label: "Sleep score",
      value: summary.sleepScore != null ? summary.sleepScore : "—"
    },
    {
      label: "Readiness",
      value: summary.readinessScore != null ? summary.readinessScore : "—"
    },
    {
      label: "Total sleep",
      value:
        summary.totalSleepMinutes != null
          ? `${numberFormatter.format(summary.totalSleepMinutes / 60)} hr`
          : "—"
    },
    {
      label: "Deep sleep",
      value:
        summary.deepSleepMinutes != null
          ? `${numberFormatter.format(summary.deepSleepMinutes / 60)} hr`
          : "—"
    },
    {
      label: "REM sleep",
      value:
        summary.remSleepMinutes != null
          ? `${numberFormatter.format(summary.remSleepMinutes / 60)} hr`
          : "—"
    },
    {
      label: "HRV",
      value:
        summary.avgSleepHrv != null ? `${numberFormatter.format(summary.avgSleepHrv)} ms` : "—"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest nightly summary</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          {items.map(item => (
            <div key={item.label} className="rounded-lg border bg-card px-4 py-3">
              <dt className="text-xs uppercase text-muted-foreground">{item.label}</dt>
              <dd className="text-lg font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
