"use client";
import { useState, useCallback } from "react";
import {
  FileImage,
  Download,
  Save,
  Loader2,
  CheckCircle,
  Sparkles,
  Info,
  Plus,
  Grid2X2,
  LayoutPanelTop,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/cn";

type DiagramType = "flowchart" | "block" | "state" | "graph" | "process";
type FilingType = "K" | "P";
type ViewMode = "single" | "grid";

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

interface GeneratedDiagram {
  id: string;
  no: string;
  type: DiagramType;
  svg: string;
  savedToDb: boolean;
}

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
  const [diagramCount, setDiagramCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  // 생성된 도면 목록
  const [diagrams, setDiagrams] = useState<GeneratedDiagram[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedDiagram, setSelectedDiagram] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateOne = useCallback(
    async (no: string, idx: number): Promise<GeneratedDiagram | null> => {
      const res = await fetch("/api/diagrams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          type: diagramType === "auto" ? undefined : diagramType,
          filingType,
          diagramNo: no,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      return {
        id: `${Date.now()}-${idx}`,
        no,
        type: data.type as DiagramType,
        svg: data.svg as string,
        savedToDb: false,
      };
    },
    [content, diagramType, filingType]
  );

  const handleGenerate = useCallback(async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setDiagrams([]);
    setSelectedDiagram(null);

    try {
      const results: GeneratedDiagram[] = [];
      for (let i = 0; i < diagramCount; i++) {
        setLoadingIdx(i);
        const no = `도 ${i + 1}`;
        const d = await generateOne(no, i);
        if (d) {
          results.push(d);
          setDiagrams([...results]);
        }
      }
      if (results.length > 0) setSelectedDiagram(results[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setLoading(false);
      setLoadingIdx(null);
    }
  }, [content, diagramCount, generateOne]);

  const handleAddDiagram = useCallback(async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError(null);
    const nextNo = `도 ${diagrams.length + 1}`;
    setLoadingIdx(diagrams.length);
    try {
      const d = await generateOne(nextNo, diagrams.length);
      if (d) {
        setDiagrams((prev) => [...prev, d]);
        setSelectedDiagram(d.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setLoading(false);
      setLoadingIdx(null);
    }
  }, [content, diagrams.length, generateOne, loading]);

  const handleDeleteDiagram = (id: string) => {
    setDiagrams((prev) => {
      const next = prev.filter((d) => d.id !== id).map((d, i) => ({ ...d, no: `도 ${i + 1}` }));
      if (selectedDiagram === id) setSelectedDiagram(next[0]?.id ?? null);
      return next;
    });
  };

  const handleSave = async (diagram: GeneratedDiagram) => {
    try {
      const res = await fetch("/api/diagrams/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationNumber,
          diagramType: diagram.type,
          patentContent: content,
          svgContent: diagram.svg,
          filingType,
        }),
      });
      if (res.ok) {
        setDiagrams((prev) => prev.map((d) => d.id === diagram.id ? { ...d, savedToDb: true } : d));
      }
    } catch { /* ignore */ }
  };

  const handleDownload = (diagram: GeneratedDiagram) => {
    const blob = new Blob([diagram.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${diagram.type}_${diagram.no.replace(" ", "_")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    diagrams.forEach((d, i) => {
      setTimeout(() => handleDownload(d), i * 200);
    });
  };

  const selectedDiagramData = diagrams.find((d) => d.id === selectedDiagram);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

      {/* ── 입력 패널 (2/5) ── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass p-5 rounded-2xl space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <FileImage className="w-4 h-4 text-teal-400" />
            특허 내용 입력
          </h2>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={8}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl
                       text-sm text-white/85 placeholder:text-white/20 resize-none font-mono
                       focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40
                       transition-all"
          />

          {/* 도면 유형 */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">도면 유형</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setDiagramType("auto")}
                className={cn(
                  "col-span-3 sm:col-span-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                  diagramType === "auto"
                    ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
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
                      : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 설정 + 도면 개수 */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">출원 유형</label>
              <select
                value={filingType}
                onChange={(e) => setFilingType(e.target.value as FilingType)}
                className="w-full px-2 py-2.5 bg-white/5 border border-white/10 rounded-xl
                           text-xs text-white/80 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                <option value="K" style={{background:"#1e293b"}}>국내 (K)</option>
                <option value="P" style={{background:"#1e293b"}}>PCT (P)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                생성 도면 수: <span className="text-teal-400 font-bold">{diagramCount}개</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDiagramCount(n)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-semibold border transition-all",
                      diagramCount === n
                        ? "bg-teal-500 text-white border-teal-500"
                        : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !content.trim()}
            className="btn-teal w-full justify-center py-3 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingIdx !== null ? `도 ${loadingIdx + 1} 생성 중...` : "생성 중..."}
              </>
            ) : (
              <>
                <FileImage className="w-4 h-4" />
                도면 {diagramCount}개 생성
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* KIPO 규격 */}
        <div className="glass p-4 rounded-2xl border border-teal-500/10">
          <h3 className="text-xs font-semibold text-white/50 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-400" />
            KIPO 규격
          </h3>
          <ul className="text-xs text-white/35 space-y-1">
            <li>· 해상도: 300 DPI · 색상: 흑백</li>
            <li>· 여백: 상{filingType === "K" ? "40" : "25"}·좌25·하{filingType === "K" ? "20" : "10"}·우{filingType === "K" ? "20" : "15"}mm</li>
            <li>· 폰트: Noto Sans KR / Malgun Gothic</li>
            <li>· 참조부호: 100번대 체계</li>
          </ul>
        </div>
      </div>

      {/* ── 미리보기 패널 (3/5) ── */}
      <div className="lg:col-span-3 space-y-4">

        {/* 뷰 컨트롤 헤더 */}
        {diagrams.length > 0 && (
          <div className="glass p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <FileImage className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-semibold text-white">
                생성된 도면
                <span className="badge-teal ml-2">{diagrams.length}개</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* 뷰 모드 토글 */}
              <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 text-xs transition-all",
                    viewMode === "grid" ? "bg-teal-500 text-white" : "text-white/50 hover:text-white/80"
                  )}
                >
                  <Grid2X2 className="w-3.5 h-3.5" />
                  그리드
                </button>
                <button
                  onClick={() => setViewMode("single")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 text-xs transition-all",
                    viewMode === "single" ? "bg-teal-500 text-white" : "text-white/50 hover:text-white/80"
                  )}
                >
                  <LayoutPanelTop className="w-3.5 h-3.5" />
                  단일
                </button>
              </div>
              {/* 추가 생성 */}
              <button
                onClick={handleAddDiagram}
                disabled={loading || !content.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10
                           hover:bg-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                도면 추가
              </button>
              {/* 전체 다운로드 */}
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600
                           rounded-lg text-xs text-white font-semibold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                전체
              </button>
            </div>
          </div>
        )}

        {/* ── 그리드 뷰: 2×N 바둑판 ── */}
        {viewMode === "grid" && diagrams.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className={cn(
                  "glass rounded-2xl overflow-hidden transition-all group",
                  selectedDiagram === diagram.id ? "ring-2 ring-teal-500/60" : "hover:ring-1 hover:ring-white/20"
                )}
              >
                {/* 카드 헤더 */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-white/3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/80">{diagram.no}</span>
                    <span className="badge-teal">
                      {DIAGRAM_TYPES.find(t => t.value === diagram.type)?.label ?? diagram.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setSelectedDiagram(diagram.id); setViewMode("single"); }}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                      title="크게 보기"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSave(diagram)}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                      title="저장"
                    >
                      {diagram.savedToDb
                        ? <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                        : <Save className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDownload(diagram)}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                      title="SVG 다운로드"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDiagram(diagram.id)}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* SVG 미리보기 */}
                <div
                  className="bg-white overflow-hidden cursor-pointer"
                  style={{ height: "200px" }}
                  onClick={() => { setSelectedDiagram(diagram.id); setViewMode("single"); }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: diagram.svg }}
                    className="w-full h-full"
                    style={{ fontSize: 0, transform: "scale(0.9)", transformOrigin: "top center" }}
                  />
                </div>
              </div>
            ))}

            {/* 로딩 중인 빈 셀 */}
            {loading && loadingIdx !== null && (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-3 py-2 border-b border-white/8 bg-white/3">
                  <span className="text-xs font-bold text-white/40">도 {(loadingIdx ?? 0) + 1}</span>
                </div>
                <div className="bg-white/3 flex items-center justify-center" style={{ height: "200px" }}>
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-2" />
                    <p className="text-xs text-white/30">생성 중...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 단일 뷰 ── */}
        {viewMode === "single" && (
          <div className="glass p-4 rounded-2xl">
            {/* 썸네일 탭 */}
            {diagrams.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {diagrams.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDiagram(d.id)}
                    className={cn(
                      "shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                      selectedDiagram === d.id
                        ? "bg-teal-500 text-white border-teal-500"
                        : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {d.no}
                  </button>
                ))}
              </div>
            )}

            {/* 헤더 */}
            {selectedDiagramData && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{selectedDiagramData.no}</span>
                  <span className="badge-teal">
                    {DIAGRAM_TYPES.find(t => t.value === selectedDiagramData.type)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(selectedDiagramData)}
                    className="flex items-center gap-1 px-3 py-1.5 glass glass-hover text-xs text-white/60 rounded-xl"
                  >
                    {selectedDiagramData.savedToDb
                      ? <><CheckCircle className="w-3.5 h-3.5 text-teal-400" />저장됨</>
                      : <><Save className="w-3.5 h-3.5" />저장</>}
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDiagramData)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    SVG 다운로드
                  </button>
                </div>
              </div>
            )}

            {/* SVG 뷰어 */}
            <div
              className="border border-white/10 rounded-xl overflow-auto bg-white flex items-center justify-center"
              style={{ minHeight: "320px", maxHeight: "60vh" }}
            >
              {selectedDiagramData ? (
                <div
                  dangerouslySetInnerHTML={{ __html: selectedDiagramData.svg }}
                  className="w-full"
                  style={{ fontSize: 0 }}
                />
              ) : loading ? (
                <div className="text-center p-8">
                  <Loader2 className="w-10 h-10 animate-spin text-teal-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">도면 생성 중...</p>
                </div>
              ) : (
                <div className="text-center p-8">
                  <FileImage className="w-10 h-10 mx-auto mb-3 text-white/10" />
                  <p className="text-sm text-white/30">도면이 여기에 표시됩니다</p>
                  <p className="text-xs mt-1.5 text-white/20">특허 내용을 입력하고 생성 버튼을 누르세요</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 초기 빈 상태 */}
        {!loading && diagrams.length === 0 && (
          <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-center" style={{minHeight:"320px"}}>
            <Grid2X2 className="w-12 h-12 mx-auto mb-4 text-white/10" />
            <p className="text-white/30 mb-1">도면이 여기에 표시됩니다</p>
            <p className="text-xs text-white/20">특허 내용 입력 후 생성 버튼을 누르면<br/>2×N 그리드로 도면이 표시됩니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
