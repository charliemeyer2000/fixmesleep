import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SleepSeriesPoint } from "@/lib/metrics";

export function MetricsTable({ data }: { data: SleepSeriesPoint[] }) {
  if (!data.length) {
    return null;
  }

  const rows = [...data].slice(-10).reverse();

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Sleep</TableHead>
            <TableHead>Deep</TableHead>
            <TableHead>Readiness</TableHead>
            <TableHead>HRV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.date}>
              <TableCell className="font-medium">{row.date}</TableCell>
              <TableCell>{formatHours(row.totalSleepHours)}</TableCell>
              <TableCell>{formatHours(row.deepSleepHours)}</TableCell>
              <TableCell>{row.readinessScore ?? "—"}</TableCell>
              <TableCell>{row.hrv ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatHours(value: number) {
  return `${value.toFixed(1)} hr`;
}
