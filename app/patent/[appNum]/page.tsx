import { ArrowLeft, ExternalLink, FileImage } from "lucide-react";
import Link from "next/link";
import PatentStatusBadge from "@/components/PatentStatusBadge";
import type { Patent, CitingPatent } from "@/lib/kipris";

interface PageProps {
  params: Promise<{ appNum: string }>;
}

async function fetchPatent(appNum: string): Promise<Patent | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/patents/detail?appNum=${appNum}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchCiting(appNum: string): Promise<CitingPatent[]> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/patents/citing?appNum=${appNum}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.citing_patents ?? [];
  } catch {
    return [];
  }
}

export default async function PatentDetailPage({ params }: PageProps) {
  const { appNum } = await params;
  const [patent, citing] = await Promise.all([fetchPatent(appNum), fetchCiting(appNum)]);

  if (!patent) {
    return (
      <div className="space-y-4">
        <Link href="/search" className="btn-secondary w-fit">
          <ArrowLeft className="w-4 h-4" />
          검색으로
        </Link>
        <div className="card p-8 text-center text-slate-500">
          특허 정보를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  const infoRows = [
    ["출원번호", patent.application_number],
    ["출원일", patent.application_date],
    ["출원인", patent.applicant],
    ["등록번호", patent.registration_number],
    ["등록일", patent.registration_date],
    ["공개번호", patent.opening_number],
    ["공개일", patent.opening_date],
    ["IPC 분류", patent.ipc_number],
  ].filter(([, v]) => v);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/search" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Link>
      </div>

      {/* 특허 기본 정보 */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-slate-900 leading-snug">
            {patent.title ?? "(제목 없음)"}
          </h1>
          <PatentStatusBadge status={patent.registration_status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {infoRows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500 font-medium">{label}</dt>
              <dd className="text-sm text-slate-900 mt-0.5">{value ?? "-"}</dd>
            </div>
          ))}
        </div>
      </div>

      {/* 초록 */}
      {patent.abstract && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-3">초록</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{patent.abstract}</p>
        </div>
      )}

      {/* 도면 생성 버튼 */}
      <div className="card p-5 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">이 특허로 도면 생성</h3>
            <p className="text-sm text-blue-700 mt-0.5">
              특허 내용을 기반으로 KIPO 규격 도면을 자동 생성합니다.
            </p>
          </div>
          <Link
            href={`/diagram?content=${encodeURIComponent(
              [patent.title, patent.abstract].filter(Boolean).join("\n\n")
            )}&appNum=${appNum}`}
            className="btn-primary"
          >
            <FileImage className="w-4 h-4" />
            도면 생성
          </Link>
        </div>
      </div>

      {/* 인용 특허 */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 mb-4">
          인용 특허{" "}
          <span className="text-slate-400 font-normal text-sm">({citing.length}건)</span>
        </h2>

        {citing.length === 0 ? (
          <p className="text-sm text-slate-500">이 특허를 인용한 후행 특허가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {citing.slice(0, 10).map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div>
                  <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {c.citing_application_number}
                  </code>
                  {c.status_name && (
                    <span className="ml-2 text-xs text-slate-500">{c.status_name}</span>
                  )}
                  {c.citation_type_name && (
                    <span className="ml-2 text-xs text-slate-400">({c.citation_type_name})</span>
                  )}
                </div>
                {c.citing_application_number && (
                  <Link
                    href={`/patent/${c.citing_application_number}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            ))}
            {citing.length > 10 && (
              <p className="text-xs text-slate-400 pt-2">+{citing.length - 10}건 더...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
