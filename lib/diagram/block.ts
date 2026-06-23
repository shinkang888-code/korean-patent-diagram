import {
  DiagramConfig,
  BlockData,
  A4_LANDSCAPE,
  LINE_W,
  MARGINS,
} from "./types";

function mmToPx(mm: number): number {
  return (mm / 25.4) * 96;
}

export function generateBlockSVG(
  data: BlockData,
  config: DiagramConfig
): string {
  const { width, height } = A4_LANDSCAPE;
  const margin = MARGINS[config.filingType];
  const ml = mmToPx(margin.left);
  const mr = mmToPx(margin.right);
  const mt = mmToPx(margin.top);
  const mb = mmToPx(margin.bottom);
  const drawW = width - ml - mr;
  const drawH = height - mt - mb;
  const fs = config.fontSize;

  const { nodes, edges } = data;

  // 블록 배치: 행당 최대 3개
  const cols = Math.min(3, nodes.length);
  const rows = Math.ceil(nodes.length / cols);
  const bw = Math.min(180, drawW / cols - 30);
  const bh = Math.min(70, drawH / rows - 30);
  const hGap = (drawW - bw * cols) / (cols + 1);
  const vGap = (drawH - bh * rows) / (rows + 1);

  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions[node.id] = {
      x: ml + hGap * (col + 1) + bw * col + bw / 2,
      y: mt + vGap * (row + 1) + bh * row + bh / 2,
    };
  });

  let svgBody = "";

  // 엣지
  for (const edge of edges) {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (!from || !to) continue;

    const x1 = from.x + bw / 2;
    const y1 = from.y;
    const x2 = to.x - bw / 2;
    const y2 = to.y;

    const markStart = edge.bidir ? "url(#arrowBack)" : "";
    svgBody += `
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
            stroke="black" stroke-width="${LINE_W.outer}"
            marker-end="url(#arrow)" ${edge.bidir ? `marker-start="url(#arrowBack)"` : ""}/>`;

    if (edge.label) {
      svgBody += `
        <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 5}"
              text-anchor="middle" font-size="${fs - 2}" fill="black">${edge.label}</text>`;
    }
  }

  // 블록
  for (const node of nodes) {
    const pos = positions[node.id];
    if (!pos) continue;
    const { x, y } = pos;
    const stroke = node.dashed ? "4,4" : "none";

    svgBody += `
      <rect x="${x - bw / 2}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="4"
            fill="white" stroke="black" stroke-width="${LINE_W.outer}"
            ${node.dashed ? 'stroke-dasharray="4,4"' : ""}/>
      <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
            font-size="${fs}" font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${node.label}</text>
      <text x="${x + bw / 2 - 4}" y="${y + bh / 2 - 4}"
            text-anchor="end" font-size="${fs - 2}" fill="black">${node.ref}</text>`;
  }

  // 도면 번호
  svgBody += `
    <text x="${width - mr}" y="${height - mb / 2}"
          text-anchor="end" font-size="${fs}"
          font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${config.diagramNo}</text>
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
    <marker id="arrowBack" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto">
      <path d="M9,0 L9,6 L0,3 z" fill="black"/>
    </marker>
  </defs>
  <rect width="${width}" height="${height}" fill="white"/>
  ${svgBody}
</svg>`;
}

export function parseBlockFromContent(content: string): BlockData {
  const keywords = content.match(/[^\n,，·•]+/g) ?? [];
  const modules = keywords
    .filter((k) => k.trim().length > 1 && k.trim().length < 30)
    .filter((k) => /모듈|장치|부|시스템|인터페이스|유닛|서버|클라이언트|처리기|제어기/i.test(k))
    .slice(0, 6)
    .map((k) => k.trim());

  if (modules.length < 2) {
    return {
      nodes: [
        { id: "n1", label: "입력부", ref: 100 },
        { id: "n2", label: "처리부", ref: 200 },
        { id: "n3", label: "출력부", ref: 300 },
        { id: "n4", label: "제어부", ref: 400 },
        { id: "n5", label: "메모리부", ref: 500 },
        { id: "n6", label: "통신부", ref: 600 },
      ],
      edges: [
        { from: "n1", to: "n2" },
        { from: "n2", to: "n3" },
        { from: "n4", to: "n1" },
        { from: "n4", to: "n2" },
        { from: "n4", to: "n3" },
        { from: "n5", to: "n2" },
        { from: "n2", to: "n6" },
      ],
    };
  }

  const nodes = modules.map((m, i) => ({
    id: `n${i + 1}`,
    label: m.replace(/^[의을를이가은는]/g, ""),
    ref: (i + 1) * 100,
  }));

  const edges = nodes.slice(0, -1).map((n, i) => ({
    from: n.id,
    to: nodes[i + 1].id,
  }));

  return { nodes, edges };
}
