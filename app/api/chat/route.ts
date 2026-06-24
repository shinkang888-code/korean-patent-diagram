import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `당신은 한국 특허법 전문가이자 특허 명세서 작성 AI 어시스턴트입니다.

주요 역할:
1. 특허 명세서 전체 작성 (발명의 명칭, 기술분야, 배경기술, 해결과제, 과제해결수단, 발명의 효과, 도면의 간단한 설명, 발명을 실시하기 위한 구체적인 내용, 청구범위)
2. 특허 청구항 작성 및 검토
3. 특허 출원 관련 일반 질문 답변
4. 기술 분야별 특허 전략 조언

응답 형식:
- 명세서 작성 시 한국특허청(KIPO) 규격에 맞게 작성
- 청구항은 독립항과 종속항을 명확히 구분
- 기술 용어는 특허법 표준 용어 사용
- 마크다운 형식으로 구조화하여 작성`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      apiKey?: string;
    };

    const geminiKey =
      apiKey?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      "";

    if (!geminiKey) {
      return NextResponse.json(
        { error: "Gemini API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "메시지가 없습니다." }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role !== "user") {
      return NextResponse.json({ error: "마지막 메시지는 사용자 메시지여야 합니다." }, { status: 400 });
    }

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        ...history,
        {
          role: "user",
          parts: [{ text: lastUserMessage.content }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg =
        (errData as { error?: { message?: string } }).error?.message ??
        `Gemini API 오류 (${response.status})`;
      return NextResponse.json({ error: errMsg }, { status: response.status });
    }

    const data = await response.json();
    const text: string =
      (data as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      }).candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text.trim()) {
      return NextResponse.json({ error: "AI가 빈 응답을 반환했습니다." }, { status: 500 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
