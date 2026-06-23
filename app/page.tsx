import { Search, FileImage, Zap, Database, BookOpen, Settings, AlertTriangle } from "lucide-react";
import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import { getRecentSearches } from "@/lib/db";
import { hasApiKey } from "@/lib/kipris";

export default async function HomePage() {
  const recentSearches = await getRecentSearches(8).catch(() => []);
  const apiKeyReady = await hasApiKey().catch(() => false);

  return (
    <div className="space-y-8">
      {/* API 키 미설정 배너 */}
      {!apiKeyReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-900 text-sm">KIPRIS API 키가 설정되지 않았습니다</p>
            <p className="text-amber-700 text-sm mt-0.5">
              API 키를 입력해야 특허 검색이 가능합니다. 신청 승인 후 아래에서 입력하세요.
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

      {/* 히어로 섹션 */}
      <section className="text-center py-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
          <Zap className="w-3.5 h-3.5" />
          KIPRIS API + KIPO 규격 도면 생성
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
          한국 특허 검색 & 도면 플랫폼
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto mb-8">
          출원인명으로 특허를 검색하고, 명세서를 입력하면 KIPO 규격의 도면(플로우차트·블록도·상태도·그래프·공정도)을 자동 생성합니다.
        </p>

        {/* 검색 폼 */}
        <SearchForm />
      </section>

      {/* 기능 카드 */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Search,
            title: "KIPRIS 특허 검색",
            desc: "출원인명으로 한국 특허 실시간 검색. 등록·공개·거절 필터.",
            color: "blue",
          },
          {
            icon: FileImage,
            title: "KIPO 도면 생성",
            desc: "명세서 붙여넣기 → 도면 유형 자동 감지 → 300DPI 흑백 PNG",
            color: "emerald",
          },
          {
            icon: Database,
            title: "이력 저장",
            desc: "검색 이력과 생성된 도면을 Neon DB에 저장·관리",
            color: "purple",
          },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="card p-5">
            <div
              className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center mb-3`}
            >
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-600">{desc}</p>
          </div>
        ))}
      </section>

      {/* 최근 검색 */}
      {recentSearches.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            최근 검색
          </h2>
          <div className="flex flex-wrap gap-2">
            {(recentSearches as Array<{ query: string; result_count: number }>).map((s) => (
              <a
                key={s.query}
                href={`/search?q=${encodeURIComponent(s.query)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 
                           rounded-full text-sm text-slate-700 transition-colors"
              >
                {s.query}
                <span className="text-xs text-slate-400">{s.result_count?.toLocaleString()}건</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 도면 유형 안내 */}
      <section className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">지원 도면 유형</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 font-medium text-slate-700">유형</th>
                <th className="text-left py-2 pr-4 font-medium text-slate-700">적합한 특허</th>
                <th className="text-left py-2 font-medium text-slate-700">규격</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ["플로우차트", "SW·방법·알고리즘 특허", "A4 세로"],
                ["블록도", "전자·통신·시스템 특허", "A4 가로"],
                ["상태도", "제어·프로토콜·UI 특허", "A4 세로"],
                ["그래프", "성능 비교·실험 결과", "A5 가로"],
                ["공정도", "제조·화학·생산 공정", "A4 세로"],
              ].map(([type, desc, spec]) => (
                <tr key={type} className="hover:bg-slate-50">
                  <td className="py-2 pr-4 font-medium text-blue-700">{type}</td>
                  <td className="py-2 pr-4 text-slate-600">{desc}</td>
                  <td className="py-2 text-slate-500">{spec} · 300DPI · 흑백</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
