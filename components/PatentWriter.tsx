"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  FileText,
  Copy,
  Check,
  Download,
  ChevronDown,
  FileDown,
  Trash2,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const EXAMPLE_PROMPTS = [
  "스마트폰 카메라로 문서를 자동 스캔하고 OCR 처리하는 방법의 특허 명세서를 작성해줘",
  "AI 기반 실시간 번역 이어폰 시스템의 특허 청구항을 작성해줘",
  "자율주행 차량의 충돌 회피 알고리즘 특허 명세서를 작성해줘",
  "블록체인을 이용한 디지털 저작권 관리 시스템 특허를 작성해줘",
];

interface PatentWriterProps {
  geminiApiKey?: string;
}

export default function PatentWriter({ geminiApiKey }: PatentWriterProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState<"docx" | "hwpx" | null>(null);
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [rightExpanded, setRightExpanded] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sendMessage = useCallback(
    async (userInput: string) => {
      const trimmed = userInput.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            apiKey: geminiApiKey,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error((data as { error?: string }).error ?? "응답 오류");
        }

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: (data as { text: string }).text,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setEditorContent((data as { text: string }).text);
      } catch (err) {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `오류가 발생했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, geminiApiKey]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleCopy = async () => {
    if (!editorContent.trim()) return;
    await navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDocx = async () => {
    if (!editorContent.trim()) return;
    setDownloading("docx");
    setDownloadMenuOpen(false);
    try {
      const { downloadAsDocx } = await import("@/lib/exportDoc");
      await downloadAsDocx(editorContent, "특허명세서");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadHwpx = async () => {
    if (!editorContent.trim()) return;
    setDownloading("hwpx");
    setDownloadMenuOpen(false);
    try {
      const { downloadAsHwpx } = await import("@/lib/exportDoc");
      await downloadAsHwpx(editorContent, "특허명세서");
    } finally {
      setDownloading(null);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  const useLastResponse = () => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) setEditorContent(lastAssistant.content);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex h-full min-h-[600px] border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* ===== 왼쪽: Gemini 대화창 ===== */}
      {!rightExpanded && (
        <div
          className={cn(
            "flex flex-col min-h-0 bg-white transition-all",
            leftExpanded ? "w-full" : "w-1/2 border-r border-slate-200"
          )}
        >
          {/* 채팅 헤더 */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Gemini 특허 AI</p>
                <p className="text-xs text-slate-500">특허 명세서 작성 전문 AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                  title="대화 초기화"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => { setLeftExpanded(!leftExpanded); setRightExpanded(false); }}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                title={leftExpanded ? "패널 축소" : "패널 확장"}
              >
                {leftExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 채팅 메시지 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                  <Bot className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">특허 명세서 작성 AI</h3>
                <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">
                  발명 아이디어를 입력하면 특허 명세서, 청구항, 기술적 구성을 전문가 수준으로 작성해드립니다.
                </p>
                <div className="w-full space-y-2">
                  <p className="text-xs font-medium text-slate-400 mb-2">예시 질문</p>
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => void sendMessage(prompt)}
                      className="w-full text-left px-3 py-2.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors leading-relaxed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className={cn("text-xs mt-1.5", msg.role === "user" ? "text-blue-200 text-right" : "text-slate-400")}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center mt-0.5">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-2.5">
                <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="shrink-0 p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="발명 내용을 입력하세요... (Enter: 전송 / Shift+Enter: 줄바꿈)"
                rows={3}
                className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none bg-white leading-relaxed"
                disabled={loading}
              />
              <button
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || loading}
                className={cn(
                  "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  input.trim() && !loading
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 오른쪽: 편집기 패널 ===== */}
      {!leftExpanded && (
        <div
          className={cn(
            "flex flex-col min-h-0 bg-white transition-all",
            rightExpanded ? "w-full" : "w-1/2"
          )}
        >
          {/* 편집기 헤더 */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-slate-800">명세서 편집기</span>
              {editorContent && (
                <span className="text-xs text-slate-400">{editorContent.length.toLocaleString()}자</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {messages.some((m) => m.role === "assistant") && (
                <button
                  onClick={useLastResponse}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  title="마지막 AI 응답 가져오기"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">최신 응답</span>
                </button>
              )}
              <button
                onClick={handleCopy}
                disabled={!editorContent.trim()}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-colors",
                  editorContent.trim() ? "text-slate-600 hover:bg-slate-200" : "text-slate-300 cursor-not-allowed"
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "복사됨" : "복사"}
              </button>

              {/* 다운로드 드롭다운 */}
              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                  disabled={!editorContent.trim() || downloading !== null}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors font-medium",
                    editorContent.trim() && downloading === null
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {downloading ? "처리 중..." : "다운로드"}
                  {!downloading && <ChevronDown className="w-3 h-3" />}
                </button>

                {downloadMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <button
                      onClick={handleDownloadDocx}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Word (.docx)</div>
                        <div className="text-xs text-slate-500">Microsoft Word 형식</div>
                      </div>
                    </button>
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={handleDownloadHwpx}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileDown className="w-4 h-4 text-emerald-600" />
                      <div className="text-left">
                        <div className="font-medium">한글 (.hwpx)</div>
                        <div className="text-xs text-slate-500">한컴 한글 형식</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => { setRightExpanded(!rightExpanded); setLeftExpanded(false); }}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                title={rightExpanded ? "패널 축소" : "패널 확장"}
              >
                {rightExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 편집기 본문 */}
          <div className="flex-1 relative">
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder={`AI가 생성한 특허 명세서가 여기에 표시됩니다.\n\n왼쪽 채팅창에서 발명 내용을 입력하면 자동으로 채워집니다.\n직접 편집도 가능합니다.\n\n편집 후 Word(.docx) 또는 한글(.hwpx) 파일로 다운로드하세요.`}
              className="absolute inset-0 w-full h-full px-5 py-4 text-sm text-slate-800 bg-white resize-none outline-none leading-relaxed font-mono border-0 focus:ring-0"
            />
          </div>

          {/* 편집기 하단 */}
          {editorContent && (
            <div className="shrink-0 px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
              <span>직접 편집 가능 · 편집 후 다운로드</span>
              <span>{editorContent.split("\n").length}줄 · {editorContent.length.toLocaleString()}자</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
