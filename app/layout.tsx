import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

const BASE_URL = "https://kpatent.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Lpatent — AI 특허 플랫폼 | LONEX PATENTLAB",
    template: "%s | Lpatent",
  },
  description:
    "KIPRIS API 기반 한국 특허 검색·상세·인용 분석 + Gemini AI 명세서 자동 작성 + KIPO 규격 도면(플로우차트·블록도·상태도·그래프·공정도) 자동 생성 — LONEX PATENTLAB",
  keywords: ["한국 특허", "KIPRIS", "특허 도면", "KIPO", "특허 검색", "변리사", "AI 명세서", "Lpatent", "LONEX"],
  authors: [{ name: "LONEX LAB", url: "https://lawygo.co.kr" }],
  creator: "LONEX LAB",
  publisher: "LONEX PATENTLAB",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "Lpatent by LONEX PATENTLAB",
    title: "Lpatent — AI 특허 플랫폼 | LONEX PATENTLAB",
    description:
      "특허 검색부터 AI 명세서 자동 작성, KIPO 규격 도면까지. LONEX PATENTLAB의 원스톱 특허 플랫폼.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lpatent — LONEX PATENTLAB AI 특허 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lpatent — AI 특허 플랫폼 | LONEX PATENTLAB",
    description: "특허 검색부터 AI 명세서 자동 작성, KIPO 규격 도면까지.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
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
        <footer className="border-t border-white/8 bg-[#0A0F1E]">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              {/* 브랜드 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base font-bold text-white">Lpatent</span>
                  <span className="text-xs text-white/30 font-medium border border-white/10 px-1.5 py-0.5 rounded">v2.0</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  LONEX PATENTLAB의 AI 특허 플랫폼.<br />
                  특허 검색 · 명세서 작성 · 도면 생성
                </p>
              </div>
              {/* 서비스 링크 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">서비스</h4>
                <ul className="space-y-1.5 text-xs text-white/40">
                  <li><a href="/search" className="hover:text-teal-400 transition-colors">특허 검색</a></li>
                  <li><a href="/writer" className="hover:text-teal-400 transition-colors">명세서 작성기</a></li>
                  <li><a href="/diagram" className="hover:text-teal-400 transition-colors">도면 생성기</a></li>
                  <li><a href="/history" className="hover:text-teal-400 transition-colors">이력</a></li>
                </ul>
              </div>
              {/* 회사 정보 */}
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">LONEX LAB</h4>
                <ul className="space-y-1.5 text-xs text-white/40">
                  <li>
                    <a
                      href="https://lawygo.co.kr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-teal-400 transition-colors"
                    >
                      lawygo.co.kr
                    </a>
                  </li>
                  <li><a href="/settings" className="hover:text-teal-400 transition-colors">API 설정</a></li>
                  <li><a href="/admin" className="hover:text-teal-400 transition-colors">관리자 콘솔</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-white/25">
                © 2025 LONEX PATENTLAB · KIPRIS Plus Open API 기반 · KIPO 규격 준수
              </p>
              <a
                href="https://lawygo.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-teal-500/60 hover:text-teal-400 transition-colors"
              >
                LONEX LAB →
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
