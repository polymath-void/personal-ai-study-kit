import { NextRequest, NextResponse } from "next/server";
import { getLastUsedApi, setLastUsedApi } from "@/lib/config-store";

export async function GET() {
  try {
    const api = getLastUsedApi();
    return NextResponse.json({ lastUsedApi: api });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { api } = await req.json();
    if (api !== "gemini" && api !== "groq") {
      return NextResponse.json({ error: "Invalid API provider. Choose 'gemini' or 'groq'." }, { status: 400 });
    }
    setLastUsedApi(api);
    return NextResponse.json({ success: true, lastUsedApi: api });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
