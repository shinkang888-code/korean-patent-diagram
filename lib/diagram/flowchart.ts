import {
  DiagramConfig,
  FlowchartData,
  A4_PORTRAIT,
  LINE_W,
  MARGINS,
} from "./types";

function mmToPx(mm: number): number {
  return (mm / 25.4) * 96;
}

export function generateFlowchartSVG(
  data: FlowchartData,
  config: DiagramConfig
): string {
  const { width, height } = A4_PORTRAIT;
  const margin = MARGINS[config.filingType];
  const ml = mmToPx(margin.left);
  const mr = mmToPx(margin.right);
  const mt = mmToPx(margin.top);
  const mb = mmToPx(margin.bottom);
  const drawW = width - ml - mr;
  const drawH = height - mt - mb;
  const fs = config.fontSize;

  const { nodes, edges } = data;

  // 노드 위치 계산 (균등 분포)
  const nodeH = Math.min(60, drawH / (nodes.length * 1.6));
  const nodeW = Math.min(200, drawW * 0.6);
  const nodeX = ml + drawW / 2;
  const nodeSpacing = drawH / (nodes.length + 1);

  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node, i) => {
    positions[node.id] = {
      x: nodeX,
      y: mt + nodeSpacing * (i + 1),
    };
  });

  let svgBody = "";

  // 엣지 (화살표) 그리기
  for (const edge of edges) {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (!from || !to) continue;

    const x1 = from.x;
    const y1 = from.y + nodeH / 2;
    const x2 = to.x;
    const y2 = to.y - nodeH / 2;

    svgBody += `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
            stroke="black" stroke-width="${LINE_W.outer}" marker-end="url(#arrow)"/>`;

    if (edge.label) {
      svgBody += `
        <text x="${(x1 + x2) / 2 + 5}" y="${(y1 + y2) / 2}"
              font-size="${fs - 2}" fill="black" dominant-baseline="middle">${edge.label}</text>`;
    }
  }

  // 노드 그리기
  for (const node of nodes) {
    const pos = positions[node.id];
    if (!pos) continue;

    const { x, y } = pos;
    const label = node.stepNo ? `${node.stepNo}\\n${node.label}` : node.label;
    const lines = label.split("\\n");

    if (node.type === "start" || node.type === "end") {
      // 타원
      const rx = nodeW / 2;
      const ry = nodeH / 2;
      svgBody += `
        <ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"
                 fill="white" stroke="black" stroke-width="${LINE_W.outer}"/>`;
      lines.forEach((line, li) => {
        const ty = y + (li - (lines.length - 1) / 2) * (fs + 2);
        svgBody += `
          <text x="${x}" y="${ty}" text-anchor="middle" dominant-baseline="middle"
                font-size="${fs}" font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${line}</text>`;
      });
    } else if (node.type === "process") {
      // 사각형 (둥근 모서리)
      const rx = nodeW / 2;
      const ry = nodeH / 2;
      svgBody += `
        <rect x="${x - rx}" y="${y - ry}" width="${nodeW}" height="${nodeH}" rx="4"
              fill="white" stroke="black" stroke-width="${LINE_W.outer}"/>`;
      lines.forEach((line, li) => {
        const ty = y + (li - (lines.length - 1) / 2) * (fs + 2);
        svgBody += `
          <text x="${x}" y="${ty}" text-anchor="middle" dominant-baseline="middle"
                font-size="${fs}" font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${line}</text>`;
      });
      if (node.ref) {
        svgBody += `
          <text x="${x + nodeW / 2 - 4}" y="${y + nodeH / 2 - 4}"
                text-anchor="end" font-size="${fs - 2}" fill="black">${node.ref}</text>`;
      }
    } else if (node.type === "decision") {
      // 마름모
      const hw = nodeW / 2;
      const hh = nodeH / 2;
      svgBody += `
        <polygon points="${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}"
                 fill="white" stroke="black" stroke-width="${LINE_W.outer}"/>`;
      lines.forEach((line, li) => {
        const ty = y + (li - (lines.length - 1) / 2) * (fs + 1);
        svgBody += `
          <text x="${x}" y="${ty}" text-anchor="middle" dominant-baseline="middle"
                font-size="${fs - 1}" font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${line}</text>`;
      });
      if (node.ref) {
        svgBody += `
          <text x="${x + hw + 4}" y="${y}" dominant-baseline="middle"
                font-size="${fs - 2}" fill="black">${node.ref}</text>`;
      }
    }
  }

  // 도면 번호 (우측 하단)
  svgBody += `
    <text x="${width - mr}" y="${height - mb / 2}"
          text-anchor="end" font-size="${fs}"
          font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${config.diagramNo}</text>`;

  // 면수 (우측 상단)
  svgBody += `
    <text x="${width - mr}" y="${mt / 2}"
          text-anchor="end" font-size="${fs - 2}"
          font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${config.pageNo}/${config.totalPages}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${width} ${height}" 
     width="${width}" height="${height}">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="black"/>
    </marker>
  </defs>
  <rect width="${width}" height="${height}" fill="white"/>
  ${svgBody}
</svg>`;
}

/**
 * 특허 내용에서 플로우차트 데이터 자동 추출
 */
export function parseFlowchartFromContent(content: string): FlowchartData {
  const lines = content
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 60);

  const steps = lines
    .filter((l) => /^\d+[.)]\s*/.test(l) || /^[-•]\s*/.test(l) || /단계|step|S\d{3}/i.test(l))
    .slice(0, 8)
    .map((l) => l.replace(/^\d+[.)]\s*|^[-•]\s*/, "").trim());

  if (steps.length === 0) {
    // 기본 플로우차트 생성
    return {
      nodes: [
        { id: "start", type: "start", label: "시작" },
        { id: "s1", type: "process", label: "처리 단계", stepNo: "S100", ref: 100 },
        { id: "d1", type: "decision", label: "조건 판단", ref: 200 },
        { id: "s2", type: "process", label: "성공 처리", stepNo: "S200", ref: 300 },
        { id: "s3", type: "process", label: "실패 처리", stepNo: "S300", ref: 400 },
        { id: "end", type: "end", label: "종료" },
      ],
      edges: [
        { from: "start", to: "s1" },
        { from: "s1", to: "d1" },
        { from: "d1", to: "s2", label: "예(Y)" },
        { from: "d1", to: "s3", label: "아니오(N)" },
        { from: "s2", to: "end" },
        { from: "s3", to: "end" },
      ],
    };
  }

  const nodes: FlowchartData["nodes"] = [
    { id: "start", type: "start", label: "시작" },
  ];
  const edges: FlowchartData["edges"] = [];
  let prevId = "start";

  steps.forEach((step, i) => {
    const id = `s${i + 1}`;
    const ref = (i + 1) * 100;
    const isDecision = /판단|확인|검사|check|verify|valid/i.test(step);

    nodes.push({
      id,
      type: isDecision ? "decision" : "process",
      label: step.slice(0, 20),
      stepNo: `S${ref}`,
      ref,
    });
    edges.push({ from: prevId, to: id, label: i > 0 && isDecision ? "예(Y)" : undefined });
    prevId = id;
  });

  nodes.push({ id: "end", type: "end", label: "종료" });
  edges.push({ from: prevId, to: "end" });

  return { nodes, edges };
}
