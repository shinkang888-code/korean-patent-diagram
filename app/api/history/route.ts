import { NextResponse } from "next/server";
import { getRecentDiagrams, getRecentSearches } from "@/lib/db";

export async function GET() {
  try {
    const [diagrams, searches] = await Promise.all([
      getRecentDiagrams(20),
      getRecentSearches(10),
    ]);
    return NextResponse.json({ diagrams, searches });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
