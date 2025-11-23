"use client";

import { useState, useTransition } from "react";
import { refreshMetricsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleRefresh = () => {
    startTransition(async () => {
      setMessage(null);
      try {
        const result = await refreshMetricsAction({ days: 7 });
        setMessage(
          `Refreshed ${result.dates.length} day(s), updated ${result.upserted} record(s)`
        );
      } catch {
        setMessage("Refresh failed. Check the server logs.");
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button onClick={handleRefresh} disabled={isPending} variant="outline">
        {isPending ? "Refreshing..." : "Refresh data"}
      </Button>
      {message && (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
