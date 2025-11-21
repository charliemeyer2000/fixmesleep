import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActionLogEntry } from "@/lib/metrics";

export function RecentLogsCard({ logs }: { logs: ActionLogEntry[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent MCP activity</CardTitle>
        <Link href="/logs" className="text-sm text-primary underline-offset-4 hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No MCP traffic recorded yet.</p>
        ) : (
          logs.slice(0, 5).map(log => (
            <div key={log.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{log.toolName}</div>
                <Badge variant={log.statusCode >= 400 ? "destructive" : "secondary"}>
                  {log.statusCode}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()} · {log.clientId}
              </p>
              <p className="mt-1 text-sm line-clamp-2">
                {String(log.requestPayload?.endpoint ?? JSON.stringify(log.requestPayload))}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
