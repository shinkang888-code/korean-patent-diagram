/**
 * KIPRIS Plus Open API 클라이언트
 * Tech-curator/korean-patent-mcp의 Python 구현을 TypeScript로 포팅
 * 원본: https://github.com/Tech-curator/korean-patent-mcp
 */

const KIPRIS_BASE_URL = "http://plus.kipris.or.kr/openapi/rest";

const ENDPOINTS = {
  applicantSearch: "/patUtiModInfoSearchSevice/applicantNameSearchInfo",
  applicationSearch: "/patUtiModInfoSearchSevice/applicationNumberSearchInfo",
  citingInfo: "/CitingService/citingInfo",
} as const;

// ── 공개 타입 정의 ──────────────────────────────────────────────

export interface Patent {
  application_number: string;
  application_date: string | null;
  title: string | null;
  applicant: string | null;
  registration_status: string | null;
  opening_number: string | null;
  opening_date: string | null;
  registration_number: string | null;
  registration_date: string | null;
  abstract?: string | null;
  ipc_number?: string | null;
}

export interface SearchResult {
  patents: Patent[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
  next_page: number | null;
}

export interface CitingPatent {
  citing_application_number: string | null;
  standard_citation_number: string | null;
  status_code: string | null;
  status_name: string | null;
  citation_type_code: string | null;
  citation_type_name: string | null;
}

// ── 내부 XML 파서 ────────────────────────────────────────────────

interface XmlNode {
  tagName: string;
  textContent: string;
  children: XmlNode[];
  querySelector(selector: string): XmlNode | null;
  querySelectorAll(selector: string): XmlNode[];
}

function xmlFindFirst(nodes: XmlNode[], tag: string): XmlNode | null {
  for (const node of nodes) {
    if (node.tagName === tag) return node;
    const found = xmlFindFirst(node.children, tag);
    if (found) return found;
  }
  return null;
}

function xmlFindAll(nodes: XmlNode[], tag: string): XmlNode[] {
  const results: XmlNode[] = [];
  for (const node of nodes) {
    if (node.tagName === tag) results.push(node);
    results.push(...xmlFindAll(node.children, tag));
  }
  return results;
}

function buildXmlNode(tagName: string, content: string): XmlNode {
  const children: XmlNode[] = [];
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9_]*)(?:\s[^>]*)?>([^]*?)<\/\1>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(content)) !== null) {
    children.push(buildXmlNode(match[1], match[2]));
  }
  const textContent = content.replace(/<[^>]+>/g, "").trim();
  return {
    tagName,
    textContent,
    children,
    querySelector: (tag: string) => xmlFindFirst(children, tag),
    querySelectorAll: (tag: string) => xmlFindAll(children, tag),
  };
}

function parseXml(xmlText: string): XmlNode {
  return buildXmlNode("root", xmlText);
}

// ── API 헬퍼 ────────────────────────────────────────────────────

/**
 * API 키 우선순위: 쿠키 > 환경변수
 * 쿠키는 서버 컴포넌트/API Route에서 next/headers로 읽음
 */
export async function getApiKey(): Promise<string> {
  // 1) 환경변수
  const envKey = process.env.KIPRIS_API_KEY;

  // 2) 쿠키 (Next.js 서버사이드)
  let cookieKey: string | undefined;
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    cookieKey = store.get("kipris_api_key")?.value;
  } catch {
    // 쿠키 접근 불가 환경 (Edge 등)
  }

  const key = cookieKey || envKey;
  if (!key) {
    throw new Error(
      "KIPRIS API 키가 설정되지 않았습니다. 설정 페이지(/settings)에서 API 키를 입력하거나 KIPRIS_API_KEY 환경변수를 설정하세요."
    );
  }
  return key;
}

/** API 키 설정 여부 확인 */
export async function hasApiKey(): Promise<boolean> {
  try {
    await getApiKey();
    return true;
  } catch {
    return false;
  }
}

async function makeRequest(
  endpoint: string,
  params: Record<string, string>
): Promise<XmlNode | null> {
  const apiKey = await getApiKey();
  const url = new URL(`${KIPRIS_BASE_URL}${endpoint}`);
  Object.entries({ ...params, accessKey: apiKey }).forEach(([k, v]) =>
    url.searchParams.set(k, v)
  );

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`KIPRIS API 오류: ${res.status}`);

  const text = await res.text();
  return parseXml(text);
}

// ── 파싱 헬퍼 ───────────────────────────────────────────────────

function parsePatentInfo(item: XmlNode, detailed = false): Patent {
  const get = (tag: string): string | null =>
    item.querySelector(tag)?.textContent?.trim() ?? null;

  const patent: Patent = {
    application_number: get("ApplicationNumber") ?? "",
    application_date: get("ApplicationDate"),
    title: get("InventionName"),
    applicant: get("Applicant"),
    registration_status: get("RegistrationStatus"),
    opening_number: get("OpeningNumber"),
    opening_date: get("OpeningDate"),
    registration_number: get("RegistrationNumber"),
    registration_date: get("RegistrationDate"),
  };

  if (detailed) {
    patent.abstract = get("Abstract");
    patent.ipc_number = get("InternationalpatentclassificationNumber");
  }

  return patent;
}

// ── 공개 API ────────────────────────────────────────────────────

export async function searchPatentsByApplicant(
  applicantName: string,
  page = 1,
  pageSize = 20,
  status = ""
): Promise<SearchResult> {
  const root = await makeRequest(ENDPOINTS.applicantSearch, {
    applicant: applicantName,
    docsStart: String(page),
    docsCount: String(Math.min(pageSize, 500)),
    patent: "true",
    utility: "false",
    lastvalue: status,
  });

  if (!root) {
    return { patents: [], total_count: 0, page, page_size: 0, has_more: false, next_page: null };
  }

  const totalEl = root.querySelector("TotalSearchCount");
  const totalCount = totalEl?.textContent ? parseInt(totalEl.textContent, 10) : 0;

  const items = root.querySelectorAll("PatentUtilityInfo");
  const patents = items.map((item) => parsePatentInfo(item));

  return {
    patents,
    total_count: totalCount,
    page,
    page_size: patents.length,
    has_more: page * pageSize < totalCount,
    next_page: page * pageSize < totalCount ? page + 1 : null,
  };
}

export async function getPatentDetail(
  applicationNumber: string
): Promise<Patent | null> {
  const cleanNum = applicationNumber.replace(/-/g, "");
  const root = await makeRequest(ENDPOINTS.applicationSearch, {
    applicationNumber: cleanNum,
    docsStart: "1",
  });

  if (!root) return null;
  const item = root.querySelector("PatentUtilityInfo");
  if (!item) return null;
  return parsePatentInfo(item, true);
}

export async function getCitingPatents(
  applicationNumber: string
): Promise<CitingPatent[]> {
  const cleanNum = applicationNumber.replace(/-/g, "");
  const root = await makeRequest(ENDPOINTS.citingInfo, {
    standardCitationApplicationNumber: cleanNum,
  });

  if (!root) return [];

  return root.querySelectorAll("citingInfo").map((item) => {
    const get = (tag: string): string | null =>
      item.querySelector(tag)?.textContent?.trim() ?? null;
    return {
      citing_application_number: get("ApplicationNumber"),
      standard_citation_number: get("StandardCitationApplicationNumber"),
      status_code: get("StandardStatusCode"),
      status_name: get("StandardStatusCodeName"),
      citation_type_code: get("CitationLiteratureTypeCode"),
      citation_type_name: get("CitationLiteratureTypeCodeName"),
    };
  });
}
