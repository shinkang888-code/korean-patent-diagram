import { NextRequest, NextResponse } from "next/server";
import { getPatentDetail } from "@/lib/kipris";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const appNum = searchParams.get("appNum")?.trim();

  if (!appNum) {
    return NextResponse.json({ error: "출원번호를 입력하세요." }, { status: 400 });
  }

  try {
    const patent = await getPatentDetail(appNum);
    if (!patent) {
      return NextResponse.json({ error: "특허를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json(patent);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
