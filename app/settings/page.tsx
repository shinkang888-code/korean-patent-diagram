import { cookies } from "next/headers";
import { Settings, Bot, Key, CheckCircle2, AlertTriangle, Info, ExternalLink } from "lucide-react";
import ApiKeyForm from "@/components/ApiKeyForm";
import GeminiKeyForm from "@/components/GeminiKeyForm";

export default async function SettingsPage() {
  const store = await cookies();

  const cookieKey = store.get("kipris_api_key")?.value;
  const envKey = process.env.KIPRIS_API_KEY;
  const hasEnvKey = !!envKey;
  const hasCookieKey = !!cookieKey;
  const keyPreview = cookieKey ? `${cookieKey.slice(0, 4)}****${cookieKey.slice(-4)}` : null;

  const geminiCookieKey = store.get("gemini_api_key")?.value;
  const geminiEnvKey = process.env.GEMINI_API_KEY;
  const hasGeminiEnvKey = !!geminiEnvKey;
  const hasGeminiCookieKey = !!geminiCookieKey;
  const geminiKeyPreview = geminiCookieKey ? `${geminiCookieKey.slice(0, 6)}****${geminiCookieKey.slice(-4)}` : null;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-2xl space-y-6">

        {/* 헤더 */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white/60" />
            </div>
            설정
          </h1>
          <p className="text-sm text-white/40 ml-11">
            KIPRIS API 키, Gemini API 키 등 서비스 연동 설정을 관리합니다.
          </p>
        </div>

        {/* ① Gemini API 키 */}
        <div className="glass p-5 sm:p-6 rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2 mb-1">
                <Bot className="w-4 h-4 text-teal-400" />
                Gemini API 키
                <span className="text-xs font-normal text-white/30">명세서 작성기용</span>
              </h2>
              <p className="text-sm text-white/40">
                Google Gemini AI로 특허 명세서를 자동 작성합니다.
              </p>
            </div>
            {hasGeminiCookieKey ? (
              <span className="badge-teal flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> 설정됨
              </span>
            ) : hasGeminiEnvKey ? (
              <span className="flex items-center gap-1 shrink-0 text-xs px-2.5 py-1 rounded-full border bg-white/5 border-white/10 text-white/50">
                <Info className="w-3 h-3" /> 환경변수 사용 중
              </span>
            ) : (
              <span className="flex items-center gap-1 shrink-0 text-xs px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-400">
                <AlertTriangle className="w-3 h-3" /> 미설정
              </span>
            )}
          </div>

          {!hasGeminiCookieKey && !hasGeminiEnvKey && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300/80">
              <p className="font-medium mb-1 text-amber-300">Gemini API 키 없이는 AI 명세서 작성기를 사용할 수 없습니다</p>
              <p className="text-xs text-amber-300/60">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-300 transition-colors"
                >
                  Google AI Studio
                </a>
                에서 무료로 발급받을 수 있습니다.
              </p>
            </div>
          )}

          {hasGeminiCookieKey && geminiKeyPreview && (
            <div className="bg-teal-500/8 border border-teal-500/20 rounded-xl p-3 text-sm text-teal-300/80 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              현재 Gemini API 키: <code className="font-mono text-teal-300">{geminiKeyPreview}</code>
            </div>
          )}
          {hasGeminiEnvKey && !hasGeminiCookieKey && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/50 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              환경변수(GEMINI_API_KEY)로 설정된 키가 사용 중입니다.
            </div>
          )}

          <GeminiKeyForm hasCurrentKey={hasGeminiCookieKey} />

          <details className="text-sm group">
            <summary className="cursor-pointer font-medium text-white/40 hover:text-white/70 transition-colors select-none flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Gemini API 키 발급 방법 보기
            </summary>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-white/40 pl-2 text-xs leading-relaxed">
              <li>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                   className="text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors">
                  Google AI Studio
                </a>
                에 Google 계정으로 로그인
              </li>
              <li>&quot;Create API key&quot; 버튼 클릭</li>
              <li>생성된 API 키 (AIza...로 시작) 복사</li>
              <li>위 입력창에 붙여넣기 후 저장</li>
            </ol>
          </details>
        </div>

        {/* ② KIPRIS API 키 */}
        <div className="glass p-5 sm:p-6 rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2 mb-1">
                <Key className="w-4 h-4 text-teal-400" />
                KIPRIS Plus Open API 키
              </h2>
              <p className="text-sm text-white/40">
                한국 특허청(KIPO) 공식 특허 검색 API입니다.
              </p>
            </div>
            {hasCookieKey ? (
              <span className="badge-teal flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> 설정됨
              </span>
            ) : hasEnvKey ? (
              <span className="flex items-center gap-1 shrink-0 text-xs px-2.5 py-1 rounded-full border bg-white/5 border-white/10 text-white/50">
                <Info className="w-3 h-3" /> 환경변수 사용 중
              </span>
            ) : (
              <span className="flex items-center gap-1 shrink-0 text-xs px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-400">
                <AlertTriangle className="w-3 h-3" /> 미설정
              </span>
            )}
          </div>

          {!hasCookieKey && !hasEnvKey && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300/80">
              <p className="font-medium mb-1 text-amber-300">API 키를 입력해야 특허 검색이 가능합니다</p>
              <p className="text-xs text-amber-300/60">
                KIPRIS Plus API 키는{" "}
                <a href="https://plus.kipris.or.kr" target="_blank" rel="noopener noreferrer"
                   className="underline hover:text-amber-300 transition-colors">
                  plus.kipris.or.kr
                </a>
                에서 무료로 신청할 수 있습니다. 승인까지 1~2 영업일 소요됩니다.
              </p>
            </div>
          )}

          {hasCookieKey && keyPreview && (
            <div className="bg-teal-500/8 border border-teal-500/20 rounded-xl p-3 text-sm text-teal-300/80 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              현재 API 키: <code className="font-mono text-teal-300">{keyPreview}</code>
            </div>
          )}
          {hasEnvKey && !hasCookieKey && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/50 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              환경변수(KIPRIS_API_KEY)로 설정된 키가 사용 중입니다.
            </div>
          )}

          <ApiKeyForm hasCurrentKey={hasCookieKey} />

          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-white/40 hover:text-white/70 transition-colors select-none flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              KIPRIS API 키 발급 방법 보기
            </summary>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-white/40 pl-2 text-xs leading-relaxed">
              <li>
                <a href="https://plus.kipris.or.kr" target="_blank" rel="noopener noreferrer"
                   className="text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors">
                  plus.kipris.or.kr
                </a>{" "}
                접속 → 회원가입/로그인
              </li>
              <li>마이페이지 → 서비스 신청 → Open API 신청</li>
              <li>서비스 선택 후 신청 완료 (무료)</li>
              <li>승인 후 마이페이지 → 서비스 구매내역에서 API 키 확인</li>
              <li>위 입력창에 발급된 API 키를 붙여넣기</li>
            </ol>
          </details>
        </div>

        {/* 환경변수 안내 */}
        <div className="glass p-5 rounded-2xl">
          <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-400" />
            환경변수로 영구 설정 (선택)
          </h2>
          <p className="text-sm text-white/40 mb-4 ml-6">
            Vercel 대시보드에서 설정하면 쿠키 없이도 항상 동작합니다.
          </p>
          <div className="bg-[#0A0F1E] text-green-400 rounded-xl p-4 text-xs font-mono space-y-1.5 border border-white/5">
            <p className="text-white/25"># Vercel Dashboard → Settings → Environment Variables</p>
            <p>KIPRIS_API_KEY=<span className="text-amber-300">여기에_KIPRIS_키_입력</span></p>
            <p>GEMINI_API_KEY=<span className="text-amber-300">여기에_Gemini_키_입력</span></p>
          </div>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-teal-400/70 hover:text-teal-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Vercel 대시보드 열기
          </a>
        </div>

      </div>
    </div>
  );
}
