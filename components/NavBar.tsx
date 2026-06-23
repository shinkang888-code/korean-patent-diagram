"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, FileImage, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "특허 검색", icon: Search },
  { href: "/diagram", label: "도면 생성", icon: FileImage },
  { href: "/history", label: "이력", icon: Clock },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-14">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 font-bold text-blue-700">
            <BookOpen className="w-5 h-5" />
            <span className="hidden sm:inline">한국 특허 플랫폼</span>
            <span className="sm:hidden">특허 플랫폼</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
