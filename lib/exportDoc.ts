"use client";

/**
 * Word (.docx) 및 HWPX 문서 내보내기 유틸리티
 */

function markdownToPlainText(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/```\w*\n?/, "").replace(/\n?```/, "")
    )
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + " ")
    .trim();
}

export async function downloadAsDocx(content: string, filename = "특허명세서"): Promise<void> {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

  const lines = content.split("\n");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      continue;
    }

    const h1Match = line.match(/^#\s+(.+)/);
    const h2Match = line.match(/^##\s+(.+)/);
    const h3Match = line.match(/^###\s+(.+)/);
    const bulletMatch = line.match(/^\s*[-*+]\s+(.+)/);
    const numberedMatch = line.match(/^\s*(\d+)\.\s+(.+)/);

    if (h1Match) {
      children.push(new Paragraph({ text: h1Match[1], heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
    } else if (h2Match) {
      children.push(new Paragraph({ text: h2Match[1], heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
    } else if (h3Match) {
      children.push(new Paragraph({ text: h3Match[1], heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } }));
    } else if (bulletMatch) {
      children.push(new Paragraph({ children: [new TextRun({ text: "• " + bulletMatch[1], size: 22 })], indent: { left: 720 }, spacing: { after: 80 } }));
    } else if (numberedMatch) {
      children.push(new Paragraph({ children: [new TextRun({ text: `${numberedMatch[1]}. ${numberedMatch[2]}`, size: 22 })], indent: { left: 720 }, spacing: { after: 80 } }));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runs: any[] = [];
      const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
      for (const part of parts) {
        const boldMatch = part.match(/^\*\*(.+)\*\*$/);
        const italicMatch = part.match(/^\*(.+)\*$/);
        if (boldMatch) runs.push(new TextRun({ text: boldMatch[1], bold: true, size: 22 }));
        else if (italicMatch) runs.push(new TextRun({ text: italicMatch[1], italics: true, size: 22 }));
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
    styles: {
      default: {
        document: { run: { font: "맑은 고딕", size: 22 } },
      },
    },
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${filename}.docx`);
}

export async function downloadAsHwpx(content: string, filename = "특허명세서"): Promise<void> {
  const JSZip = (await import("jszip")).default;

  const plainText = markdownToPlainText(content);
  const paragraphs = plainText.split("\n").filter((l) => l.trim());

  const paraCells = paragraphs
    .map((text, i) => `
    <hp:p id="${i}" paraPrIDRef="0" styleIDRef="Normal" pageBreak="false" columnBreak="false" merged="false">
      <hp:run charPrIDRef="0">
        <hp:t>${escapeXml(text)}</hp:t>
      </hp:run>
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
  <hh:compatibleDocument targetProgram="HWP201X">
    <hh:layoutCompatibility/>
  </hh:compatibleDocument>
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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

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
