export type DiagramType = "flowchart" | "block" | "state" | "graph" | "process";
export type FilingType = "K" | "P"; // K: 국내, P: PCT

export interface DiagramConfig {
  diagramType: DiagramType;
  diagramNo: string;     // "도 1"
  pageNo: number;        // 현재 페이지
  totalPages: number;    // 전체 페이지
  filingType: FilingType;
  fontSize: number;      // 최소 9pt
}

export interface Margin {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export const MARGINS: Record<FilingType, Margin> = {
  K: { top: 40, left: 25, bottom: 20, right: 20 }, // 국내출원 (mm)
  P: { top: 25, left: 25, bottom: 10, right: 15 }, // PCT 국제출원 (mm)
};

// A4 96DPI 기준 픽셀 (SVG viewBox)
export const A4_PORTRAIT = { width: 794, height: 1123 };
export const A4_LANDSCAPE = { width: 1123, height: 794 };
export const A5_LANDSCAPE = { width: 794, height: 561 };

// 선 굵기 (SVG px)
export const LINE_W = {
  outer: 2.0,
  sub: 1.5,
  thin: 1.0,
};

// 기본 도면 설정
export const DEFAULT_CONFIG: DiagramConfig = {
  diagramType: "flowchart",
  diagramNo: "도 1",
  pageNo: 1,
  totalPages: 1,
  filingType: "K",
  fontSize: 13,
};

export interface FlowchartNode {
  id: string;
  type: "start" | "end" | "process" | "decision";
  label: string;
  stepNo?: string; // S100, S200
  ref?: number;    // 참조부호
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface BlockNode {
  id: string;
  label: string;
  ref: number;
  dashed?: boolean;
}

export interface BlockEdge {
  from: string;
  to: string;
  label?: string;
  bidir?: boolean;
}

export interface BlockData {
  nodes: BlockNode[];
  edges: BlockEdge[];
}

export interface StateNode {
  id: string;
  label: string;
  ref: number;
  initial?: boolean;
  final?: boolean;
}

export interface StateEdge {
  from: string;
  to: string;
  label?: string;
}

export interface StateData {
  nodes: StateNode[];
  edges: StateEdge[];
}

export interface GraphSeries {
  label: string;
  data: number[];
  style?: "solid" | "dashed" | "dotted";
}

export interface GraphData {
  xLabel: string;
  yLabel: string;
  xValues: number[];
  series: GraphSeries[];
}

export interface ProcessStep {
  id: string;
  type: "process" | "input_output" | "decision";
  label: string;
  ref: number;
}

export interface ProcessEdge {
  from: string;
  to: string;
  label?: string;
}

export interface ProcessData {
  steps: ProcessStep[];
  edges: ProcessEdge[];
}
