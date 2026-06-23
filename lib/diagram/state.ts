import { DiagramConfig, StateData, A4_PORTRAIT, LINE_W, MARGINS } from "./types";

function mmToPx(mm: number): number {
  return (mm / 25.4) * 96;
}

export function generateStateSVG(data: StateData, config: DiagramConfig): string {
  const { width, height } = A4_PORTRAIT;
  const margin = MARGINS[config.filingType];
  const ml = mmToPx(margin.left);
  const mr = mmToPx(margin.right);
  const mt = mmToPx(margin.top);
  const mb = mmToPx(margin.bottom);
  const drawW = width - ml - mr;
  const drawH = height - mt - mb;
  const fs = config.fontSize;
  const r = Math.min(55, drawH / (data.nodes.length * 2.5));

  // 상태 위치 계산 (원형 배치)
  const cx = ml + drawW / 2;
  const cy = mt + drawH / 2;
  const layoutR = Math.min(drawW, drawH) * 0.35;

  const positions: Record<string, { x: number; y: number }> = {};
  data.nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / data.nodes.length - Math.PI / 2;
    positions[node.id] = {
      x: cx + layoutR * Math.cos(angle),
      y: cy + layoutR * Math.sin(angle),
    };
  });

  let svgBody = "";

  // 전이 화살표
  for (const edge of data.edges) {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (!from || !to) continue;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / dist;
    const uy = dy / dist;

    const x1 = from.x + ux * r;
    const y1 = from.y + uy * r;
    const x2 = to.x - ux * r;
    const y2 = to.y - uy * r;

    // 곡선 화살표 (자기 자신 전이 방지)
    const mx = (x1 + x2) / 2 - uy * 30;
    const my = (y1 + y2) / 2 + ux * 30;

    svgBody += `
      <path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}"
            fill="none" stroke="black" stroke-width="${LINE_W.outer}"
            marker-end="url(#arrow)"/>`;

    if (edge.label) {
      svgBody += `
        <text x="${mx}" y="${my - 5}" text-anchor="middle" font-size="${fs - 2}"
              font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${edge.label}</text>`;
    }
  }

  // 상태 원
  for (const node of data.nodes) {
    const pos = positions[node.id];
    if (!pos) continue;
    const { x, y } = pos;

    svgBody += `
      <circle cx="${x}" cy="${y}" r="${r}"
              fill="white" stroke="black" stroke-width="${LINE_W.outer}"/>`;

    if (node.initial) {
      svgBody += `
        <circle cx="${x}" cy="${y}" r="${r * 0.82}"
                fill="white" stroke="black" stroke-width="${LINE_W.sub}"/>`;
    }
    if (node.final) {
      svgBody += `
        <circle cx="${x}" cy="${y}" r="${r * 1.18}"
                fill="none" stroke="black" stroke-width="${LINE_W.outer}"/>`;
    }

    svgBody += `
      <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
            font-size="${fs}" font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${node.label}</text>`;

    if (node.ref) {
      svgBody += `
        <text x="${x + r + 6}" y="${y - r + 6}" font-size="${fs - 2}" fill="black">${node.ref}</text>`;
    }
  }

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
  </defs>
  <rect width="${width}" height="${height}" fill="white"/>
  ${svgBody}
</svg>`;
}

export function parseStateFromContent(content: string): StateData {
  const stateKeywords = content.match(/[\w가-힣]+\s*(?:상태|모드|단계|state|mode)/gi) ?? [];
  const states = [...new Set(stateKeywords.map((s) => s.trim()))].slice(0, 6);

  if (states.length < 2) {
    return {
      nodes: [
        { id: "s0", label: "초기\n상태", ref: 100, initial: true },
        { id: "s1", label: "대기\n상태", ref: 200 },
        { id: "s2", label: "처리\n상태", ref: 300 },
        { id: "s3", label: "완료\n상태", ref: 400, final: true },
      ],
      edges: [
        { from: "s0", to: "s1", label: "시작" },
        { from: "s1", to: "s2", label: "이벤트" },
        { from: "s2", to: "s3", label: "완료" },
        { from: "s2", to: "s1", label: "오류" },
      ],
    };
  }

  const nodes = states.map((s, i) => ({
    id: `s${i}`,
    label: s.slice(0, 10),
    ref: (i + 1) * 100,
    initial: i === 0,
    final: i === states.length - 1,
  }));

  const edges = nodes.slice(0, -1).map((n, i) => ({
    from: n.id,
    to: nodes[i + 1].id,
    label: "전이",
  }));

  return { nodes, edges };
}
