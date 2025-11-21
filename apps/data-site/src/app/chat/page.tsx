import { Metadata } from "next";
import { ChatPanel } from "./chat-panel";

export const metadata: Metadata = {
  title: "fixmesleep · Chat"
};

export default function ChatPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Chat with your data</h1>
        <p className="text-muted-foreground">
          Ask Anthropic Claude (via Vercel AI Gateway) anything about your logs, sleep trends, or MCP actions.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
