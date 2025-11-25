"use client";

import { createContext, useContext, useMemo } from "react";
import { Chat } from "@ai-sdk/react";
import type { UIMessage } from "ai";

const ChatContext = createContext<Chat<UIMessage> | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const chat = useMemo(() => {
    return new Chat<UIMessage>({
      id: "fixmesleep-chat",
      messages: [],
    });
  }, []);

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatInstance() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatInstance must be used within ChatProvider");
  }
  return context;
}

