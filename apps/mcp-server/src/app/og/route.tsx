import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") ?? "fixmesleep · MCP";
    const subtitle =
      searchParams.get("subtitle") ?? "Machine-checkable sleep data APIs";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#040b11",
            color: "#e2e8f0",
            padding: "64px 88px",
            fontFamily: "Geist, Inter, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-20%",
              background:
                "conic-gradient(from 180deg at 50% 50%, rgba(56,189,248,0.15), transparent 55%)",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "36px",
              borderRadius: "32px",
              border: "1px solid rgba(148,163,184,0.2)",
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                fontSize: 28,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#38bdf8",
              }}
            >
              mcp server
            </div>
            <div
              style={{
                fontSize: 68,
                fontWeight: 600,
                lineHeight: 1.1,
                marginTop: 12,
              }}
            >
              {title}
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 32,
                color: "#94a3b8",
              }}
            >
              {subtitle}
            </div>
          </div>
          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              gap: "24px",
              fontSize: 26,
              color: "#cbd5f5",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.3)",
              }}
            >
              SSE · REST · Auth
            </div>
            <div
              style={{
                padding: "12px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.3)",
              }}
            >
              Ultrahuman ingest
            </div>
            <div
              style={{
                padding: "12px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(148,163,184,0.3)",
              }}
            >
              Observability ready
            </div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
      },
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown error");
    return new Response("Failed to generate the image", {
      status: 500,
    });
  }
}

