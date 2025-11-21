import { Metadata } from "next";
import { LogTable } from "./log-table";
import { getRecentActionLogs } from "@/lib/metrics";

export const metadata: Metadata = {
  title: "fixmesleep · Logs"
};

export default async function LogsPage() {
  const logs = await getRecentActionLogs(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">MCP action logs</h1>
        <p className="text-sm text-muted-foreground">
          Every request/response triggered by Poke (and this dashboard) is captured here for auditing.
        </p>
      </div>
      <LogTable logs={logs} />
    </div>
  );
}
