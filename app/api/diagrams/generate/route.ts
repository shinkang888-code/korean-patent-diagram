import { NextRequest, NextResponse } from "next/server";
import { detectDiagramType, generateDiagramSVG } from "@/lib/diagram";
import type { DiagramType } from "@/lib/diagram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      type,
      filingType = "K",
      diagramNo = "도 1",
      pageNo = 1,
      totalPages = 1,
    } = body;

    if (!content || content.trim().length < 5) {
      return NextResponse.json({ error: "특허 내용을 입력하세요." }, { status: 400 });
    }

    const detected = !type;
    const diagramType: DiagramType = type ?? detectDiagramType(content);

    const svg = generateDiagramSVG(content, diagramType, {
      filingType,
      diagramNo,
      pageNo,
      totalPages,
    });

    return NextResponse.json({
      svg,
      type: diagramType,
      detected,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
