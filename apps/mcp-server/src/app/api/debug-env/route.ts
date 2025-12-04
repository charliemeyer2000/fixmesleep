import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const pokeKey = process.env.POKE_API_KEY || "";
  const ultraToken = process.env.ULTRAHUMAN_API_TOKEN || "";
  const ultraCode = process.env.ULTRAHUMAN_ACCESS_CODE || "";
  
  return NextResponse.json({
    poke_key: {
      value: pokeKey,
      length: pokeKey.length,
      ends_with_backslash_n: pokeKey.endsWith("\\n"),
      ends_with_newline: pokeKey.endsWith("\n"),
      last_chars: pokeKey.slice(-5).split('').map(c => c.charCodeAt(0))
    },
    ultrahuman_token: {
      length: ultraToken.length,
      ends_with_backslash_n: ultraToken.endsWith("\\n"),
      ends_with_newline: ultraToken.endsWith("\n"),
      last_chars: ultraToken.slice(-5).split('').map(c => c.charCodeAt(0))
    },
    ultrahuman_code: {
      value: ultraCode,
      length: ultraCode.length,
      ends_with_backslash_n: ultraCode.endsWith("\\n"),
      ends_with_newline: ultraCode.endsWith("\n"),
      last_chars: ultraCode.slice(-5).split('').map(c => c.charCodeAt(0))
    }
  });
}
