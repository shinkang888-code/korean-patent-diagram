import { DiagramConfig, GraphData, A5_LANDSCAPE, LINE_W, MARGINS } from "./types";

function mmToPx(mm: number): number {
  return (mm / 25.4) * 96;
}

export function generateGraphSVG(data: GraphData, config: DiagramConfig): string {
  const { width, height } = A5_LANDSCAPE;
  const margin = MARGINS[config.filingType];
  const ml = mmToPx(margin.left) + 40; // Y축 레이블 공간
  const mr = mmToPx(margin.right);
  const mt = mmToPx(margin.top);
  const mb = mmToPx(margin.bottom) + 30; // X축 레이블 공간
  const drawW = width - ml - mr;
  const drawH = height - mt - mb;
  const fs = config.fontSize;

  const allValues = data.series.flatMap((s) => s.data);
  const minY = Math.min(0, ...allValues);
  const maxY = Math.max(...allValues) * 1.1;
  const xCount = data.xValues.length;

  const STYLES = ["solid", "dashed", "dotted", "dashdot"];
  const DASHARRAY: Record<string, string> = {
    solid: "none",
    dashed: "8,4",
    dotted: "2,4",
    dashdot: "8,4,2,4",
  };

  let svgBody = "";

  // 격자선
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const y = mt + drawH - (drawH * i) / yTicks;
    const val = minY + ((maxY - minY) * i) / yTicks;
    svgBody += `
      <line x1="${ml}" y1="${y}" x2="${ml + drawW}" y2="${y}"
            stroke="#cccccc" stroke-width="0.5"/>
      <text x="${ml - 5}" y="${y}" text-anchor="end" dominant-baseline="middle"
            font-size="${fs - 2}" fill="black">${val.toFixed(1)}</text>`;
  }

  // X축
  for (let i = 0; i < xCount; i++) {
    const x = ml + (drawW * i) / (xCount - 1);
    svgBody += `
      <text x="${x}" y="${mt + drawH + 15}" text-anchor="middle"
            font-size="${fs - 2}" fill="black">${data.xValues[i]}</text>`;
  }

  // 축선
  svgBody += `
    <line x1="${ml}" y1="${mt}" x2="${ml}" y2="${mt + drawH}"
          stroke="black" stroke-width="${LINE_W.outer}"/>
    <line x1="${ml}" y1="${mt + drawH}" x2="${ml + drawW}" y2="${mt + drawH}"
          stroke="black" stroke-width="${LINE_W.outer}"/>`;

  // 데이터 시리즈
  data.series.forEach((series, si) => {
    const style = STYLES[si % STYLES.length];
    const dashArr = DASHARRAY[style];
    const points = series.data.map((v, i) => {
      const x = ml + (drawW * i) / (xCount - 1);
      const y = mt + drawH - (drawH * (v - minY)) / (maxY - minY);
      return `${x},${y}`;
    });

    svgBody += `
      <polyline points="${points.join(" ")}"
                fill="none" stroke="black" stroke-width="${LINE_W.sub}"
                ${dashArr !== "none" ? `stroke-dasharray="${dashArr}"` : ""}/>`;

    // 범례
    const legendX = ml + drawW - 120;
    const legendY = mt + 20 + si * 20;
    const lx1 = legendX;
    const lx2 = legendX + 25;
    svgBody += `
      <line x1="${lx1}" y1="${legendY}" x2="${lx2}" y2="${legendY}"
            stroke="black" stroke-width="${LINE_W.sub}"
            ${dashArr !== "none" ? `stroke-dasharray="${dashArr}"` : ""}/>
      <text x="${lx2 + 5}" y="${legendY}" dominant-baseline="middle"
            font-size="${fs - 2}" font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${series.label}</text>`;
  });

  // 축 레이블
  svgBody += `
    <text x="${ml + drawW / 2}" y="${mt + drawH + mb - 5}"
          text-anchor="middle" font-size="${fs}"
          font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${data.xLabel}</text>
    <text x="${ml - 35}" y="${mt + drawH / 2}"
          text-anchor="middle" font-size="${fs}"
          font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black"
          transform="rotate(-90, ${ml - 35}, ${mt + drawH / 2})">${data.yLabel}</text>`;

  // 도면 번호
  svgBody += `
    <text x="${width - mr}" y="${height - 10}"
          text-anchor="end" font-size="${fs}"
          font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${config.diagramNo}</text>
    <text x="${width - mr}" y="${mt / 2}"
          text-anchor="end" font-size="${fs - 2}"
          font-family="'Noto Sans KR', 'Malgun Gothic', sans-serif" fill="black">${config.pageNo}/${config.totalPages}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${width} ${height}"
     width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  ${svgBody}
</svg>`;
}

export function parseGraphFromContent(content: string): GraphData {
  const numbers = (content.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).slice(0, 10);

  if (numbers.length < 3) {
    return {
      xLabel: "시간 (s)",
      yLabel: "성능 (%)",
      xValues: [0, 1, 2, 3, 4],
      series: [
        { label: "본 발명", data: [60, 72, 85, 91, 95], style: "solid" },
        { label: "비교예", data: [55, 63, 70, 75, 78], style: "dashed" },
      ],
    };
  }

  const xValues = numbers.slice(0, Math.ceil(numbers.length / 2));
  const yValues = numbers.slice(Math.ceil(numbers.length / 2));

  return {
    xLabel: "측정값",
    yLabel: "결과값",
    xValues,
    series: [{ label: "본 발명", data: yValues, style: "solid" }],
  };
}
