import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function POST() {
  try {
    await initDb();
    return NextResponse.json({ success: true, message: "DB 초기화 완료" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "초기화 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
