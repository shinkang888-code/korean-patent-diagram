"use client";

import { useState } from "react";
import { Eye, EyeOff, Key, Trash2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ApiKeyFormProps {
  hasCurrentKey: boolean;
}

export default function ApiKeyForm({ hasCurrentKey }: ApiKeyFormProps) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings/apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장 실패");
      }

      setStatus("success");
      setApiKey("");
      setTimeout(() => {
        setStatus("idle");
        router.refresh();
      }, 1500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    }
  }

  async function handleDelete() {
    if (!confirm("저장된 API 키를 삭제하시겠습니까?")) return;
    setStatus("saving");

    try {
      await fetch("/api/settings/apikey", { method: "DELETE" });
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMsg("삭제 중 오류가 발생했습니다.");
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">
        API 키 입력
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="KIPRIS API 키를 붙여넣으세요"
            className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={!apiKey.trim() || status === "saving"}
          className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === "saving" ? "저장 중..." : "저장"}
        </button>

        {hasCurrentKey && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={status === "saving"}
            className="px-3 py-2.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            title="API 키 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {status === "success" && (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" />
          API 키가 저장되었습니다. 이제 특허 검색이 가능합니다.
        </p>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <p className="text-xs text-slate-400">
        키는 브라우저 쿠키에 저장되며, 이 기기에서만 유효합니다.
      </p>
    </form>
  );
}
