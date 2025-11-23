import { NextResponse } from "next/server";
import { streamText, convertToModelMessages } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { getDashboardData } from "@/lib/metrics";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-3-haiku-20240307";

export async function POST(req: Request) {
  const anthropicKey = process.env.AI_GATEWAY_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "Missing AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY" },
      { status: 500 }
    );
  }

  const anthropic = createAnthropic({ apiKey: anthropicKey });

  const { messages } = await req.json();
  const dashboard = await getDashboardData(7);

  const systemMessage = `You are fixmesleep, an assistant that helps interpret Ultrahuman metrics and MCP logs.
Summary: ${JSON.stringify(dashboard.summary)}.
Latest night: ${JSON.stringify(dashboard.latestSummary)}.
Use concise, actionable answers.`;

  // Convert UIMessage[] to ModelMessage[]
  const modelMessages = convertToModelMessages(messages);

  const result = await streamText({
    model: anthropic(MODEL),
    system: systemMessage,
    messages: modelMessages
  });

  return result.toTextStreamResponse();
}
