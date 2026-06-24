"use client";

/**
 * 특허 명세서 다중 포맷 내보내기 유틸리티
 * 지원: Word (.docx) · 한글 (.hwpx) · HTML · Markdown · 텍스트 (.txt)
 */

/* ─── 공통 헬퍼 ─── */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * HTML(contenteditable)에서 Markdown으로 변환
 */
export function htmlToMarkdown(html: string): string {
  // 브라우저 환경에서만 동작
  if (typeof document === "undefined") return html;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(processNode).join("");

    switch (tag) {
      case "h1": return `\n# ${inner}\n`;
      case "h2": return `\n## ${inner}\n`;
      case "h3": return `\n### ${inner}\n`;
      case "h4": return `\n#### ${inner}\n`;
      case "strong": case "b": return `**${inner}**`;
      case "em": case "i": return `*${inner}*`;
      case "u": return `__${inner}__`;
      case "s": case "del": return `~~${inner}~~`;
      case "li": return `- ${inner}\n`;
      case "ul": return `\n${inner}\n`;
      case "ol": {
        let idx = 0;
        return "\n" + Array.from(el.children).map((c) => `${++idx}. ${c.textContent}`).join("\n") + "\n";
      }
      case "br": return "\n";
      case "p": case "div": return `\n${inner}\n`;
      case "hr": return "\n---\n";
      default: return inner;
    }
  }

  return Array.from(tmp.childNodes).map(processNode).join("").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * HTML에서 Plain Text 추출
 */
export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") return html;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent ?? tmp.innerText ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Markdown → 구조화된 HTML (스타일 포함)
 */
