import { Metadata } from "next";
import { ChatPanel } from "./chat-panel";

export const metadata: Metadata = {
  title: "fixmesleep · Chat"
};

export default function ChatPage() {
  return (
    <div className="flex flex-col flex-1 gap-4 min-h-0">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-semibold tracking-tight">Analyze Your Sleep Data</h1>
        <p className="text-muted-foreground">
          Query your sleep metrics, compare trends, fetch live data from your ring, or review recent activity logs.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
