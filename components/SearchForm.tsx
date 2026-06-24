"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchFormProps {
  compact?: boolean;
}

export default function SearchForm({ compact }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "w-full" : "max-w-xl mx-auto"}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="출원인명 입력 (예: 삼성전자, 카카오)"
            className="w-full pl-10 pr-4 py-3 bg-white/8 border border-white/15
                       rounded-xl text-sm text-white placeholder:text-white/30
                       focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50
                       transition-all"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-3 text-sm font-semibold
                     bg-teal-500 hover:bg-teal-600 text-white rounded-xl
                     shadow-lg shadow-teal-500/20 transition-all duration-200"
        >
          <Search className="w-4 h-4" />
          {!compact && "검색"}
        </button>
      </div>
      {!compact && (
        <p className="text-xs text-white/30 mt-2 text-left">
          KIPRIS Plus Open API를 통해 한국 특허청(KIPO) 공식 데이터를 조회합니다.
        </p>
      )}
    </form>
  );
}
