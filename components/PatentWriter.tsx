"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Send, Loader2, Bot, User, FileText, Copy, Check, Download,
  ChevronDown, Trash2, RotateCcw, Maximize2, Minimize2,
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Minus, Type,
} from "lucide-react";
import { cn } from "@/lib/cn";

/* ─── 타입 ─── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

type DownloadFormat = "docx" | "hwpx" | "html" | "md" | "txt";

const FORMAT_LABELS: Record<DownloadFormat, { label: string; sub: string; color: string }> = {
  docx: { label: "Word (.docx)", sub: "Microsoft Word 형식", color: "text-blue-400" },
  hwpx: { label: "한글 (.hwpx)", sub: "한컴 한글 형식", color: "text-teal-400" },
  html: { label: "HTML (.html)", sub: "웹 브라우저 형식", color: "text-orange-400" },
  md:   { label: "Markdown (.md)", sub: "마크다운 텍스트", color: "text-purple-400" },
  txt:  { label: "텍스트 (.txt)", sub: "순수 텍스트", color: "text-white/60" },
};

/* ─── 단락 스타일 ─── */
const PARA_STYLES = [
  { tag: "p",  label: "본문",      class: "" },
  { tag: "h1", label: "특허명칭",  class: "font-bold text-xl" },
  { tag: "h2", label: "발명의 설명", class: "font-bold text-lg" },
  { tag: "h3", label: "청구항",    class: "font-semibold text-base" },
  { tag: "h4", label: "요약",      class: "font-semibold" },
];

/* ─── 예시 프롬프트 ─── */
const EXAMPLE_PROMPTS = [
  "스마트폰 카메라로 문서를 자동 스캔하고 OCR 처리하는 방법의 특허 명세서를 작성해줘",
  "AI 기반 실시간 번역 이어폰 시스템의 특허 청구항을 작성해줘",
  "자율주행 차량의 충돌 회피 알고리즘 특허 명세서를 작성해줘",
  "블록체인을 이용한 디지털 저작권 관리 시스템 특허를 작성해줘",
];

/* ─── Markdown → HTML 변환 ─── */
function markdownToEditorHtml(md: string): string {
  return md
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^(\d+)\. (.+)$/gm, "<li data-ol='1'>$2</li>")
    .replace(/(<li data-ol='1'>.*<\/li>\n?)+/g, (m) => `<ol>${m.replace(/ data-ol='1'/g, "")}</ol>`)
    .split("\n\n")
    .map((block) =>
      block.startsWith("<h") || block.startsWith("<ul") || block.startsWith("<ol") || block.startsWith("<hr")
        ? block
        : `<p>${block.replace(/\n/g, "<br>")}</p>`
    )
    .join("\n");
}

/* ─── 툴바 버튼 컴포넌트 ─── */
function ToolbarBtn({
  icon: Icon, label, cmd, value, active = false, disabled = false
}: {
  icon?: React.ElementType; label: string; cmd: string; value?: string;
  active?: boolean; disabled?: boolean;
}) {
  const exec = () => { if (!disabled) document.execCommand(cmd, false, value); };
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); exec(); }}
      title={label}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center w-7 h-7 rounded-md text-xs font-medium transition-all",
        active
          ? "bg-teal-500/30 text-teal-300 border border-teal-500/40"
          : "text-white/50 hover:text-white/90 hover:bg-white/10",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {Icon ? <Icon className="w-3.5 h-3.5" /> : label}
    </button>
  );
}

/* ─── AI 프로바이더 설정 ─── */
type AIProvider = "auto" | "gpt" | "gemini" | "deepseek";

