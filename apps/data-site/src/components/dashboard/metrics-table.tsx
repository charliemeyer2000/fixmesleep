import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SleepSeriesPoint } from "@/lib/metrics";

export function MetricsTable({ data }: { data: SleepSeriesPoint[] }) {
  if (!data.length) {
    return null;
  }

  const rows = data.slice(-10).reverse();

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Date</TableHead>
            <TableHead className="whitespace-nowrap">Sleep</TableHead>
            <TableHead className="whitespace-nowrap">Deep</TableHead>
            <TableHead className="whitespace-nowrap">Readiness</TableHead>
            <TableHead className="whitespace-nowrap">HRV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.date}>
              <TableCell className="font-medium whitespace-nowrap">{row.date}</TableCell>
              <TableCell className="whitespace-nowrap">{formatHours(row.totalSleepHours)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatHours(row.deepSleepHours)}</TableCell>
              <TableCell className="whitespace-nowrap">{row.readinessScore ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">{row.hrv ?? "—"}</TableCell>
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
