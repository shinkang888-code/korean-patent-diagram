import { Search, Sparkles, Download, ArrowRight, CheckCircle2, Settings, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import SearchForm from "@/components/SearchForm";
import { getRecentSearches } from "@/lib/db";
import { hasApiKey } from "@/lib/kipris";

export default async function HomePage() {
  const recentSearches = await getRecentSearches(8).catch(() => []);
  const apiKeyReady = await hasApiKey().catch(() => false);

  return (
    <div className="flex flex-col">

      {/* ──────────────────────────────────────────────────────────
          API 키 미설정 배너
      ────────────────────────────────────────────────────────── */}
      {!apiKeyReady && (
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300 flex-1">
              <span className="font-semibold">KIPRIS API 키가 미설정 상태입니다.</span>{" "}
              API 키를 입력해야 특허 검색이 가능합니다.
            </p>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors shrink-0"
            >
              <Settings className="w-3 h-3" />
              설정하기
            </Link>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          히어로 섹션
      ────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[88vh] flex items-center justify-center overflow-hidden
                   bg-[url('/hero-bg.png')] bg-cover bg-center"
      >
        {/* 다크 오버레이 + 그라데이션 */}
        <div className="absolute inset-0 bg-[#0F172A]/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F172A]" />

        {/* 배경 장식 원 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gold-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 max-w-5xl text-center">

          {/* 서브 레이블 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-teal-500/15 border border-teal-500/30 text-teal-300
                          text-xs font-semibold tracking-wider uppercase mb-6 animate-fade-in">
            <Sparkles className="w-3 h-3" />
            KIPRIS API + AI + KIPO 규격 도면
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-5 animate-slide-up">
            혁신을{" "}
            <span className="bg-gradient-to-r from-teal-400 to-teal-500 bg-clip-text text-transparent">
              지식재산
            </span>
            으로
          </h1>

          {/* 서브타이틀 */}
          <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up">
            Lpatent — KIPRIS 기반 특허 검색부터 AI 명세서 자동 작성,
            <br className="hidden sm:block" />
            KIPO 규격 도면 생성까지 원스톱으로 해결합니다
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 animate-fade-in">
            <Link
              href="/search"
              className="flex items-center gap-2 px-7 py-3.5 text-base font-semibold
                         bg-teal-500 hover:bg-teal-600 text-white rounded-xl
                         shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40
                         transition-all duration-200"
            >
              <Search className="w-4 h-4" />
              특허 검색 시작
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/writer"
              className="flex items-center gap-2 px-7 py-3.5 text-base font-semibold
                         border border-white/25 text-white/90 rounded-xl
                         hover:bg-white/8 hover:border-white/40
                         transition-all duration-200"
            >
              명세서 작성기
            </Link>
          </div>

          {/* 히어로 내 검색 바 */}
          <div className="max-w-2xl mx-auto">
            <div className="glass p-1.5 rounded-2xl">
              <SearchForm compact />
            </div>
          </div>

          {/* 최근 검색 태그 */}
          {recentSearches.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-white/30">최근 검색:</span>
              {(recentSearches as Array<{ query: string; result_count: number }>).slice(0, 5).map((s) => (
                <Link
                  key={s.query}
                  href={`/search?q=${encodeURIComponent(s.query)}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full
                             bg-white/5 hover:bg-white/10 border border-white/10
                             text-xs text-white/50 hover:text-white/70 transition-all"
                >
                  {s.query}
                  <span className="text-white/25">{s.result_count?.toLocaleString()}건</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          통계 바
      ────────────────────────────────────────────────────────── */}
      <section className="bg-[#1E293B]/60 border-y border-white/8">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="grid grid-cols-3 gap-4 divide-x divide-white/10">
            {[
              { value: "100만+", label: "특허 데이터" },
              { value: "AI", label: "명세서 자동생성" },
              { value: "300DPI", label: "KIPO 규격 도면" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center px-4">
                <div className="text-2xl sm:text-3xl font-bold text-gradient-teal mb-1">{value}</div>
                <div className="text-xs text-white/40 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          기능 카드 섹션
      ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">

          {/* 섹션 헤더 */}
          <div className="text-center mb-14">
            <div className="section-label mb-4">핵심 기능</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              특허 업무의 모든 것을
              <br />
              <span className="text-gradient-teal">하나의 플랫폼</span>에서
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              검색부터 명세서 작성, 도면 생성까지 — 특허 출원의 전 과정을 AI로 간소화합니다
            </p>
          </div>

          {/* 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                href: "/search",
                image: "/feature-search.png",
                badge: "실시간 검색",
                title: "KIPRIS 특허 검색",
                desc: "출원인명·키워드로 한국 특허 실시간 검색. 등록·공개·거절 필터와 상세 인용 분석 제공.",
                cta: "검색하기",
                color: "teal",
              },
              {
                href: "/writer",
                image: "/feature-writer.png",
                badge: "AI 자동화",
                title: "AI 명세서 작성기",
                desc: "Gemini AI와 대화하듯 특허 명세서를 자동 완성. Word / HWPX 포맷으로 즉시 다운로드.",
                cta: "작성하기",
                color: "gold",
              },
              {
                href: "/diagram",
                image: "/feature-diagram.png",
                badge: "KIPO 규격",
                title: "KIPO 도면 생성기",
                desc: "명세서 입력 → 플로우차트·블록도·상태도 자동 감지 → 300DPI 흑백 PNG 즉시 생성.",
                cta: "생성하기",
                color: "teal",
              },
            ].map(({ href, image, badge, title, desc, cta, color }) => (
              <Link
                key={href}
                href={href}
                className="group glass glass-hover flex flex-col overflow-hidden"
              >
                {/* 이미지 영역 */}
                <div className="relative h-44 bg-navy-800 overflow-hidden rounded-xl m-3 mb-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B]/80 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className={`badge ${color === "gold" ? "badge-gold" : "badge-teal"}`}>
                      {badge}
                    </span>
                  </div>
                </div>

                {/* 텍스트 영역 */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed flex-1">{desc}</p>
                  <div className={`mt-4 flex items-center gap-1 text-sm font-semibold ${color === "gold" ? "text-gold-400" : "text-teal-400"} group-hover:gap-2 transition-all`}>
                    {cta}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          How It Works 섹션
      ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#1E293B]/40 border-y border-white/8">
        <div className="container mx-auto max-w-5xl">

          <div className="text-center mb-14">
            <div className="section-label mb-4">이용 방법</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              3단계로 완성하는
              <br />
              <span className="text-gradient-teal">특허 명세서</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Sparkles,
                title: "발명 아이디어 입력",
                desc: "발명의 핵심 아이디어와 기술적 특징을 자연어로 입력하세요. AI가 자동으로 구조화합니다.",
              },
              {
                step: "02",
                icon: Search,
                title: "AI가 명세서 자동 완성",
                desc: "Gemini AI가 청구항·발명의 설명·요약서를 KIPO 양식에 맞게 자동으로 작성합니다.",
              },
              {
                step: "03",
                icon: Download,
                title: "Word/HWPX/도면 다운로드",
                desc: "완성된 명세서를 Word, HWPX 포맷으로 즉시 다운로드하고, KIPO 규격 도면도 함께 받으세요.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                {/* 스텝 숫자 + 아이콘 */}
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600
                                  flex items-center justify-center shadow-lg shadow-teal-500/25">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0F172A] border border-teal-500/50
                                   flex items-center justify-center text-xs font-bold text-teal-400">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>

                {/* 연결선 (마지막 제외) */}
                {step !== "03" && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px -translate-x-1/2
                                  bg-gradient-to-r from-teal-500/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          지원 도면 유형 (다크 버전)
      ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <div className="section-label mb-4">지원 도면</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">5가지 KIPO 규격 도면 자동 생성</h2>
          </div>

          <div className="glass overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-5 py-3.5 font-semibold text-white/60 text-xs uppercase tracking-wider">유형</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-white/60 text-xs uppercase tracking-wider">적합한 특허</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-white/60 text-xs uppercase tracking-wider">규격</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["플로우차트", "SW·방법·알고리즘 특허", "A4 세로"],
                  ["블록도", "전자·통신·시스템 특허", "A4 가로"],
                  ["상태도", "제어·프로토콜·UI 특허", "A4 세로"],
                  ["그래프", "성능 비교·실험 결과", "A5 가로"],
                  ["공정도", "제조·화학·생산 공정", "A4 세로"],
                ].map(([type, desc, spec]) => (
                  <tr
                    key={type}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="badge-teal">{type}</span>
                    </td>
                    <td className="px-5 py-3.5 text-white/60">{desc}</td>
                    <td className="px-5 py-3.5 text-white/40">{spec} · 300DPI · 흑백</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          CTA 배너
      ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-3xl overflow-hidden
                          bg-gradient-to-br from-teal-600/40 via-teal-500/20 to-[#1E293B]
                          border border-teal-500/20 p-12 text-center">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-500/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-5">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                <span className="text-sm font-semibold text-teal-300">무료로 시작하세요</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                지금 무료로 시작하세요
              </h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                회원가입 없이 바로 사용 가능합니다. KIPRIS API 키만 있으면 모든 기능을 무료로 이용하세요.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/search"
                  className="flex items-center gap-2 px-7 py-3.5 text-base font-semibold
                             bg-teal-500 hover:bg-teal-600 text-white rounded-xl
                             shadow-lg shadow-teal-500/25 transition-all"
                >
                  <Search className="w-4 h-4" />
                  특허 검색 시작
                </Link>
                <Link
                  href="/writer"
                  className="flex items-center gap-2 px-7 py-3.5 text-base font-semibold
                             border border-white/20 text-white/80 rounded-xl
                             hover:bg-white/5 transition-all"
                >
                  명세서 작성하기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