export function markdownToRichHtml(md: string, title = "특허명세서"): string {
  const body = md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .trim();

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { font-family: '맑은 고딕', 'Malgun Gothic', sans-serif; font-size: 11pt; line-height: 1.8;
         max-width: 800px; margin: 40px auto; padding: 0 40px; color: #111; }
  h1 { font-size: 16pt; font-weight: bold; margin: 24px 0 12px; border-bottom: 2px solid #333; padding-bottom: 4px; }
  h2 { font-size: 14pt; font-weight: bold; margin: 20px 0 10px; }
  h3 { font-size: 12pt; font-weight: bold; margin: 16px 0 8px; }
  h4 { font-size: 11pt; font-weight: bold; margin: 12px 0 6px; }
  p  { margin: 0 0 10px; text-align: justify; }
  ul { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 1px solid #ccc; margin: 16px 0; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<p>${body}</p>
</body>
</html>`;
}

/* ─── Word (.docx) ─── */
export async function downloadAsDocx(content: string, filename = "특허명세서"): Promise<void> {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

  // content가 HTML이면 plain으로 변환, markdown이면 그대로
  const isHtml = content.trim().startsWith("<");
  const lines = (isHtml ? htmlToMarkdown(content) : content).split("\n");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      continue;
    }
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const h4 = line.match(/^####\s+(.+)/);
    const bullet = line.match(/^\s*[-*+]\s+(.+)/);
    const numbered = line.match(/^\s*(\d+)\.\s+(.+)/);

    if (h1) {
      children.push(new Paragraph({ text: h1[1], heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    } else if (h2) {
      children.push(new Paragraph({ text: h2[1], heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
    } else if (h3) {
      children.push(new Paragraph({ text: h3[1], heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
    } else if (h4) {
      children.push(new Paragraph({ text: h4[1], heading: HeadingLevel.HEADING_4, spacing: { before: 160, after: 80 } }));
    } else if (bullet) {
      children.push(new Paragraph({ children: [new TextRun({ text: "• " + bullet[1], size: 22 })], indent: { left: 720 }, spacing: { after: 80 } }));
    } else if (numbered) {
      children.push(new Paragraph({ children: [new TextRun({ text: `${numbered[1]}. ${numbered[2]}`, size: 22 })], indent: { left: 720 }, spacing: { after: 80 } }));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runs: any[] = [];
      const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
      for (const part of parts) {
        const bold = part.match(/^\*\*(.+)\*\*$/);
        const italic = part.match(/^\*(.+)\*$/);
        if (bold) runs.push(new TextRun({ text: bold[1], bold: true, size: 22 }));
        else if (italic) runs.push(new TextRun({ text: italic[1], italics: true, size: 22 }));
        else if (part) runs.push(new TextRun({ text: part, size: 22 }));
      }
      children.push(new Paragraph({ children: runs, alignment: AlignmentType.LEFT, spacing: { after: 80 } }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1800, right: 1800, bottom: 1800, left: 2268 } } },
      children,
    }],
    styles: { default: { document: { run: { font: "맑은 고딕", size: 22 } } } },
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${filename}.docx`);
}

/* ─── 한글 (.hwpx) ─── */
export async function downloadAsHwpx(content: string, filename = "특허명세서"): Promise<void> {
  const JSZip = (await import("jszip")).default;

  const isHtml = content.trim().startsWith("<");
  const plain = isHtml ? htmlToPlainText(content) : content
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .trim();

  const paragraphs = plain.split("\n").filter((l) => l.trim());

  const paraCells = paragraphs
    .map((text, i) => `    <hp:p id="${i}" paraPrIDRef="0" styleIDRef="Normal" pageBreak="false" columnBreak="false" merged="false">
      <hp:run charPrIDRef="0"><hp:t>${escapeXml(text)}</hp:t></hp:run>
    </hp:p>`)
    .join("\n");

  const sectionXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hp:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" version="1.2">
  <hp:secPr id="0" textDirection="LRTB" spaceColumns="0" tabStop="720" outlineLevel="0" masterPageIDRef="0" hasTextRef="false" hasNumRef="false">
    <hp:startNum pageStartsOn="BOTH" pageNumber="0" picNumber="0" tableNumber="0" equationNumber="0"/>
    <hp:hide header="false" footer="false" masterPage="false" border="false" fill="false" pageNumPos="false" emptyLine="false" lineNum="false"/>
    <hp:lineGrid type="NONE" value="0" lineGridHeight="0"/>
    <hp:pagePr landscape="false" width="21000" height="29700" gutterType="LEFT_ONLY">
      <hp:margin left="1800" right="1800" top="2268" bottom="1800" header="850" footer="850" gutter="0"/>
    </hp:pagePr>
  </hp:secPr>
${paraCells}
</hp:sec>`;

  const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hh:head xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head" version="1.2">
  <hh:docSummary><hh:title>${escapeXml(filename)}</hh:title></hh:docSummary>
  <hh:beginNum page="1" footnote="1" endnote="1" pic="1" tbl="1" equation="1"/>
  <hh:refList>
    <hh:fontfaces/>
    <hh:borderFills/>
    <hh:charProperties>
      <hh:charPr id="0" height="1000" textColor="0" shadeColor="16777215" useFontSpace="false" useKerning="false" symMark="NONE" borderFillIDRef="0">
        <hh:fontRef hangul="맑은 고딕" latin="Times New Roman" hanja="맑은 고딕" japanese="MS Mincho" other="Times New Roman" symbol="Symbol" user=""/>
        <hh:ratio hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:spacing hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
        <hh:relSz hangul="100" latin="100" hanja="100" japanese="100" other="100" symbol="100" user="100"/>
        <hh:offset hangul="0" latin="0" hanja="0" japanese="0" other="0" symbol="0" user="0"/>
      </hh:charPr>
    </hh:charProperties>
    <hh:tabProperties/>
    <hh:numberings/>
    <hh:bullets/>
    <hh:paraProperties>
      <hh:paraPr id="0" lineSpacingType="RATIO" lineSpacing="160" tabPrIDRef="0" condense="0" fontLineHeight="false" snapToGrid="false" suppressLineNumbers="false" checked="false">
        <hh:align horizontal="JUSTIFY" vertical="CENTER"/>
        <hh:heading type="NONE" idRef="0" level="0"/>
        <hh:margin left="0" right="0" prev="0" next="0" indent="0"/>
        <hh:border borderFillIDRef="0" offsetLeft="0" offsetRight="0" offsetTop="0" offsetBottom="0" connect="false" ignoreMargin="false"/>
        <hh:tprops vertAlign="BASELINE" widthFix="false" position="0"/>
      </hh:paraPr>
    </hh:paraProperties>
    <hh:styles>
      <hh:style id="Normal" type="PARA" paraPrIDRef="0" charPrIDRef="0" nextStyleIDRef="Normal" langId="1042" name="바탕글" engName="Normal"/>
    </hh:styles>
    <hh:masterPages>
      <hh:masterPage id="0" name="기본" width="21000" height="29700" landscape="false" textDirection="LRTB" bodyTextNumColumns="1">
        <hh:margin left="1800" right="1800" top="2268" bottom="1800" header="850" footer="850" gutter="0"/>
      </hh:masterPage>
    </hh:masterPages>
  </hh:refList>
  <hh:compatibleDocument targetProgram="HWP201X"><hh:layoutCompatibility/></hh:compatibleDocument>
</hh:head>`;

  const manifestXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.hancom.hwpx"/>
  <manifest:file-entry manifest:full-path="Contents/header.xml" manifest:media-type="application/xml"/>
  <manifest:file-entry manifest:full-path="Contents/section0.xml" manifest:media-type="application/xml"/>
</manifest:manifest>`;

  const zip = new JSZip();
  zip.file("mimetype", "application/vnd.hancom.hwpx");
  zip.file("META-INF/manifest.xml", manifestXml);
  zip.file("Contents/header.xml", headerXml);
  zip.file("Contents/section0.xml", sectionXml);

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.hancom.hwpx",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  triggerDownload(blob, `${filename}.hwpx`);
}

/* ─── HTML ─── */
export function downloadAsHtml(content: string, filename = "특허명세서"): void {
  const isHtml = content.trim().startsWith("<") && content.includes("</");
  let htmlContent: string;
  if (isHtml) {
    // 이미 HTML이면 스타일만 래핑
    const inner = content.replace(/<\/?(html|head|body|!DOCTYPE)[^>]*>/gi, "");
    htmlContent = markdownToRichHtml("", filename).replace("<p></p>", `<div>${inner}</div>`);
  } else {
    htmlContent = markdownToRichHtml(content, filename);
  }
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, `${filename}.html`);
}

/* ─── Markdown ─── */
export function downloadAsMarkdown(content: string, filename = "특허명세서"): void {
  const isHtml = content.trim().startsWith("<");
  const md = isHtml ? htmlToMarkdown(content) : content;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, `${filename}.md`);
}

/* ─── Plain Text ─── */
export function downloadAsTxt(content: string, filename = "특허명세서"): void {
  const isHtml = content.trim().startsWith("<");
  const text = isHtml
    ? htmlToPlainText(content)
    : content.replace(/#{1,6}\s+/g, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${filename}.txt`);
}
