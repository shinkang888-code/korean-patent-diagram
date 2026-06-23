import { NextRequest, NextResponse } from "next/server";
import { getCitingPatents } from "@/lib/kipris";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const appNum = searchParams.get("appNum")?.trim();

  if (!appNum) {
    return NextResponse.json({ error: "출원번호를 입력하세요." }, { status: 400 });
  }

  try {
    const citing = await getCitingPatents(appNum);
    return NextResponse.json({ citing_patents: citing, count: citing.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
