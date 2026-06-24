/**
 * 로컬 파일 → 텍스트 추출 유틸리티
 * 지원: TXT, MD, PDF, DOCX, HWP(텍스트만), 이미지(파일명 안내)
 */

export interface ParsedFile {
  name: string;
  type: string;
  text: string;
  size: number;
}

/* ─── TXT / MD / CSV 등 텍스트 계열 ─── */
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}

/* ─── DOCX → 텍스트 (mammoth) ─── */
async function readDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/* ─── PDF → 텍스트 (pdfjs-dist) ─── */
async function readPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

/* ─── 메인 파서 ─── */
export async function parseFile(file: File): Promise<ParsedFile> {
  const name = file.name;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const type = file.type;
  let text = "";

  try {
    if (["txt", "md", "csv", "json", "xml", "html", "htm"].includes(ext)) {
      text = await readAsText(file);
    } else if (ext === "docx" || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      text = await readDocx(file);
    } else if (ext === "pdf" || type === "application/pdf") {
      text = await readPdf(file);
    } else if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) {
      text = `[이미지 파일 첨부됨: ${name}]\n이미지 파일은 텍스트 추출이 지원되지 않습니다. 파일명을 참고하여 관련 내용을 설명해주세요.`;
    } else if (["hwp", "hwpx"].includes(ext)) {
      text = `[한글 파일 첨부됨: ${name}]\n한글(.hwp/.hwpx) 파일은 직접 파싱이 제한됩니다. 파일 내용을 텍스트로 복사하여 붙여넣기 해주세요.`;
    } else {
      text = await readAsText(file).catch(() => `[${name}] 파일 내용을 읽을 수 없습니다.`);
    }
  } catch (e) {
    text = `[파일 읽기 오류: ${name}] ${e instanceof Error ? e.message : "알 수 없는 오류"}`;
  }

  // 텍스트가 너무 길면 앞 8000자만 사용
  const MAX_CHARS = 8000;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) + `\n\n...[이하 ${(text.length - MAX_CHARS).toLocaleString()}자 생략 - 파일이 너무 큼]`;
  }

  return { name, type: ext, text, size: file.size };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export const ACCEPTED_EXTENSIONS = ".txt,.md,.pdf,.docx,.csv,.json,.html,.hwp,.hwpx";
