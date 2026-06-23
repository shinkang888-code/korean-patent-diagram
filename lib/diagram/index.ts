import { DiagramType, DiagramConfig, DEFAULT_CONFIG } from "./types";
import { generateFlowchartSVG, parseFlowchartFromContent } from "./flowchart";
import { generateBlockSVG, parseBlockFromContent } from "./block";
import { generateStateSVG, parseStateFromContent } from "./state";
import { generateGraphSVG, parseGraphFromContent } from "./graph";
import { generateProcessSVG, parseProcessFromContent } from "./process";

export * from "./types";

/**
 * 특허 내용에서 도면 유형 자동 감지
 */
export function detectDiagramType(content: string): DiagramType {
  const lower = content.toLowerCase();

  const scores: Record<DiagramType, number> = {
    flowchart: 0,
    block: 0,
    state: 0,
    graph: 0,
    process: 0,
  };

  // 플로우차트 키워드
  const flowchartKW = ["방법", "단계", "절차", "처리", "알고리즘", "수행", "판단", "if", "step", "flow"];
  flowchartKW.forEach((kw) => { if (lower.includes(kw)) scores.flowchart++; });

  // 블록도 키워드
  const blockKW = ["시스템", "장치", "모듈", "구성", "유닛", "인터페이스", "연결", "system", "device", "module"];
  blockKW.forEach((kw) => { if (lower.includes(kw)) scores.block++; });

  // 상태도 키워드
  const stateKW = ["상태", "전이", "이벤트", "조건", "모드", "전환", "state", "mode", "event", "transition"];
  stateKW.forEach((kw) => { if (lower.includes(kw)) scores.state++; });

  // 그래프 키워드
  const graphKW = ["측정", "비교", "효율", "성능", "수치", "실험", "농도", "온도", "graph", "chart", "data"];
  graphKW.forEach((kw) => { if (lower.includes(kw)) scores.graph++; });

  // 공정도 키워드
  const processKW = ["제조", "합성", "가공", "공정", "반응", "생산", "처리 단계", "process", "manufacturing"];
  processKW.forEach((kw) => { if (lower.includes(kw)) scores.process++; });

  // 숫자 데이터 많으면 그래프 가능성 높음
  const numberCount = (content.match(/\d+(?:\.\d+)?/g) ?? []).length;
  if (numberCount > 5) scores.graph += 2;

  return Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0] as DiagramType;
}

/**
 * 통합 SVG 도면 생성
 */
export function generateDiagramSVG(
  content: string,
  type: DiagramType,
  configOverrides: Partial<DiagramConfig> = {}
): string {
  const config: DiagramConfig = { ...DEFAULT_CONFIG, diagramType: type, ...configOverrides };

  switch (type) {
    case "flowchart": {
      const data = parseFlowchartFromContent(content);
      return generateFlowchartSVG(data, config);
    }
    case "block": {
      const data = parseBlockFromContent(content);
      return generateBlockSVG(data, config);
    }
    case "state": {
      const data = parseStateFromContent(content);
      return generateStateSVG(data, config);
    }
    case "graph": {
      const data = parseGraphFromContent(content);
      return generateGraphSVG(data, config);
    }
    case "process": {
      const data = parseProcessFromContent(content);
      return generateProcessSVG(data, config);
    }
  }
}

export const DIAGRAM_LABELS: Record<DiagramType, string> = {
  flowchart: "플로우차트",
  block: "블록도",
  state: "상태도",
  graph: "그래프",
  process: "공정도",
};

export const DIAGRAM_DESCRIPTIONS: Record<DiagramType, string> = {
  flowchart: "SW·방법·알고리즘 특허",
  block: "전자·통신·시스템 특허",
  state: "제어·프로토콜·UI 특허",
  graph: "성능 비교·실험 결과",
  process: "제조·화학·생산 공정",
};
