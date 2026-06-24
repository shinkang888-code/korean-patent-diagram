import { cookies } from "next/headers";
import { Settings, Bot } from "lucide-react";
import ApiKeyForm from "@/components/ApiKeyForm";
import GeminiKeyForm from "@/components/GeminiKeyForm";

export default async function SettingsPage() {
  const store = await cookies();

  // KIPRIS API 키
  const cookieKey = store.get("kipris_api_key")?.value;
  const envKey = process.env.KIPRIS_API_KEY;
  const hasEnvKey = !!envKey;
  const hasCookieKey = !!cookieKey;
  const keyPreview = cookieKey ? `${cookieKey.slice(0, 4)}****${cookieKey.slice(-4)}` : null;

  // Gemini API 키
  const geminiCookieKey = store.get("gemini_api_key")?.value;
  const geminiEnvKey = process.env.GEMINI_API_KEY;
  const hasGeminiEnvKey = !!geminiEnvKey;
  const hasGeminiCookieKey = !!geminiCookieKey;
  const geminiKeyPreview = geminiCookieKey ? `${geminiCookieKey.slice(0, 6)}****${geminiCookieKey.slice(-4)}` : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          설정
        </h1>
        <p className="text-slate-600 mt-1 text-sm">
          KIPRIS API 키, Gemini API 키 등 서비스 연동 설정을 관리합니다.
        </p>
      </div>

      {/* ① Gemini API 키 */}
      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-blue-600" />
              Gemini API 키 <span className="text-xs font-normal text-slate-500 ml-1">(특허명세서 작성기)</span>
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Google Gemini AI로 특허 명세서를 자동 작성합니다.
            </p>
          </div>
          {hasGeminiCookieKey ? (
            <span className="badge-green">✓ 설정됨</span>
          ) : hasGeminiEnvKey ? (
            <span className="badge-blue">환경변수 사용 중</span>
          ) : (
            <span className="badge-yellow">⚠ 미설정</span>
          )}
        </div>

        {!hasGeminiCookieKey && !hasGeminiEnvKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">Gemini API 키 없이는 AI 명세서 작성기를 사용할 수 없습니다</p>
            <p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Google AI Studio
              </a>
              에서 무료로 발급받을 수 있습니다.
            </p>
          </div>
        )}

        {hasGeminiCookieKey && geminiKeyPreview && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            현재 Gemini API 키: <code className="font-mono">{geminiKeyPreview}</code>
          </div>
        )}
        {hasGeminiEnvKey && !hasGeminiCookieKey && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            환경변수(GEMINI_API_KEY)로 설정된 키가 사용 중입니다.
          </div>
        )}

        <GeminiKeyForm hasCurrentKey={hasGeminiCookieKey} />

        <details className="text-sm text-slate-600">
          <summary className="cursor-pointer font-medium hover:text-slate-900 select-none">
            Gemini API 키 발급 방법 보기
          </summary>
          <ol className="mt-3 space-y-2 list-decimal list-inside text-slate-600">
            <li>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Google AI Studio
              </a>
              에 Google 계정으로 로그인
            </li>
            <li>&quot;Create API key&quot; 버튼 클릭</li>
            <li>생성된 API 키(AIza...로 시작) 복사</li>
            <li>위 입력창에 붙여넣기 후 저장</li>
          </ol>
        </details>
      </div>

      {/* ② KIPRIS API 키 */}
      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">KIPRIS Plus Open API 키</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              한국 특허청(KIPO) 공식 특허 검색 API입니다.
            </p>
          </div>
          {hasCookieKey ? (
            <span className="badge-green">✓ 설정됨</span>
          ) : hasEnvKey ? (
            <span className="badge-blue">환경변수 사용 중</span>
          ) : (
            <span className="badge-yellow">⚠ 미설정</span>
          )}
        </div>

        {!hasCookieKey && !hasEnvKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">API 키를 입력해야 특허 검색이 가능합니다</p>
            <p>
              KIPRIS Plus API 키는{" "}
              <a href="https://plus.kipris.or.kr" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                plus.kipris.or.kr
              </a>{" "}
              에서 무료로 신청할 수 있습니다. 승인까지 1~2 영업일 소요됩니다.
            </p>
          </div>
        )}

        {hasCookieKey && keyPreview && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            현재 API 키: <code className="font-mono">{keyPreview}</code>
          </div>
        )}
        {hasEnvKey && !hasCookieKey && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            환경변수(KIPRIS_API_KEY)로 설정된 키가 사용 중입니다.
          </div>
        )}

        <ApiKeyForm hasCurrentKey={hasCookieKey} />

        <details className="text-sm text-slate-600">
          <summary className="cursor-pointer font-medium hover:text-slate-900 select-none">
            KIPRIS API 키 발급 방법 보기
          </summary>
          <ol className="mt-3 space-y-2 list-decimal list-inside text-slate-600">
            <li>
              <a href="https://plus.kipris.or.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
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
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-3">환경변수로 영구 설정 (선택)</h2>
        <p className="text-sm text-slate-600 mb-3">
          Vercel 대시보드에서 설정하면 쿠키 없이도 항상 동작합니다.
        </p>
        <div className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs font-mono space-y-1">
          <p className="text-slate-400"># Vercel Dashboard → Settings → Environment Variables</p>
          <p>KIPRIS_API_KEY=<span className="text-yellow-300">여기에_KIPRIS_키_입력</span></p>
          <p>GEMINI_API_KEY=<span className="text-yellow-300">여기에_Gemini_키_입력</span></p>
        </div>
      </div>
    </div>
  );
}
