"use client";
import { useState, useRef, useCallback } from "react";
import {
  FileImage,
  Download,
  Save,
  Loader2,
  CheckCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { cn } from "@/lib/cn";

type DiagramType = "flowchart" | "block" | "state" | "graph" | "process";
type FilingType = "K" | "P";

const DIAGRAM_TYPES: { value: DiagramType; label: string; desc: string }[] = [
  { value: "flowchart", label: "플로우차트", desc: "SW·방법·알고리즘" },
  { value: "block", label: "블록도", desc: "전자·통신·시스템" },
  { value: "state", label: "상태도", desc: "제어·프로토콜·UI" },
  { value: "graph", label: "그래프", desc: "성능 비교·실험" },
  { value: "process", label: "공정도", desc: "제조·화학·생산" },
];

const PLACEHOLDER = `예시:
사용자 인증 방법:
1. 사용자가 식별 정보를 입력한다
2. 시스템이 유효성을 검사한다
3. 생체 인증을 수행한다
4. 인증 토큰을 발급한다
5. 접근을 허용한다
검사 실패 시 재입력 요청, 생체 인증 불일치 시 인증 실패 처리.`;

interface Props {
  initialContent?: string;
  initialType?: string;
  applicationNumber?: string;
}

export default function DiagramGenerator({ initialContent, initialType, applicationNumber }: Props) {
  const [content, setContent] = useState(initialContent ?? "");
  const [diagramType, setDiagramType] = useState<DiagramType | "auto">(
    (initialType as DiagramType) ?? "auto"
  );
  const [filingType, setFilingType] = useState<FilingType>("K");
  const [diagramNo, setDiagramNo] = useState("도 1");
  const [loading, setLoading] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<DiagramType | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/diagrams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          type: diagramType === "auto" ? undefined : diagramType,
          filingType,
          diagramNo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");

      setSvg(data.svg);
      setDetectedType(data.type);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setLoading(false);
    }
  }, [content, diagramType, filingType, diagramNo]);

  const handleDownload = useCallback(() => {
    if (!svg || !svgRef.current) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${detectedType ?? "diagram"}_01.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [svg, detectedType]);

  const handleSave = useCallback(async () => {
    if (!svg) return;
    try {
      const res = await fetch("/api/diagrams/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationNumber,
          diagramType: detectedType,
          patentContent: content,
          svgContent: svg,
          filingType,
        }),
      });
      if (res.ok) setSaved(true);
    } catch {
      //
    }
  }, [svg, detectedType, content, filingType, applicationNumber]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* ── 입력 패널 ── */}
      <div className="space-y-4">
        <div className="glass p-5 rounded-2xl space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <FileImage className="w-4 h-4 text-teal-400" />
            특허 내용 입력
          </h2>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={9}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                       text-sm text-white/85 placeholder:text-white/20 resize-none font-mono
                       focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40
                       transition-all"
          />

          {/* 도면 유형 선택 */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">도면 유형</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setDiagramType("auto")}
                className={cn(
                  "col-span-3 sm:col-span-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                  diagramType === "auto"
                    ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/80"
                )}
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                자동 감지
              </button>
              {DIAGRAM_TYPES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setDiagramType(value)}
                  title={desc}
                  className={cn(
                    "px-2 py-2 rounded-xl text-xs font-medium border transition-all",
                    diagramType === value
                      ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20"
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 설정 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">출원 유형</label>
              <select
                value={filingType}
                onChange={(e) => setFilingType(e.target.value as FilingType)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl
                           text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-teal-500/40
                           transition-all"
              >
                <option value="K" style={{background:"#1e293b"}}>국내 출원 (K)</option>
                <option value="P" style={{background:"#1e293b"}}>PCT 국제출원 (P)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">도면 번호</label>
              <input
                type="text"
                value={diagramNo}
                onChange={(e) => setDiagramNo(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl
                           text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-teal-500/40
                           transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            className="btn-teal w-full justify-center py-3 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <FileImage className="w-4 h-4" />
                도면 생성
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* KIPO 규격 안내 */}
        <div className="glass p-4 rounded-2xl border border-teal-500/10">
          <h3 className="text-xs font-semibold text-white/50 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-400" />
            KIPO 규격
          </h3>
          <ul className="text-xs text-white/35 space-y-1.5">
            <li>· 해상도: 300 DPI · 색상: 흑백</li>
            <li>
              · 여백 ({filingType === "K" ? "국내" : "PCT"}): 상{filingType === "K" ? "40" : "25"}·좌25·하{filingType === "K" ? "20" : "10"}·우{filingType === "K" ? "20" : "15"}mm
            </li>
            <li>· 폰트: Noto Sans KR / Malgun Gothic</li>
            <li>· 참조부호: 100번대 체계</li>
          </ul>
        </div>
      </div>

      {/* ── 미리보기 패널 ── */}
      <div className="space-y-4">
        <div className="glass p-5 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                <FileImage className="w-4 h-4 text-teal-400" />
                도면 미리보기
              </h2>
              {detectedType && (
                <p className="text-xs text-white/40 mt-0.5">
                  {diagramType === "auto" ? "✨ 자동 감지: " : ""}
                  {DIAGRAM_TYPES.find((t) => t.value === detectedType)?.label}
                </p>
              )}
            </div>

            {svg && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-2 glass glass-hover text-xs text-white/70 hover:text-white rounded-xl"
                >
                  {saved ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                      저장됨
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      저장
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  SVG 다운로드
                </button>
              </div>
            )}
          </div>

          <div
            ref={svgRef}
            className={cn(
              "border border-white/10 rounded-xl overflow-auto bg-white min-h-64 flex items-center justify-center",
              !svg && "bg-white/3"
            )}
            style={{ maxHeight: "70vh" }}
          >
            {svg ? (
              <div
                dangerouslySetInnerHTML={{ __html: svg }}
                className="w-full"
                style={{ fontSize: 0 }}
              />
            ) : (
              <div className="text-center p-8">
                <FileImage className="w-10 h-10 mx-auto mb-3 text-white/10" />
                <p className="text-sm text-white/30">도면이 여기에 표시됩니다</p>
                <p className="text-xs mt-1.5 text-white/20">특허 내용을 입력하고 생성 버튼을 누르세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
