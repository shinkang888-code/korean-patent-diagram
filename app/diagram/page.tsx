import { Suspense } from "react";
import { FileImage } from "lucide-react";
import DiagramGenerator from "@/components/DiagramGenerator";

interface PageProps {
  searchParams: Promise<{ content?: string; appNum?: string; type?: string }>;
}

export default async function DiagramPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-5xl space-y-6">

        {/* 헤더 */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
              <FileImage className="w-5 h-5 text-teal-400" />
            </div>
            KIPO 도면 생성기
          </h1>
          <p className="text-sm text-white/40 ml-12 sm:ml-11">
            특허 명세서·청구항을 입력하면 KIPO 규격(300DPI, 흑백, A4)의 도면을 자동 생성합니다.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="glass p-12 text-center rounded-2xl">
              <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-white/40">로딩 중...</p>
            </div>
          }
        >
          <DiagramGenerator
            initialContent={params.content}
            initialType={params.type}
            applicationNumber={params.appNum}
          />
        </Suspense>
      </div>
    </div>
  );
}
