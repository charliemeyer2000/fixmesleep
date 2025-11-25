"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage, ToolUIPart } from "ai";
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
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  type PromptInputMessage
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert, StopCircle } from "lucide-react";

const SUGGESTIONS = [
  "Show me my sleep metrics for the last 7 days",
  "What was my HRV and sleep score on November 25th 2025?",
  "Compare my deep sleep vs. REM over the last 3 days",
  "Fetch my latest data from Ultrahuman",
  "Show me recent MCP action logs"
];

export function ChatPanel() {
  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    experimental_throttle: 250,
    onError: (error) => {
      console.error("Chat error:", error);
    }
  });
  const [draft, setDraft] = useState("");

  const handleSend = async (message: PromptInputMessage) => {
    const text = message.text?.trim();
    if (!text) return;
    setDraft(""); // Clear immediately
    await sendMessage({ text });
  };

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex flex-col flex-1 gap-4 min-h-0">
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

      <Card className="flex flex-col overflow-hidden flex-1 min-h-0 max-h-full">
        <Conversation className="!overflow-y-auto">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                description="Query your sleep metrics, compare trends over time, or fetch live data from your Ultrahuman ring."
              />
            ) : (
              messages.map((message, index) => {
                const isLastAssistant = message.role === "assistant" && index === messages.length - 1;
                const showStreaming = isLastAssistant && isStreaming;
                
                return (
                  <Message key={message.id ?? index} from={message.role}>
                    <MessageContent>
                      {renderMessageParts(message)}
                      {showStreaming && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                            </span>
                            Analyzing data
                          </span>
                          <PromptInputButton onClick={() => stop()} size="xs" variant="ghost">
                            <StopCircle className="mr-1 size-3" />
                            Stop
                          </PromptInputButton>
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </Card>

      <Suggestions className="gap-2 flex-shrink-0">
        {SUGGESTIONS.map(suggestion => (
          <Suggestion key={suggestion} onClick={value => setDraft(value)} suggestion={suggestion} />
        ))}
      </Suggestions>

      <PromptInput
        className="rounded-2xl border bg-card flex-shrink-0"
        onSubmit={(message, event) => {
          event.preventDefault();
          void handleSend(message);
        }}
      >
        <PromptInputBody>
          <PromptInputTextarea
            placeholder="Ask about your sleep metrics, trends, or recent data..."
            value={draft}
            onChange={event => setDraft(event.target.value)}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit 
            status={isStreaming ? "submitted" : undefined}
            disabled={!draft.trim() && status !== "streaming"}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}

function renderMessageParts(message: UIMessage) {
  if (!message.parts || message.parts.length === 0) {
    return null;
  }

  return message.parts.map((part, index) => {
    const key = `${message.id ?? index}-part-${index}`;
    
    // Handle text parts
    if (part.type === "text" && "text" in part && part.text) {
      return (
        <MessageResponse key={key}>{part.text}</MessageResponse>
      );
    }
    
    // Handle tool calls
    if (part.type.startsWith("tool-")) {
      const toolPart = part as ToolUIPart;
      const toolName = part.type.replace("tool-", "");
      const isCompleted = toolPart.state === "output-available";
      
      return (
        <Tool key={key} defaultOpen={isCompleted}>
          <ToolHeader type={toolPart.type} state={toolPart.state} />
          <ToolContent>
            <ToolInput input={toolPart.input} />
            <ToolOutput
              output={
                toolPart.output ? (
                  <div className="space-y-2">
                    {toolName === "query_sleep_metrics" && renderSleepMetrics(toolPart.output)}
                    {toolName === "get_specific_date_details" && renderDateDetails(toolPart.output)}
                    {toolName === "fetch_latest_ultrahuman" && renderLatestData(toolPart.output)}
                    {toolName === "view_action_logs" && renderActionLogs(toolPart.output)}
                    {!["query_sleep_metrics", "get_specific_date_details", "fetch_latest_ultrahuman", "view_action_logs"].includes(toolName) && (
                      <CodeBlock code={JSON.stringify(toolPart.output, null, 2)} language="json" />
                    )}
                  </div>
                ) : undefined
              }
              errorText={toolPart.errorText}
            />
          </ToolContent>
        </Tool>
      );
    }
    
    return null;
  });
}

function renderSleepMetrics(output: any) {
  if (output.error) {
    return <MessageResponse className="text-destructive">{output.error}</MessageResponse>;
  }
  
  return (
    <div className="space-y-3">
      <MessageResponse>
        {`Found **${output.count} day${output.count !== 1 ? 's' : ''}** of sleep data:`}
      </MessageResponse>
      <div className="grid gap-2">
        {output.metrics?.slice(0, 10).map((metric: any, i: number) => (
          <Card key={i} className="p-3 bg-muted/50">
            <div className="text-sm space-y-1">
              <div className="font-semibold">{metric.date}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {metric.sleepScore && <div>Sleep Score: <span className="font-medium">{metric.sleepScore}</span></div>}
                {metric.totalSleepHours && <div>Total: <span className="font-medium">{metric.totalSleepHours}h</span></div>}
                {metric.deepSleepHours && <div>Deep: <span className="font-medium">{metric.deepSleepHours}h</span></div>}
                {metric.remSleepHours && <div>REM: <span className="font-medium">{metric.remSleepHours}h</span></div>}
                {metric.hrv && <div>HRV: <span className="font-medium">{metric.hrv}</span></div>}
                {metric.readinessScore && <div>Readiness: <span className="font-medium">{metric.readinessScore}</span></div>}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {output.count > 10 && (
        <MessageResponse className="text-xs text-muted-foreground">
          {`Showing first 10 of ${output.count} results`}
        </MessageResponse>
      )}
    </div>
  );
}

function renderDateDetails(output: any) {
  if (output.error) {
    return <MessageResponse className="text-destructive">{output.error}</MessageResponse>;
  }
  
  return (
    <div className="space-y-3">
      <MessageResponse>
        {`Detailed metrics for **${output.date}**:`}
      </MessageResponse>
      <Card className="p-4 space-y-3">
        {output.details?.sleep && (
          <div>
            <div className="font-semibold text-sm mb-2">💤 Sleep</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs ml-3">
              {output.details.sleep.score && <div>Score: <span className="font-medium">{output.details.sleep.score}</span></div>}
              {output.details.sleep.total && <div>Total: <span className="font-medium">{output.details.sleep.total}</span></div>}
              {output.details.sleep.deep && <div>Deep: <span className="font-medium">{output.details.sleep.deep}</span></div>}
              {output.details.sleep.rem && <div>REM: <span className="font-medium">{output.details.sleep.rem}</span></div>}
              {output.details.sleep.light && <div>Light: <span className="font-medium">{output.details.sleep.light}</span></div>}
              {output.details.sleep.efficiency && <div>Efficiency: <span className="font-medium">{output.details.sleep.efficiency}</span></div>}
            </div>
          </div>
        )}
        {output.details?.recovery && (
          <div>
            <div className="font-semibold text-sm mb-2">📊 Recovery</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs ml-3">
              {output.details.recovery.readiness && <div>Readiness: <span className="font-medium">{output.details.recovery.readiness}</span></div>}
              {output.details.recovery.hrv && <div>HRV: <span className="font-medium">{output.details.recovery.hrv}</span></div>}
              {output.details.recovery.rhr && <div>RHR: <span className="font-medium">{output.details.recovery.rhr}</span></div>}
            </div>
          </div>
        )}
        {output.details?.activity && (
          <div>
            <div className="font-semibold text-sm mb-2">🏃 Activity</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs ml-3">
              {output.details.activity.activeMinutes && <div>Active: <span className="font-medium">{output.details.activity.activeMinutes}min</span></div>}
              {output.details.activity.movementIndex && <div>Movement Index: <span className="font-medium">{output.details.activity.movementIndex}</span></div>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function renderLatestData(output: any) {
  if (output.error) {
    return <MessageResponse className="text-destructive">{output.error}</MessageResponse>;
  }
  
  return (
    <div className="space-y-3">
      <MessageResponse>
        {`Latest data from Ultrahuman for **${output.date}**${output.fresh ? ' (fresh)' : ''}:`}
      </MessageResponse>
      <Card className="p-4 space-y-3">
        {output.sleep && (
          <div>
            <div className="font-semibold text-sm mb-2">💤 Sleep</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs ml-3">
              {output.sleep.score && <div>Score: <span className="font-medium">{output.sleep.score}</span></div>}
              {output.sleep.totalMinutes && <div>Total: <span className="font-medium">{(output.sleep.totalMinutes / 60).toFixed(1)}h</span></div>}
              {output.sleep.deepMinutes && <div>Deep: <span className="font-medium">{(output.sleep.deepMinutes / 60).toFixed(1)}h</span></div>}
              {output.sleep.remMinutes && <div>REM: <span className="font-medium">{(output.sleep.remMinutes / 60).toFixed(1)}h</span></div>}
              {output.sleep.lightMinutes && <div>Light: <span className="font-medium">{(output.sleep.lightMinutes / 60).toFixed(1)}h</span></div>}
              {output.sleep.efficiency && <div>Efficiency: <span className="font-medium">{output.sleep.efficiency}%</span></div>}
            </div>
          </div>
        )}
        {output.recovery && (
          <div>
            <div className="font-semibold text-sm mb-2">📊 Recovery</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs ml-3">
              {output.recovery.hrv && <div>HRV: <span className="font-medium">{output.recovery.hrv}</span></div>}
              {output.recovery.rhr && <div>RHR: <span className="font-medium">{output.recovery.rhr}</span></div>}
              {output.recovery.recoveryIndex && <div>Recovery Index: <span className="font-medium">{output.recovery.recoveryIndex}</span></div>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function renderActionLogs(output: any) {
  if (output.error) {
    return <MessageResponse className="text-destructive">{output.error}</MessageResponse>;
  }
  
  return (
    <div className="space-y-3">
      <MessageResponse>
        {`Recent MCP action logs (${output.count} entries):`}
      </MessageResponse>
      <div className="space-y-2">
        {output.logs?.map((log: any, i: number) => (
          <Card key={i} className="p-3 bg-muted/50">
            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{log.tool}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  log.statusCode === 200 ? 'bg-green-100 text-green-800' :
                  log.statusCode >= 400 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {log.statusCode}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center justify-between">
                <span>{new Date(log.timestamp).toLocaleString()}</span>
                <span className="text-xs">{log.durationMs}ms</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {log.endpoint} • {log.clientId}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
