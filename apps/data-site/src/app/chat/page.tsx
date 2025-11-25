import { Metadata } from "next";
import { ChatPanel } from "./chat-panel";

export const metadata: Metadata = {
  title: "fixmesleep · Chat"
};

export default function ChatPage() {
  return (
    <div className="flex flex-col flex-1 gap-3 sm:gap-4 min-h-0">
      <div className="flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Analyze Your Sleep Data</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Query your sleep metrics, compare trends, fetch live data from your ring, or review recent activity logs.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
