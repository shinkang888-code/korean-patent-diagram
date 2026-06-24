"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, FileImage, Clock, Settings, Bot, Shield, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useState } from "react";

const NAV = [
  { href: "/search", label: "특허검색", icon: Search },
  { href: "/writer", label: "명세서작성기", icon: Bot },
  { href: "/diagram", label: "도면생성기", icon: FileImage },
  { href: "/history", label: "이력", icon: Clock },
  { href: "/settings", label: "설정", icon: Settings },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0F172A]/80 border-b border-white/10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">

          {/* 로고 */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-teal-500/50 transition-all">
              <Image
                src="/logo.png"
                alt="Lpatent"
                fill
                sizes="36px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Lpatent
            </span>
          </Link>

          {/* 데스크탑 내비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-teal-400 bg-teal-500/10"
                      : "text-white/60 hover:text-white/90 hover:bg-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-teal-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 우측 버튼들 */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold
                         border border-teal-500/50 text-teal-400
                         rounded-lg hover:bg-teal-500/10 transition-all duration-200"
            >
              로그인
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold
                         bg-gold-500 text-white rounded-lg
                         hover:bg-gold-400 transition-all duration-200
                         shadow-sm shadow-gold-500/30"
            >
              <Shield className="w-3.5 h-3.5" />
              관리자
            </Link>
          </div>

          {/* 모바일 햄버거 */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg
                       text-white/70 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴 열기/닫기"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 드롭다운 */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0F172A]/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-4 max-w-7xl space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-teal-500/15 text-teal-400 border border-teal-500/20"
                      : "text-white/60 hover:text-white/90 hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
            <div className="flex gap-2 pt-2 border-t border-white/10 mt-2">
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-semibold
                           border border-teal-500/50 text-teal-400 rounded-xl
                           hover:bg-teal-500/10 transition-all"
              >
                로그인
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold
                           bg-gold-500 text-white rounded-xl hover:bg-gold-400 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                관리자
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
