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

function getApiKey(): string {
  const key = process.env.KIPRIS_API_KEY;
  if (!key) {
    throw new Error("KIPRIS_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return key;
}

function parsePatentInfo(item: XmlNode, detailed = false): Patent {
  const getText = (tag: string) =>
    item.querySelector(tag)?.textContent?.trim() ?? null;

  const patent: Patent = {
    application_number: getText("ApplicationNumber") ?? "",
    application_date: getText("ApplicationDate"),
    title: getText("InventionName"),
    applicant: getText("Applicant"),
    registration_status: getText("RegistrationStatus"),
    opening_number: getText("OpeningNumber"),
    opening_date: getText("OpeningDate"),
    registration_number: getText("RegistrationNumber"),
    registration_date: getText("RegistrationDate"),
  };

  if (detailed) {
    patent.abstract = getText("Abstract");
    patent.ipc_number = getText("InternationalpatentclassificationNumber");
  }

  return patent;
}

/**
 * 단순 XML 파서 (외부 DOM 라이브러리 없이 서버사이드 처리)
 */
function parseXml(xmlText: string): XmlNode {
  return createXmlNode("root", xmlText);
}

interface XmlNode {
  tagName: string;
  textContent: string;
  children: XmlNode[];
  querySelector(selector: string): XmlNode | null;
  querySelectorAll(selector: string): XmlNode[];
}

function findFirst(nodes: XmlNode[], selector: string): XmlNode | null {
  for (const node of nodes) {
    if (node.tagName === selector) return node;
    const found = findFirst(node.children, selector);
    if (found) return found;
  }
  return null;
}

function findAll(nodes: XmlNode[], selector: string): XmlNode[] {
  const results: XmlNode[] = [];
  for (const node of nodes) {
    if (node.tagName === selector) results.push(node);
    results.push(...findAll(node.children, selector));
  }
  return results;
}

function createXmlNode(tagName: string, content: string): XmlNode {
  const children: XmlNode[] = [];

  const tagRegex = /<([a-zA-Z][a-zA-Z0-9_]*)(?:\s[^>]*)?>([^]*?)<\/\1>/g;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    children.push(createXmlNode(match[1], match[2]));
  }

  const textContent = content.replace(/<[^>]+>/g, "").trim();

  return {
    tagName,
    textContent,
    children,
    querySelector: (selector: string) => findFirst(children, selector),
    querySelectorAll: (selector: string) => findAll(children, selector),
  };
}

async function makeRequest(
  endpoint: string,
  params: Record<string, string>
): Promise<XmlNode | null> {
  const apiKey = getApiKey();
  const url = new URL(`${KIPRIS_BASE_URL}${endpoint}`);

  Object.entries({ ...params, accessKey: apiKey }).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`KIPRIS API 오류: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  return parseXml(text);
}

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

  const items = root.querySelectorAll("citingInfo");
  return items.map((item) => {
    const getText = (tag: string) =>
      item.querySelector(tag)?.textContent?.trim() ?? null;
    return {
      citing_application_number: getText("ApplicationNumber"),
      standard_citation_number: getText("StandardCitationApplicationNumber"),
      status_code: getText("StandardStatusCode"),
      status_name: getText("StandardStatusCodeName"),
      citation_type_code: getText("CitationLiteratureTypeCode"),
      citation_type_name: getText("CitationLiteratureTypeCodeName"),
    };
  });
}
