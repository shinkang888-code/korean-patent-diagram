import { Search, FileImage } from "lucide-react";
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">이력</h1>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-500" />
          최근 검색
        </h2>
        {searches.length === 0 ? (
          <p className="text-sm text-slate-500">검색 이력이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(searches as Array<{ query: string; result_count: number }>).map((s) => (
              <Link
                key={s.query}
                href={`/search?q=${encodeURIComponent(s.query)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200
                           rounded-full text-sm text-slate-700 transition-colors"
              >
                {s.query}
                <span className="text-xs text-slate-400">{s.result_count?.toLocaleString()}건</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileImage className="w-4 h-4 text-slate-500" />
          생성된 도면
        </h2>
        {diagrams.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileImage className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">생성된 도면이 없습니다.</p>
            <Link href="/diagram" className="btn-primary mt-3 text-xs inline-flex">
              도면 생성하기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
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
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="badge-blue">
                    {DIAGRAM_LABELS[d.diagram_type] ?? d.diagram_type}
                  </span>
                  <div>
                    {d.application_number && (
                      <Link
                        href={`/patent/${d.application_number}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {d.application_number}
                      </Link>
                    )}
                    {d.content_preview && (
                      <p className="text-xs text-slate-500 truncate max-w-xs">
                        {d.content_preview}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge-gray">{d.filing_type === "K" ? "국내" : "PCT"}</span>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(d.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
