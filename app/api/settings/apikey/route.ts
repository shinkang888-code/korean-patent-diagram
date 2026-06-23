import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "kipris_api_key";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 5) {
    return NextResponse.json({ error: "유효한 API 키를 입력하세요." }, { status: 400 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, apiKey.trim(), {
    httpOnly: false, // 클라이언트에서 상태 확인 가능하게
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}

export async function GET(req: NextRequest) {
  const key = req.cookies.get(COOKIE_NAME)?.value;
  return NextResponse.json({
    hasKey: !!key,
    keyPreview: key ? `${key.slice(0, 4)}****${key.slice(-4)}` : null,
  });
}
