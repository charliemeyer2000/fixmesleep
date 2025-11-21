"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import type { SleepSeriesPoint } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tooltipFormatter = (value: number) => `${value.toFixed(1)} hr`;

export function SleepTrendChart({ data }: { data: SleepSeriesPoint[] }) {
  if (!data.length) return null;

  const chartData = data.map(point => ({
    date: point.date.slice(5),
    Sleep: Number(point.totalSleepHours.toFixed(2)),
    Deep: Number(point.deepSleepHours.toFixed(2))
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sleep vs deep sleep</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickLine={false} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              domain={[0, "dataMax + 1"]}
            />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            <Line type="monotone" dataKey="Sleep" stroke="hsl(var(--chart-1))" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="Deep"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
