import { Suspense } from "react";
import { cookies } from "next/headers";
import PatentWriter from "@/components/PatentWriter";
import { AlertTriangle, Settings, Bot, FileText, Download } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "특허명세서 작성기 — Gemini AI",
  description: "Gemini AI와 대화하여 특허 명세서를 작성하고 Word/HWPX로 다운로드",
};

async function WriterContent() {
  const store = await cookies();
  const geminiCookieKey = store.get("gemini_api_key")?.value ?? "";
  const geminiEnvKey = process.env.GEMINI_API_KEY ?? "";
  const geminiKey = geminiCookieKey || geminiEnvKey;
  const apiKeyReady = Boolean(geminiKey.trim());

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600" />
          특허명세서 작성기
        </h1>
        <p className="text-slate-600 mt-1 text-sm">
          Gemini AI와 대화로 특허 명세서를 완성하고, Word 또는 한글(.hwpx) 파일로 다운로드하세요.
        </p>
      </div>

      {/* 기능 안내 배지 */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Bot className="w-3.5 h-3.5" /> Gemini AI 대화
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FileText className="w-3.5 h-3.5" /> 명세서 자동 생성
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Download className="w-3.5 h-3.5" /> Word · HWPX 다운로드
        </span>
      </div>

      {/* API 키 미설정 경고 */}
      {!apiKeyReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-900 text-sm">Gemini API 키가 설정되지 않았습니다</p>
            <p className="text-amber-700 text-sm mt-0.5">
              설정 페이지에서 Gemini API 키를 입력해야 AI 대화 기능을 사용할 수 있습니다.
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            설정하기
          </Link>
        </div>
      )}

      {/* 작성기 (높이 고정) */}
      <div style={{ height: "calc(100vh - 280px)", minHeight: "560px" }}>
        <PatentWriter geminiApiKey={geminiKey} />
      </div>
    </div>
  );
}

export default function WriterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        로딩 중...
      </div>
    }>
      <WriterContent />
    </Suspense>
  );
}
