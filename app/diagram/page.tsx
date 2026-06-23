import { Suspense } from "react";
import DiagramGenerator from "@/components/DiagramGenerator";

interface PageProps {
  searchParams: Promise<{ content?: string; appNum?: string; type?: string }>;
}

export default async function DiagramPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">특허 도면 생성기</h1>
        <p className="text-slate-600 mt-1 text-sm">
          특허 명세서·청구항을 입력하면 KIPO 규격(300DPI, 흑백, A4)의 도면을 자동 생성합니다.
        </p>
      </div>
      <Suspense fallback={<div className="card p-8 text-center text-slate-400">로딩 중...</div>}>
        <DiagramGenerator
          initialContent={params.content}
          initialType={params.type}
          applicationNumber={params.appNum}
        />
      </Suspense>
    </div>
  );
}
