import { NextRequest, NextResponse } from "next/server";
import { searchPatentsByApplicant } from "@/lib/kipris";
import { logSearch } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const size = parseInt(searchParams.get("size") ?? "20", 10);
  const status = searchParams.get("status") ?? "";

  if (!q) {
    return NextResponse.json({ error: "검색어를 입력하세요." }, { status: 400 });
  }

  try {
    const result = await searchPatentsByApplicant(q, page, size, status);
    await logSearch(q, result.total_count);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
