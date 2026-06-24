import { Search, FileImage, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getRecentDiagrams, getRecentSearches } from "@/lib/db";

const DIAGRAM_LABELS: Record<string, string> = {
  flowchart: "플로우차트",
  block: "블록도",
  state: "상태도",
  graph: "그래프",
  process: "공정도",
};

export default async function HistoryPage() {
  const [diagrams, searches] = await Promise.all([
    getRecentDiagrams(20).catch(() => []),
    getRecentSearches(10).catch(() => []),
  ]);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/20
                          flex items-center justify-center">
            <Clock className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">이력</h1>
            <p className="text-xs text-white/40 mt-0.5">최근 검색 및 도면 생성 기록</p>
          </div>
        </div>

        {/* 최근 검색 섹션 */}
        <section className="glass p-6">
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-400" />
            최근 검색
            {searches.length > 0 && (
              <span className="badge-teal ml-auto">{searches.length}건</span>
            )}
          </h2>

          {searches.length === 0 ? (
            <div className="text-center py-10">
              <Search className="w-8 h-8 mx-auto mb-3 text-white/15" />
              <p className="text-sm text-white/30">검색 이력이 없습니다.</p>
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2
                           bg-teal-500/15 border border-teal-500/30 text-teal-400
                           text-sm font-medium rounded-lg hover:bg-teal-500/20 transition-all"
              >
                지금 검색하기
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(searches as Array<{ query: string; result_count: number }>).map((s) => (
                <Link
                  key={s.query}
                  href={`/search?q=${encodeURIComponent(s.query)}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2
                             bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                             rounded-full text-sm text-white/70 hover:text-white/90 transition-all"
                >
                  <Search className="w-3 h-3 text-white/30" />
                  {s.query}
                  <span className="text-xs text-white/30">
                    {s.result_count?.toLocaleString()}건
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 생성된 도면 섹션 */}
        <section className="glass p-6">
          <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
            <FileImage className="w-4 h-4 text-teal-400" />
            생성된 도면
            {diagrams.length > 0 && (
              <span className="badge-teal ml-auto">{diagrams.length}건</span>
            )}
          </h2>

          {diagrams.length === 0 ? (
            <div className="text-center py-10">
              <FileImage className="w-8 h-8 mx-auto mb-3 text-white/15" />
              <p className="text-sm text-white/30">생성된 도면이 없습니다.</p>
              <Link
                href="/diagram"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2
                           bg-teal-500/15 border border-teal-500/30 text-teal-400
                           text-sm font-medium rounded-lg hover:bg-teal-500/20 transition-all"
              >
                도면 생성하기
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {(
                diagrams as Array<{
                  id: number;
                  diagram_type: string;
                  application_number: string | null;
                  filing_type: string;
                  content_preview: string | null;
                  created_at: string;
                }>
              ).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0
                             hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/20
                                    flex items-center justify-center shrink-0 mt-0.5">
                      <FileImage className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-teal">
                          {DIAGRAM_LABELS[d.diagram_type] ?? d.diagram_type}
                        </span>
                        {d.application_number && (
                          <Link
                            href={`/patent/${d.application_number}`}
                            className="text-xs text-teal-400 hover:text-teal-300 hover:underline transition-colors"
                          >
                            {d.application_number}
                          </Link>
                        )}
                      </div>
                      {d.content_preview && (
                        <p className="text-xs text-white/40 truncate max-w-sm">
                          {d.content_preview}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4 space-y-1">
                    <span className="badge-gray">{d.filing_type === "K" ? "국내" : "PCT"}</span>
                    <p className="text-xs text-white/30 block">
                      {new Date(d.created_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
