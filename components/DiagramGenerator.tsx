"use client";
import { useState, useRef, useCallback } from "react";
import {
  FileImage,
  Download,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";

type DiagramType = "flowchart" | "block" | "state" | "graph" | "process";
type FilingType = "K" | "P";

const DIAGRAM_TYPES: { value: DiagramType; label: string; desc: string }[] = [
  { value: "flowchart", label: "플로우차트", desc: "SW·방법·알고리즘 특허" },
  { value: "block", label: "블록도", desc: "전자·통신·시스템 특허" },
  { value: "state", label: "상태도", desc: "제어·프로토콜·UI 특허" },
  { value: "graph", label: "그래프", desc: "성능 비교·실험 결과" },
  { value: "process", label: "공정도", desc: "제조·화학·생산 공정" },
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

    // SVG 다운로드
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 입력 패널 */}
      <div className="space-y-4">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">특허 내용 입력</h2>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={10}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />

          {/* 도면 유형 */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">도면 유형</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDiagramType("auto")}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-colors col-span-3 sm:col-span-1",
                  diagramType === "auto"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                )}
              >
                🤖 자동 감지
              </button>
              {DIAGRAM_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDiagramType(value)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
                    diagramType === value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">출원 유형</label>
              <select
                value={filingType}
                onChange={(e) => setFilingType(e.target.value as FilingType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="K">국내 출원 (K)</option>
                <option value="P">PCT 국제출원 (P)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">도면 번호</label>
              <input
                type="text"
                value={diagramNo}
                onChange={(e) => setDiagramNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            className="btn-primary w-full justify-center py-3"
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
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* KIPO 규격 안내 */}
        <div className="card p-4 bg-slate-50">
          <h3 className="text-xs font-semibold text-slate-700 mb-2">KIPO 규격</h3>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• 해상도: 300 DPI · 색상: 흑백</li>
            <li>
              • 여백 ({filingType === "K" ? "국내" : "PCT"}): 상{filingType === "K" ? "40" : "25"}·좌25·하{filingType === "K" ? "20" : "10"}·우{filingType === "K" ? "20" : "15"}mm
            </li>
            <li>• 폰트: Noto Sans KR / Malgun Gothic</li>
            <li>• 참조부호: 100번대 체계</li>
          </ul>
        </div>
      </div>

      {/* 미리보기 패널 */}
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">도면 미리보기</h2>
              {detectedType && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {diagramType === "auto" ? "🤖 자동 감지: " : ""}
                  {DIAGRAM_TYPES.find((t) => t.value === detectedType)?.label}
                </p>
              )}
            </div>

            {svg && (
              <div className="flex items-center gap-2">
                <button onClick={handleSave} className="btn-secondary text-xs py-1.5">
                  {saved ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      저장됨
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      저장
                    </>
                  )}
                </button>
                <button onClick={handleDownload} className="btn-primary text-xs py-1.5">
                  <Download className="w-3.5 h-3.5" />
                  SVG 다운로드
                </button>
              </div>
            )}
          </div>

          <div
            ref={svgRef}
            className={cn(
              "border border-slate-200 rounded-lg overflow-auto bg-white min-h-64 flex items-center justify-center",
              !svg && "text-slate-400 text-sm"
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
                <FileImage className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>도면이 여기에 표시됩니다</p>
                <p className="text-xs mt-1 text-slate-300">특허 내용을 입력하고 생성 버튼을 누르세요</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
