import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "한국 특허 플랫폼 — 검색 · 분석 · 도면 생성",
  description:
    "KIPRIS API 기반 한국 특허 검색·상세·인용 분석 + KIPO 규격 도면(플로우차트·블록도·상태도·그래프·공정도) 자동 생성",
  keywords: ["한국 특허", "KIPRIS", "특허 도면", "KIPO", "특허 검색", "변리사"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white mt-8">
          <div className="container mx-auto px-4 py-4 max-w-6xl">
            <p className="text-center text-xs text-slate-500">
              한국 특허 플랫폼 v2.0 · SpeciAI ·{" "}
              <a
                href="https://discord.gg/3gYGuMcqgb"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                디스코드 커뮤니티
              </a>{" "}
              · KIPRIS Plus Open API 기반 · KIPO 규격 준수
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
