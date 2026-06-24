import { Shield, Users, FileText, BarChart2, Settings, AlertTriangle, Search, FileImage } from "lucide-react";

const STAT_CARDS = [
  {
    icon: Search,
    label: "총 검색수",
    value: "--",
    subtext: "전체 기간",
    color: "teal",
  },
  {
    icon: FileText,
    label: "생성된 명세서",
    value: "--",
    subtext: "전체 기간",
    color: "gold",
  },
  {
    icon: FileImage,
    label: "도면 생성수",
    value: "--",
    subtext: "전체 기간",
    color: "teal",
  },
  {
    icon: Users,
    label: "활성 사용자",
    value: "--",
    subtext: "최근 30일",
    color: "gold",
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl space-y-8">

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30
                            flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">관리자 콘솔</h1>
              <p className="text-xs text-white/40 mt-0.5">Lpatent Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20">
            <Settings className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-xs font-semibold text-gold-400">관리자 전용</span>
          </div>
        </div>

        {/* 준비중 안내 배너 */}
        <div className="glass border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-0.5">
              이 페이지는 관리자 전용입니다
            </p>
            <p className="text-xs text-amber-400/70">
              로그인 기능은 준비 중입니다. 현재 모든 데이터는 플레이스홀더입니다.
            </p>
          </div>
        </div>

        {/* 통계 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ icon: Icon, label, value, subtext, color }) => (
            <div key={label} className="glass p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/50">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                  ${color === "gold"
                    ? "bg-gold-500/15 border border-gold-500/20"
                    : "bg-teal-500/15 border border-teal-500/20"}`}>
                  <Icon className={`w-4 h-4 ${color === "gold" ? "text-gold-400" : "text-teal-400"}`} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white/30">{value}</div>
                <div className="text-xs text-white/30 mt-1">{subtext}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 최근 활동 섹션 (플레이스홀더) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 최근 검색 */}
          <div className="glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-teal-400" />
              <h2 className="font-semibold text-white">최근 검색 로그</h2>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-white/5 rounded w-1/6 animate-pulse" />
                </div>
              ))}
            </div>
            <p className="text-xs text-white/20 mt-4 text-center">로그인 후 확인 가능합니다</p>
          </div>

          {/* 시스템 상태 */}
          <div className="glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-gold-400" />
              <h2 className="font-semibold text-white">시스템 상태</h2>
            </div>
            <div className="space-y-3">
              {[
                { name: "KIPRIS API", status: "점검 필요" },
                { name: "Gemini AI", status: "준비중" },
                { name: "Neon DB", status: "준비중" },
                { name: "이미지 생성", status: "준비중" },
              ].map(({ name, status }) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-white/60">{name}</span>
                  <span className="badge badge-gray">{status}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/20 mt-4 text-center">로그인 후 실시간 상태 확인 가능</p>
          </div>
        </div>

      </div>
    </div>
  );
}
