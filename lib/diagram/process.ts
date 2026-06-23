import { DiagramConfig, ProcessData, A4_PORTRAIT, LINE_W, MARGINS } from "./types";

function mmToPx(mm: number): number {
  return (mm / 25.4) * 96;
}

export function generateProcessSVG(data: ProcessData, config: DiagramConfig): string {
  const { width, height } = A4_PORTRAIT;
  const margin = MARGINS[config.filingType];
  const ml = mmToPx(margin.left);
  const mr = mmToPx(margin.right);
  const mt = mmToPx(margin.top);
  const mb = mmToPx(margin.bottom);
  const drawW = width - ml - mr;
  const drawH = height - mt - mb;
  const fs = config.fontSize;

  const { steps } = data;
  const stepH = Math.min(60, drawH / (steps.length * 1.5));
  const stepW = Math.min(220, drawW * 0.7);
  const stepX = ml + drawW / 2;
  const spacing = drawH / (steps.length + 1);

  const positions: Record<string, { x: number; y: number }> = {};
  steps.forEach((step, i) => {
    positions[step.id] = { x: stepX, y: mt + spacing * (i + 1) };
  });

  let svgBody = "";

  // 화살표
  steps.forEach((step, i) => {
    if (i < steps.length - 1) {
      const from = positions[step.id];
      const to = positions[steps[i + 1].id];
      if (!from || !to) return;

      svgBody += `
        <line x1="${from.x}" y1="${from.y + stepH / 2}" x2="${to.x}" y2="${to.y - stepH / 2}"
              stroke="black" stroke-width="${LINE_W.outer}" marker-end="url(#arrow)"/>`;
    }
  });

  // 단계 도형
  for (const step of steps) {
    const pos = positions[step.id];
    if (!pos) continue;
    const { x, y } = pos;

    if (step.type === "process") {
      // 사각형
      svgBody += `
        <rect x="${x - stepW / 2}" y="${y - stepH / 2}" width="${stepW}" height="${stepH}" rx="4"
              fill="white" stroke="black" stroke-width="${LINE_W.outer}"/>
        <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
              font-size="${fs}" font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${step.label}</text>
        <text x="${x + stepW / 2 - 4}" y="${y + stepH / 2 - 4}"
              text-anchor="end" font-size="${fs - 2}" fill="black">${step.ref}</text>`;
    } else if (step.type === "input_output") {
      // 평행사변형
      const off = 20;
      const pts = [
        [x - stepW / 2 + off, y - stepH / 2],
        [x + stepW / 2 + off, y - stepH / 2],
        [x + stepW / 2 - off, y + stepH / 2],
        [x - stepW / 2 - off, y + stepH / 2],
      ]
        .map(([px, py]) => `${px},${py}`)
        .join(" ");
      svgBody += `
        <polygon points="${pts}" fill="white" stroke="black" stroke-width="${LINE_W.outer}"/>
        <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
              font-size="${fs}" font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${step.label}</text>`;
    } else if (step.type === "decision") {
      // 마름모
      const hw = stepW / 2;
      const hh = stepH / 2;
      svgBody += `
        <polygon points="${x},${y - hh} ${x + hw},${y} ${x},${y + hh} ${x - hw},${y}"
                 fill="white" stroke="black" stroke-width="${LINE_W.outer}"/>
        <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle"
              font-size="${fs - 1}" font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${step.label}</text>
        <text x="${x + hw + 4}" y="${y}" dominant-baseline="middle"
              font-size="${fs - 2}" fill="black">${step.ref}</text>`;
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

export function parseProcessFromContent(content: string): ProcessData {
  const lines = content
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 50);

  const processSteps = lines
    .filter(
      (l) =>
        /제\d+\s*공정|단계|step|\d+[.)]/i.test(l) ||
        /투입|반응|혼합|분리|정제|건조|합성|가공|처리|제조|생산/i.test(l)
    )
    .slice(0, 7)
    .map((l) => l.replace(/^제?\d+\s*공정[.:：]?\s*|^\d+[.)]\s*/, "").trim());

  if (processSteps.length < 2) {
    return {
      steps: [
        { id: "s0", type: "input_output", label: "원료 투입", ref: 100 },
        { id: "s1", type: "process", label: "혼합 공정", ref: 200 },
        { id: "s2", type: "process", label: "반응 공정", ref: 300 },
        { id: "s3", type: "decision", label: "품질 검사", ref: 400 },
        { id: "s4", type: "process", label: "정제 공정", ref: 500 },
        { id: "s5", type: "input_output", label: "제품 출하", ref: 600 },
      ],
      edges: [
        { from: "s0", to: "s1" },
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3" },
        { from: "s3", to: "s4", label: "합격" },
        { from: "s4", to: "s5" },
      ],
    };
  }

  const steps = processSteps.map((label, i): ProcessData["steps"][number] => {
    const type =
      i === 0 || i === processSteps.length - 1
        ? "input_output"
        : /검사|확인|판단/i.test(label)
        ? "decision"
        : "process";
    return { id: `s${i}`, type, label: label.slice(0, 15), ref: (i + 1) * 100 };
  });

  const edges = steps.slice(0, -1).map((s, i) => ({
    from: s.id,
    to: steps[i + 1].id,
  }));

  return { steps, edges };
}
