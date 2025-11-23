import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") ?? "fixmesleep · data";
    const metric =
      searchParams.get("metric") ?? "Ultrahuman-powered sleep insights";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#050b16",
            color: "#f5f5f5",
            padding: "72px 96px",
            fontFamily: "Geist, Inter, sans-serif",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "48px",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "32px",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "48px",
              border: "1px solid rgba(86,161,255,0.2)",
              filter: "blur(30px)",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                fontSize: 28,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#7dd3fc",
              }}
            >
              fixmesleep data
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 600,
                lineHeight: 1.1,
                maxWidth: "880px",
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 32,
            }}
          >
            <div style={{ color: "#94a3b8" }}>{metric}</div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                alignItems: "center",
                fontSize: 24,
                color: "#cbd5f5",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "9999px",
                  background:
                    "radial-gradient(circle at 30% 30%, #38bdf8, #2563eb)",
                }}
              />
              sleep metrics · chat · logs
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

