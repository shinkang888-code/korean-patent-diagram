import { Suspense } from "react";
import { cookies } from "next/headers";
import PatentWriter from "@/components/PatentWriter";
import { AlertTriangle, Settings, Bot, FileText, Download, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "AI 명세서 작성기 — Lpatent",
  description: "Gemini AI와 대화하여 특허 명세서를 작성하고 Word/HWPX로 다운로드",
};

async function WriterContent() {
  const store = await cookies();
  const geminiCookieKey = store.get("gemini_api_key")?.value ?? "";
  const geminiEnvKey = process.env.GEMINI_API_KEY ?? "";
  const geminiKey = geminiCookieKey || geminiEnvKey;
  const apiKeyReady = Boolean(geminiKey.trim());

  return (
    <div className="flex flex-col gap-4 min-h-screen py-6 px-4">
      <div className="container mx-auto max-w-7xl w-full flex flex-col gap-4 flex-1">

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-teal-400" />
              </div>
              AI 명세서 작성기
            </h1>
            <p className="text-sm text-white/40 ml-12 sm:ml-11">
              Gemini AI와 대화로 특허 명세서를 자동 완성하고 Word · HWPX로 다운로드
            </p>
          </div>

          {/* 기능 배지 */}
          <div className="flex flex-wrap gap-2 ml-11 sm:ml-0">
            <span className="badge-teal flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Gemini AI
            </span>
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
              <FileText className="w-3 h-3" /> 자동 생성
            </span>
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
              <Download className="w-3 h-3" /> Word · HWPX
            </span>
          </div>
        </div>

        {/* API 키 미설정 경고 */}
        {!apiKeyReady && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-amber-300 text-sm">Gemini API 키가 설정되지 않았습니다</p>
              <p className="text-amber-300/60 text-sm mt-0.5">
                설정 페이지에서 Gemini API 키를 입력해야 AI 대화 기능을 사용할 수 있습니다.
              </p>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              설정하기
            </Link>
          </div>
        )}

        {/* 작성기 */}
        <div className="flex-1" style={{ minHeight: "560px" }}>
          <PatentWriter geminiApiKey={geminiKey} />
        </div>
      </div>
    </div>
  );
}

export default function WriterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    }>
      <WriterContent />
    </Suspense>
  );
}
