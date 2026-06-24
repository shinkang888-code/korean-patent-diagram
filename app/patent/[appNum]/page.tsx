import { ArrowLeft, ExternalLink, FileImage, Hash, Calendar, User, Shield, BookOpen, Link2 } from "lucide-react";
import Link from "next/link";
import PatentStatusBadge from "@/components/PatentStatusBadge";
import { getPatentDetail, getCitingPatents, type Patent, type CitingPatent } from "@/lib/kipris";

interface PageProps {
  params: Promise<{ appNum: string }>;
}

export default async function PatentDetailPage({ params }: PageProps) {
  const { appNum } = await params;

  let patent: Patent | null = null;
  let citing: CitingPatent[] = [];

  try {
    [patent, citing] = await Promise.all([
      getPatentDetail(appNum).catch(() => null),
      getCitingPatents(appNum).catch(() => []),
    ]);
  } catch {
    // 무시
  }

  if (!patent) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          <Link href="/search" className="inline-flex items-center gap-1.5 px-4 py-2 glass glass-hover text-sm text-white/70 hover:text-white rounded-xl w-fit">
            <ArrowLeft className="w-4 h-4" />
            검색으로 돌아가기
          </Link>
          <div className="glass p-12 text-center rounded-2xl">
            <Shield className="w-10 h-10 mx-auto mb-3 text-white/15" />
            <p className="text-white/50 font-medium">특허 정보를 불러올 수 없습니다.</p>
            <p className="text-xs text-white/30 mt-2">
              출원번호: <code className="font-mono text-white/50">{appNum}</code>
            </p>
            <p className="text-xs text-white/25 mt-1">KIPRIS_API_KEY 환경변수를 확인하세요.</p>
          </div>
        </div>
      </div>
    );
  }

  const infoRows: { icon: React.ElementType; label: string; value: string | null | undefined }[] = [
    { icon: Hash, label: "출원번호", value: patent.application_number },
    { icon: Calendar, label: "출원일", value: patent.application_date },
    { icon: User, label: "출원인", value: patent.applicant },
    { icon: Hash, label: "등록번호", value: patent.registration_number },
    { icon: Calendar, label: "등록일", value: patent.registration_date },
    { icon: Hash, label: "공개번호", value: patent.opening_number },
    { icon: Calendar, label: "공개일", value: patent.opening_date },
    { icon: BookOpen, label: "IPC 분류", value: patent.ipc_number },
  ].filter(r => r.value);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-5">

        {/* 뒤로가기 */}
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 px-4 py-2 glass glass-hover
                     text-sm text-white/60 hover:text-white rounded-xl w-fit transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          검색으로 돌아가기
        </Link>

        {/* 특허 헤더 카드 */}
        <div className="glass p-5 sm:p-7 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug flex-1">
              {patent.title ?? "(제목 없음)"}
            </h1>
            <PatentStatusBadge status={patent.registration_status} />
          </div>

          {/* 정보 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {infoRows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/3 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3 h-3 text-teal-500/70" />
                  <dt className="text-xs text-white/40 font-medium">{label}</dt>
                </div>
                <dd className="text-sm text-white/80 font-mono break-all">{value ?? "-"}</dd>
              </div>
            ))}
          </div>
        </div>

        {/* 초록 */}
        {patent.abstract && (
          <div className="glass p-5 sm:p-7 rounded-2xl">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-400" />
              초록 (Abstract)
            </h2>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">{patent.abstract}</p>
          </div>
        )}

        {/* 도면 생성 CTA */}
        <div className="glass p-5 rounded-2xl border border-teal-500/20 bg-teal-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-white flex items-center gap-2 mb-1">
                <FileImage className="w-4 h-4 text-teal-400" />
                이 특허로 KIPO 규격 도면 생성
              </h3>
              <p className="text-sm text-white/50">
                특허 내용을 기반으로 300DPI 흑백 도면을 자동 생성합니다.
              </p>
            </div>
            <Link
              href={`/diagram?content=${encodeURIComponent(
                [patent.title, patent.abstract].filter(Boolean).join("\n\n")
              )}&appNum=${appNum}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white
                         text-sm font-semibold rounded-xl shadow-lg shadow-teal-500/20 transition-all shrink-0"
            >
              <FileImage className="w-4 h-4" />
              도면 생성
            </Link>
          </div>
        </div>

        {/* 인용 특허 */}
        <div className="glass p-5 sm:p-7 rounded-2xl">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-teal-400" />
            인용 특허
            <span className="badge-teal ml-1">{citing.length}건</span>
          </h2>

          {citing.length === 0 ? (
            <p className="text-sm text-white/30 py-4 text-center">이 특허를 인용한 후행 특허가 없습니다.</p>
          ) : (
            <div className="space-y-0 divide-y divide-white/5">
              {citing.slice(0, 10).map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0
                             hover:bg-white/3 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-lg font-mono text-white/70">
                      {c.citing_application_number}
                    </code>
                    {c.status_name && (
                      <span className="text-xs text-white/40">{c.status_name}</span>
                    )}
                    {c.citation_type_name && (
                      <span className="text-xs text-white/25">({c.citation_type_name})</span>
                    )}
                  </div>
                  {c.citing_application_number && (
                    <Link
                      href={`/patent/${c.citing_application_number}`}
                      className="flex items-center gap-1 text-xs text-teal-400/70 hover:text-teal-400 transition-colors ml-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ))}
              {citing.length > 10 && (
                <p className="text-xs text-white/30 pt-3 text-center">
                  +{citing.length - 10}건 더 있습니다
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
