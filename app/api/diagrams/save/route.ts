import { NextRequest, NextResponse } from "next/server";
import { saveDiagram } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationNumber, diagramType, patentContent, svgContent, filingType } = body;

    if (!svgContent || !diagramType) {
      return NextResponse.json({ error: "필수 파라미터가 누락됐습니다." }, { status: 400 });
    }

    const id = await saveDiagram({ applicationNumber, diagramType, patentContent, svgContent, filingType });
    return NextResponse.json({ id, success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
