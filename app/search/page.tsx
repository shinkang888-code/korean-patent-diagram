import { Suspense } from "react";
import { Search, ChevronLeft, ChevronRight, AlertCircle, FileSearch } from "lucide-react";
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
      <div className="glass p-8 text-center rounded-2xl">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400/70" />
        <p className="text-red-400 font-medium">{errorMsg}</p>
        <p className="text-sm text-white/30 mt-2">
          KIPRIS_API_KEY 환경변수가 설정됐는지 확인하세요.
        </p>
      </div>
    );
  }

  if (!result || result.patents.length === 0) {
    return (
      <div className="glass p-12 text-center rounded-2xl">
        <FileSearch className="w-10 h-10 mx-auto mb-3 text-white/15" />
        <p className="text-white/50">&ldquo;{q}&rdquo;에 대한 검색 결과가 없습니다.</p>
        <p className="text-xs text-white/25 mt-2">출원인명이나 키워드를 다시 확인해보세요.</p>
      </div>
    );
  }

  const statusFilters = [
    { value: "", label: "전체" },
    { value: "R", label: "등록" },
    { value: "A", label: "공개" },
    { value: "J", label: "거절" },
  ];

  return (
    <div className="space-y-4">
      {/* 결과 헤더 + 필터 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-white/50">
          총 <strong className="text-white font-semibold">{result.total_count.toLocaleString()}건</strong> 중{" "}
          <span className="text-white/70">{result.patents.length}건 표시</span>
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-white/30">상태 필터:</span>
          {statusFilters.map(({ value, label }) => (
            <Link
              key={value}
              href={`/search?q=${encodeURIComponent(q)}&status=${value}`}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                status === value
                  ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/10"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* 특허 목록 */}
      <div className="space-y-2">
        {result.patents.map((patent) => (
          <Link
            key={patent.application_number}
            href={`/patent/${patent.application_number}`}
            className="group glass glass-hover flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white/90 group-hover:text-white transition-colors leading-snug mb-2 line-clamp-2 sm:truncate">
                {patent.title ?? "(제목 없음)"}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs text-white/40">
                  출원번호: <span className="text-white/60 font-mono">{patent.application_number}</span>
                </span>
                <span className="text-white/15 hidden sm:inline">·</span>
                <span className="text-xs text-white/40">
                  출원인: <span className="text-white/60">{patent.applicant ?? "-"}</span>
                </span>
                <span className="text-white/15 hidden sm:inline">·</span>
                <span className="text-xs text-white/40">
                  출원일: <span className="text-white/60">{patent.application_date ?? "-"}</span>
                </span>
                {patent.registration_number && (
                  <span className="text-xs text-teal-500/60">
                    등록: {patent.registration_number}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <PatentStatusBadge status={patent.registration_status} />
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-2 pt-4">
        {page > 1 && (
          <Link
            href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}&status=${status}`}
            className="flex items-center gap-1.5 px-4 py-2 glass glass-hover text-sm text-white/70 hover:text-white rounded-xl"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </Link>
        )}
        <span className="text-sm text-white/40 px-4 py-2 glass rounded-xl">
          페이지 {page}
        </span>
        {result.has_more && (
          <Link
            href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}&status=${status}`}
            className="flex items-center gap-1.5 px-4 py-2 glass glass-hover text-sm text-white/70 hover:text-white rounded-xl"
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
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">

        {/* 헤더 */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">특허 검색</h1>
          <p className="text-sm text-white/40">KIPRIS Plus API 기반 한국 특허 실시간 검색</p>
        </div>

        {/* 검색폼 */}
        <div className="glass p-2 rounded-2xl">
          <SearchForm />
        </div>

        {/* 검색 결과 */}
        {q ? (
          <Suspense
            fallback={
              <div className="glass p-12 text-center rounded-2xl">
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-white/40">검색 중...</p>
              </div>
            }
          >
            <SearchResults q={q} page={page} status={status} />
          </Suspense>
        ) : (
          <div className="glass p-12 text-center rounded-2xl">
            <Search className="w-12 h-12 mx-auto mb-4 text-white/10" />
            <p className="text-white/40 mb-2">출원인명 또는 키워드를 입력하고 검색하세요.</p>
            <p className="text-xs text-white/25">예: 삼성전자, LG전자, 현대차</p>
          </div>
        )}
      </div>
    </div>
  );
}