const PROVIDERS: { value: AIProvider; label: string; color: string; badge: string }[] = [
  { value: "auto",     label: "Auto (자동)",        color: "text-teal-400",   badge: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  { value: "gpt",      label: "GPT-4o mini",        color: "text-green-400",  badge: "bg-green-500/20 text-green-300 border-green-500/30" },
  { value: "gemini",   label: "Gemini 2.0 Flash",   color: "text-blue-400",   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "deepseek", label: "DeepSeek",           color: "text-purple-400", badge: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
];

/* ─── 메인 컴포넌트 ─── */
interface PatentWriterProps {
  geminiApiKey?: string;
}

export default function PatentWriter({ geminiApiKey }: PatentWriterProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null);
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [rightExpanded, setRightExpanded] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [paraStyle, setParaStyle] = useState("p");
  const [fontSize, setFontSize] = useState("3");
  const [provider, setProvider] = useState<AIProvider>("auto");
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [usedProvider, setUsedProvider] = useState<string>("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const providerMenuRef = useRef<HTMLDivElement>(null);

  /* 스크롤 */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* 메뉴 외부 클릭 닫기 */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadMenuOpen(false);
      }
      if (providerMenuRef.current && !providerMenuRef.current.contains(e.target as Node)) {
        setProviderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* 글자 수 업데이트 */
  const updateStats = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText ?? "";
    setCharCount(text.length);
    setWordCount(text.split(/\s+/).filter(Boolean).length);
    setLineCount(text.split("\n").length);
  }, []);

  /* AI 메시지 전송 */
  const sendMessage = useCallback(async (userInput: string) => {
    const trimmed = userInput.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "응답 오류");

      const responseData = data as { text: string; provider?: string };
      if (responseData.provider) setUsedProvider(responseData.provider);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseData.text,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      /* 에디터에 HTML 삽입 */
      if (editorRef.current) {
        editorRef.current.innerHTML = markdownToEditorHtml((data as { text: string }).text);
        updateStats();
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `오류가 발생했습니다: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
        createdAt: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, geminiApiKey, updateStats]);

  /* 에디터 내용 가져오기 (HTML) */
  const getEditorContent = useCallback(() => editorRef.current?.innerHTML ?? "", []);

  /* 복사 */
  const handleCopy = async () => {
    const text = editorRef.current?.innerText ?? "";
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* 다운로드 */
  const handleDownload = async (format: DownloadFormat) => {
    const content = getEditorContent();
    if (!content.trim()) return;
    setDownloading(format);
    setDownloadMenuOpen(false);

    try {
      if (format === "docx") {
        const { downloadAsDocx } = await import("@/lib/exportDoc");
        await downloadAsDocx(content, "특허명세서");
      } else if (format === "hwpx") {
        const { downloadAsHwpx } = await import("@/lib/exportDoc");
        await downloadAsHwpx(content, "특허명세서");
      } else if (format === "html") {
        const { downloadAsHtml } = await import("@/lib/exportDoc");
        downloadAsHtml(content, "특허명세서");
      } else if (format === "md") {
        const { downloadAsMarkdown } = await import("@/lib/exportDoc");
        downloadAsMarkdown(content, "특허명세서");
      } else if (format === "txt") {
        const { downloadAsTxt } = await import("@/lib/exportDoc");
        downloadAsTxt(content, "특허명세서");
      }
    } finally {
      setDownloading(null);
    }
  };

  /* 단락 스타일 적용 */
  const applyParaStyle = (tag: string) => {
    setParaStyle(tag);
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
  };

  /* 마지막 AI 응답 가져오기 */
  const useLastResponse = () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last && editorRef.current) {
      editorRef.current.innerHTML = markdownToEditorHtml(last.content);
      updateStats();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  const hasContent = charCount > 0;

  return (
    <div
      className={cn(
        "flex border border-white/10 rounded-2xl overflow-hidden bg-[#0F172A]",
        "h-full min-h-[600px]"
      )}
      style={{ flexDirection: "row" }}
    >

      {/* ════════════════════════════════════════
          왼쪽: Gemini 대화창
      ════════════════════════════════════════ */}
      {!rightExpanded && (
        <div
          className={cn(
            "flex flex-col min-h-0 border-r border-white/10 transition-all",
            leftExpanded ? "w-full" : "w-[46%]"
          )}
        >
          {/* 채팅 헤더 */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white/90">특허 AI 어시스턴트</p>
                <p className="text-xs text-white/40">
                  {usedProvider ? `마지막 응답: ${usedProvider}` : "특허 명세서 작성 전문 AI"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* 모델 선택 드롭다운 */}
              <div className="relative" ref={providerMenuRef}>
                <button
                  onClick={() => setProviderMenuOpen(!providerMenuOpen)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all",
                    PROVIDERS.find(p => p.value === provider)?.badge ?? "",
                    "hover:opacity-80"
                  )}
                >
                  <span>{PROVIDERS.find(p => p.value === provider)?.label}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {providerMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-[#1A2540] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {PROVIDERS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => { setProvider(p.value); setProviderMenuOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-xs transition-all hover:bg-white/8",
                          provider === p.value ? "bg-white/5" : ""
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", p.value === "auto" ? "bg-teal-400" : p.value === "gpt" ? "bg-green-400" : p.value === "gemini" ? "bg-blue-400" : "bg-purple-400")} />
                        <span className={provider === p.value ? p.color : "text-white/60"}>{p.label}</span>
                        {provider === p.value && <Check className="w-3 h-3 ml-auto text-white/40" />}
                      </button>
                    ))}
                    <div className="px-3 py-2 border-t border-white/8 text-[10px] text-white/30">
                      Auto: GPT → Gemini → DeepSeek 순 자동 선택
                    </div>
                  </div>
                )}
              </div>

              {messages.length > 0 && (
                <button onClick={() => { setMessages([]); setUsedProvider(""); }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all"
                  title="대화 초기화">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => { setLeftExpanded(!leftExpanded); setRightExpanded(false); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all"
              >
                {leftExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A0F1E]/40">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center mb-4">
                  <Bot className="w-7 h-7 text-teal-400" />
                </div>
                <h3 className="font-semibold text-white/80 mb-2">특허 명세서 작성 AI</h3>
                <p className="text-xs text-white/40 max-w-xs mb-5 leading-relaxed">
                  발명 아이디어를 입력하면 특허 명세서, 청구항, 기술적 구성을 전문가 수준으로 작성해드립니다.
                </p>
                <div className="w-full space-y-1.5">
                  <p className="text-xs text-white/25 mb-2">예시 질문</p>
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => void sendMessage(prompt)}
                      className="w-full text-left px-3 py-2 text-xs text-white/50 bg-white/3 border border-white/8
                                 rounded-xl hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-white/70 transition-all leading-relaxed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="shrink-0 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[82%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed",
                    msg.role === "user"
                      ? "bg-teal-600 text-white rounded-tr-sm"
                      : "bg-white/5 border border-white/10 text-white/80 rounded-tl-sm"
                  )}>
                    <div className="whitespace-pre-wrap">{msg.content.slice(0, 300)}{msg.content.length > 300 ? "..." : ""}</div>
                    <div className={cn("text-xs mt-1 opacity-60", msg.role === "user" ? "text-right" : "")}>
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-0.5">
                      <User className="w-3.5 h-3.5 text-white/60" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-2">
                <div className="shrink-0 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 150, 300].map((d) => (
                      <div key={d} className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 입력창 */}
          <div className="shrink-0 p-3 border-t border-white/8 bg-[#0A0F1E]/40">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
                }}
                placeholder="발명 내용을 입력하세요... (Enter: 전송 / Shift+Enter: 줄바꿈)"
                rows={3}
                disabled={loading}
                className="flex-1 px-3 py-2.5 text-xs border border-white/10 bg-white/5 rounded-xl resize-none
                           text-white/80 placeholder:text-white/25
                           focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/40 outline-none transition-all"
              />
              <button
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || loading}
                className={cn(
                  "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  input.trim() && !loading
                    ? "bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                )}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          오른쪽: HWP 스타일 리치 에디터
      ════════════════════════════════════════ */}
      {!leftExpanded && (
        <div className={cn("flex flex-col min-h-0 transition-all", rightExpanded ? "w-full" : "flex-1")}>

          {/* ── 편집기 헤더 (타이틀바) ── */}
          <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/8 bg-[#1E293B]/80">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-bold text-white/90">명세서 편집기</span>
              {hasContent && (
                <span className="text-xs text-white/30 hidden sm:inline">
                  {charCount.toLocaleString()}자 · {lineCount}줄
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {messages.some((m) => m.role === "assistant") && (
                <button onClick={useLastResponse}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/8 rounded-lg transition-all">
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">최신 응답</span>
                </button>
              )}
              <button onClick={handleCopy} disabled={!hasContent}
                className={cn(
                  "flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg transition-all",
                  hasContent ? "text-white/50 hover:text-white/80 hover:bg-white/8" : "text-white/20 cursor-not-allowed"
                )}>
                {copied ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "복사됨" : "복사"}
              </button>

              {/* 다운로드 드롭다운 */}
              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                  disabled={!hasContent || downloading !== null}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-semibold transition-all",
                    hasContent && !downloading
                      ? "bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20"
                      : "bg-white/5 text-white/25 cursor-not-allowed"
                  )}>
                  {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {downloading ? "처리중..." : "다운로드"}
                  {!downloading && <ChevronDown className="w-2.5 h-2.5" />}
                </button>

                {downloadMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-[#1E293B] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {(Object.entries(FORMAT_LABELS) as [DownloadFormat, typeof FORMAT_LABELS[DownloadFormat]][]).map(([fmt, info]) => (
                      <button
                        key={fmt}
                        onClick={() => void handleDownload(fmt)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/8 transition-colors border-b border-white/5 last:border-0"
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", info.color.replace("text-", "bg-"))} />
                        <div className="text-left">
                          <div className={cn("font-medium text-xs", info.color)}>{info.label}</div>
                          <div className="text-xs text-white/30">{info.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => { setRightExpanded(!rightExpanded); setLeftExpanded(false); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all">
                {rightExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* ── HWP 스타일 툴바 ── */}
          <div className="shrink-0 border-b border-white/8 bg-[#1A2540] px-2 py-1.5">
            {/* 툴바 행 1: 단락 스타일 + 폰트 크기 + 기본 서식 */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* 단락 스타일 */}
              <select
                value={paraStyle}
                onChange={(e) => applyParaStyle(e.target.value)}
                className="h-7 px-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white/70
                           focus:outline-none focus:ring-1 focus:ring-teal-500/40 mr-1"
              >
                {PARA_STYLES.map((s) => (
                  <option key={s.tag} value={s.tag} style={{ background: "#1e293b" }}>
                    {s.label}
                  </option>
                ))}
              </select>

              {/* 폰트 크기 */}
              <div className="flex items-center gap-0.5 mr-1">
                <Type className="w-3 h-3 text-white/30" />
                <select
                  value={fontSize}
                  onChange={(e) => { setFontSize(e.target.value); document.execCommand("fontSize", false, e.target.value); }}
                  className="h-7 px-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/70
                             focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                >
                  {["1","2","3","4","5","6","7"].map((s) => (
                    <option key={s} value={s} style={{ background: "#1e293b" }}>
                      {["8","10","12","14","18","24","36"][+s-1]}pt
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              {/* 텍스트 서식 */}
              <ToolbarBtn icon={Bold} label="굵게 (Ctrl+B)" cmd="bold" />
              <ToolbarBtn icon={Italic} label="기울임 (Ctrl+I)" cmd="italic" />
              <ToolbarBtn icon={Underline} label="밑줄 (Ctrl+U)" cmd="underline" />
              <ToolbarBtn icon={Strikethrough} label="취소선" cmd="strikeThrough" />

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              {/* 정렬 */}
              <ToolbarBtn icon={AlignLeft} label="왼쪽 정렬" cmd="justifyLeft" />
              <ToolbarBtn icon={AlignCenter} label="가운데 정렬" cmd="justifyCenter" />
              <ToolbarBtn icon={AlignRight} label="오른쪽 정렬" cmd="justifyRight" />
              <ToolbarBtn icon={AlignJustify} label="양쪽 정렬" cmd="justifyFull" />

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              {/* 목록 */}
              <ToolbarBtn icon={List} label="글머리 목록" cmd="insertUnorderedList" />
              <ToolbarBtn icon={ListOrdered} label="번호 목록" cmd="insertOrderedList" />
              <ToolbarBtn icon={Minus} label="가로 구분선" cmd="insertHorizontalRule" />

              <div className="w-px h-5 bg-white/10 mx-0.5" />

              {/* 특허 전용 삽입 버튼 */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand("insertText", false, "【청구항 1】");
                }}
                title="청구항 마커 삽입"
                className="flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium text-white/50
                           hover:text-white/90 hover:bg-white/10 border border-white/10 transition-all"
              >
                청구항
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand("insertText", false, "【발명의 설명】");
                }}
                title="발명의 설명 마커 삽입"
                className="flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium text-white/50
                           hover:text-white/90 hover:bg-white/10 border border-white/10 transition-all"
              >
                발명설명
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand("insertText", false, "【요약서】");
                }}
                title="요약서 마커 삽입"
                className="flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium text-white/50
                           hover:text-white/90 hover:bg-white/10 border border-white/10 transition-all"
              >
                요약
              </button>
            </div>
          </div>

          {/* ── 에디터 본문 (A4 paper 스타일) ── */}
          <div className="flex-1 overflow-y-auto bg-[#1C2438] flex justify-center py-6 px-4">
            {/* A4 종이 시뮬레이션 */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={updateStats}
              data-placeholder="AI가 생성한 특허 명세서가 여기에 표시됩니다.&#10;&#10;왼쪽 채팅창에서 발명 내용을 입력하면 자동으로 채워집니다.&#10;직접 편집도 가능하며, 한글편집기처럼 서식 버튼을 사용할 수 있습니다.&#10;&#10;편집 후 Word · HWPX · HTML · Markdown · TXT 파일로 다운로드하세요."
              className={cn(
                "w-full max-w-3xl bg-white text-gray-900 shadow-2xl",
                "min-h-[800px] px-16 py-14 outline-none focus:outline-none",
                "text-sm leading-8 rounded-sm",
                "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-gray-900 [&_h1]:border-b [&_h1]:border-gray-200 [&_h1]:pb-2",
                "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-gray-800",
                "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-gray-800",
                "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1 [&_h4]:text-gray-700",
                "[&_p]:mb-3 [&_p]:text-justify",
                "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3",
                "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3",
                "[&_li]:mb-1",
                "[&_hr]:border-gray-300 [&_hr]:my-4",
                "[&_strong]:font-bold",
                "[&_em]:italic",
              )}
              style={{
                fontFamily: "'맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
                fontSize: "11pt",
              }}
            />
          </div>

          {/* ── 상태바 ── */}
          <div className="shrink-0 px-4 py-1.5 border-t border-white/8 bg-[#0F172A]/60
                          flex items-center justify-between text-xs text-white/25">
            <span>직접 편집 · 서식 툴바 지원 · 다운로드 5종</span>
            <span>{charCount.toLocaleString()}자 · {wordCount.toLocaleString()}단어 · {lineCount}줄</span>
          </div>
        </div>
      )}
    </div>
  );
}
