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

export type AIProvider = "gpt" | "gemini" | "deepseek" | "auto";

/* ─── OpenAI / DeepSeek 공통 Chat Completions 호출 ─── */
async function callOpenAICompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[${res.status}] ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/* ─── Gemini 호출 ─── */
async function callGemini(
  apiKey: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history,
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  });

  const result = await chat.sendMessage(messages[messages.length - 1].content);
  return result.response.text();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, provider = "auto" } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      provider?: AIProvider;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "메시지가 없습니다." }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role !== "user") {
      return NextResponse.json(
        { error: "마지막 메시지는 사용자 메시지여야 합니다." },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
    const geminiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
    const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim() ?? "";

    let text = "";
    let usedProvider = "";

    /* ─── 특정 프로바이더 지정 ─── */
    if (provider === "gpt") {
      if (!openaiKey) throw new Error("OpenAI API 키가 설정되지 않았습니다.");
      text = await callOpenAICompat(
        "https://api.openai.com/v1",
        openaiKey,
        "gpt-4o-mini",
        messages
      );
      usedProvider = "GPT-4o mini";
    } else if (provider === "gemini") {
      if (!geminiKey) throw new Error("Gemini API 키가 설정되지 않았습니다.");
      text = await callGemini(geminiKey, messages);
      usedProvider = "Gemini 2.0 Flash";
    } else if (provider === "deepseek") {
      if (!deepseekKey) throw new Error("DeepSeek API 키가 설정되지 않았습니다.");
      text = await callOpenAICompat(
        "https://api.deepseek.com/v1",
        deepseekKey,
        "deepseek-chat",
        messages
      );
      usedProvider = "DeepSeek";
    } else {
      /* ─── auto: GPT → Gemini → DeepSeek 순서로 폴백 ─── */
      const providers: Array<() => Promise<{ text: string; name: string }>> = [];

      if (openaiKey) {
        providers.push(async () => ({
          text: await callOpenAICompat(
            "https://api.openai.com/v1",
            openaiKey,
            "gpt-4o-mini",
            messages
          ),
          name: "GPT-4o mini",
        }));
      }
      if (geminiKey) {
        providers.push(async () => ({
          text: await callGemini(geminiKey, messages),
          name: "Gemini 2.0 Flash",
        }));
      }
      if (deepseekKey) {
        providers.push(async () => ({
          text: await callOpenAICompat(
            "https://api.deepseek.com/v1",
            deepseekKey,
            "deepseek-chat",
            messages
          ),
          name: "DeepSeek",
        }));
      }

      if (providers.length === 0) {
        return NextResponse.json(
          { error: "사용 가능한 AI API 키가 없습니다. 설정에서 API 키를 등록해주세요." },
          { status: 400 }
        );
      }

      let lastError: Error | null = null;
      for (const tryProvider of providers) {
        try {
          const result = await tryProvider();
          text = result.text;
          usedProvider = result.name;
          break;
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e));
          console.warn(`[Chat API] ${usedProvider} 실패, 다음 프로바이더로 폴백:`, lastError.message);
        }
      }

      if (!text) {
        throw lastError ?? new Error("모든 AI 프로바이더 호출 실패");
      }
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "AI가 빈 응답을 반환했습니다." }, { status: 500 });
    }

    return NextResponse.json({ text, provider: usedProvider });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "서버 오류";
    console.error("[Chat API Error]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
