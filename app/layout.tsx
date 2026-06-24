import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Lpatent — 특허 검색 · AI 명세서 · KIPO 도면",
  description:
    "KIPRIS API 기반 한국 특허 검색·상세·인용 분석 + AI 명세서 자동 작성 + KIPO 규격 도면(플로우차트·블록도·상태도·그래프·공정도) 자동 생성",
  keywords: ["한국 특허", "KIPRIS", "특허 도면", "KIPO", "특허 검색", "변리사", "AI 명세서"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-[#0F172A] text-white/90">
        <NavBar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-white/8 bg-[#0F172A]">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/70">Lpatent</span>
                <span className="text-white/20">·</span>
                <span className="text-xs text-white/40">v2.0</span>
              </div>
              <p className="text-xs text-white/40 text-center">
                KIPRIS Plus Open API 기반 &middot; KIPO 규격 준수 &middot;{" "}
                <a
                  href="https://discord.gg/3gYGuMcqgb"
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  디스코드 커뮤니티
                </a>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
