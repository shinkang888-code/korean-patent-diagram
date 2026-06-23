"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="출원인명 입력 (예: 삼성전자, 카카오)"
            className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button type="submit" className="btn-primary px-6 py-3">
          검색
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-2 text-left">
        KIPRIS Plus Open API를 통해 한국 특허청(KIPO) 공식 데이터를 조회합니다.
      </p>
    </form>
  );
}
