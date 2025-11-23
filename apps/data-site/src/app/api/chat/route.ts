import { NextResponse } from "next/server";
import { streamText, convertToModelMessages } from "ai";
import { getDashboardData } from "@/lib/metrics";

const MODEL = process.env.ANTHROPIC_MODEL ?? "anthropic/claude-3-haiku-20240307";

export async function POST(req: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json(
      { error: "Missing AI_GATEWAY_API_KEY" },
      { status: 500 }
    );
  }

  const { messages } = await req.json();
  const dashboard = await getDashboardData(7);

  const systemMessage = `You are fixmesleep, an assistant that helps interpret Ultrahuman metrics and MCP logs.
Summary: ${JSON.stringify(dashboard.summary)}.
Latest night: ${JSON.stringify(dashboard.latestSummary)}.
Use concise, actionable answers.`;

  // Convert UIMessage[] to ModelMessage[]
  const modelMessages = convertToModelMessages(messages);

  const result = await streamText({
    model: MODEL,
    system: systemMessage,
    messages: modelMessages
  });

  return result.toTextStreamResponse();
}
