import { Suspense } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import PatentStatusBadge from "@/components/PatentStatusBadge";
import { searchPatentsByApplicant, type SearchResult } from "@/lib/kipris";
import { logSearch } from "@/lib/db";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}

async function SearchResults({ q, page, status }: { q: string; page: number; status: string }) {
  let result: SearchResult | null = null;
  let errorMsg: string | null = null;

  try {
    result = await searchPatentsByApplicant(q, page, 20, status);
    await logSearch(q, result.total_count).catch(() => {});
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "검색 실패";
  }

  if (errorMsg) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600 font-medium">{errorMsg}</p>
        <p className="text-sm text-slate-500 mt-2">
          KIPRIS_API_KEY 환경변수가 설정됐는지 확인하세요.
        </p>
      </div>
    );
  }

  if (!result || result.patents.length === 0) {
    return (
      <div className="card p-8 text-center text-slate-500">
        <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>&ldquo;{q}&rdquo;에 대한 검색 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        총 <strong className="text-slate-900">{result.total_count.toLocaleString()}건</strong> 중{" "}
        {result.patents.length}건 표시
      </p>

      {result.patents.map((patent) => (
        <Link
          key={patent.application_number}
          href={`/patent/${patent.application_number}`}
          className="card p-4 block hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {patent.title ?? "(제목 없음)"}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">출원번호: {patent.application_number}</span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-500">출원인: {patent.applicant ?? "-"}</span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-500">출원일: {patent.application_date ?? "-"}</span>
              </div>
              {patent.registration_number && (
                <p className="text-xs text-slate-400 mt-1">
                  등록번호: {patent.registration_number} ({patent.registration_date})
                </p>
              )}
            </div>
            <PatentStatusBadge status={patent.registration_status} />
          </div>
        </Link>
      ))}

      <div className="flex items-center justify-center gap-2 pt-4">
        {page > 1 && (
          <Link
            href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}&status=${status}`}
            className="btn-secondary"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </Link>
        )}
        <span className="text-sm text-slate-600 px-4">페이지 {page}</span>
        {result.has_more && (
          <Link
            href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}&status=${status}`}
            className="btn-secondary"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const page = parseInt(params.page ?? "1", 10);
  const status = params.status ?? "";

  return (
    <div className="space-y-6">
      <div className="pt-4">
        <SearchForm />
      </div>

      {q ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">상태 필터:</span>
            {[
              { value: "", label: "전체" },
              { value: "R", label: "등록" },
              { value: "A", label: "공개" },
              { value: "J", label: "거절" },
            ].map(({ value, label }) => (
              <Link
                key={value}
                href={`/search?q=${encodeURIComponent(q)}&status=${value}`}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  status === value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          <Suspense
            fallback={
              <div className="card p-8 text-center text-slate-400">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                검색 중...
              </div>
            }
          >
            <SearchResults q={q} page={page} status={status} />
          </Suspense>
        </>
      ) : (
        <div className="card p-8 text-center text-slate-500">
          출원인명을 입력하고 검색하세요.
        </div>
      )}
    </div>
  );
}
