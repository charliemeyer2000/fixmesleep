"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  type PromptInputMessage
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert, StopCircle } from "lucide-react";

const SUGGESTIONS = [
  "Summarize last night's sleep for me.",
  "Why did my readiness change this week?",
  "Compare my deep sleep vs. REM over the last 3 days."
];

export function ChatPanel() {
  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    experimental_throttle: 250
  });
  const [draft, setDraft] = useState("");

  const handleSend = async (message: PromptInputMessage) => {
    const text = message.text?.trim();
    if (!text) return;
    await sendMessage({ text });
    setDraft("");
  };

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error.message}</span>
            <PromptInputButton onClick={() => clearError()} size="sm" variant="secondary">
              Dismiss
            </PromptInputButton>
          </AlertDescription>
        </Alert>
      )}

      <Card className="flex h-[520px] flex-col overflow-hidden">
        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                description="Ask anything about your sleep trends, HRV changes, or Poke's MCP actions."
              />
            ) : (
              messages.map((message, index) => (
                <Message key={message.id ?? index} from={message.role}>
                  <MessageContent>
                    {renderMessageParts(message)}
                    {message.role === "assistant" && isStreaming && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                          </span>
                          Streaming response
                        </span>
                        <PromptInputButton onClick={() => stop()} size="xs" variant="ghost">
                          <StopCircle className="mr-1 size-3" />
                          Stop
                        </PromptInputButton>
                      </div>
                    )}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </Card>

      <Suggestions className="gap-2">
        {SUGGESTIONS.map(suggestion => (
          <Suggestion key={suggestion} onClick={value => setDraft(value)} suggestion={suggestion} />
        ))}
      </Suggestions>

      <PromptInput
        className="rounded-2xl border bg-card"
        onSubmit={(message, event) => {
          event.preventDefault();
          void handleSend(message);
        }}
      >
        <PromptInputTextarea
          placeholder="Ask fixmesleep for insights..."
          value={draft}
          onChange={event => setDraft(event.target.value)}
        />
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton disabled variant="ghost">
              Attach
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit status={isStreaming ? "submitted" : undefined} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function renderMessageParts(message: UIMessage) {
  type MessagePart = NonNullable<UIMessage["parts"]>[number];
  type TextUIPart = Extract<MessagePart, { type: "text"; text?: string }>;

  const isTextPart = (part: MessagePart): part is TextUIPart & { text: string } =>
    part.type === "text" && typeof part.text === "string";

  const textParts = message.parts?.filter(isTextPart) ?? [];

  if (textParts.length === 0) {
    return <MessageResponse>Unsupported message format.</MessageResponse>;
  }

  return textParts.map((part, index) => (
    <MessageResponse key={`${message.id ?? index}-part-${index}`}>{part.text}</MessageResponse>
  ));
}
