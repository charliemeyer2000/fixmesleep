import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ActionLogEntry } from "@/lib/metrics";

export function LogTable({ logs }: { logs: ActionLogEntry[] }) {
  if (!logs.length) {
    return <p className="text-sm text-muted-foreground">No logs recorded yet.</p>;
  }

  return (
    <ScrollArea className="h-[600px] rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Tool</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="font-medium">{log.toolName}</TableCell>
              <TableCell>{log.clientId}</TableCell>
              <TableCell>{log.statusCode}</TableCell>
              <TableCell>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                  {JSON.stringify(log.responsePayload ?? log.requestPayload, null, 2)}
                </pre>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
