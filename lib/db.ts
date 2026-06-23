/**
 * Neon PostgreSQL 연결 클라이언트
 */
import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  }
  return neon(url);
}

export async function initDb() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS searches (
      id          SERIAL PRIMARY KEY,
      query       TEXT NOT NULL,
      result_count INTEGER DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS patents (
      id                  SERIAL PRIMARY KEY,
      application_number  TEXT UNIQUE NOT NULL,
      title               TEXT,
      applicant           TEXT,
      application_date    TEXT,
      registration_status TEXT,
      opening_number      TEXT,
      registration_number TEXT,
      abstract            TEXT,
      ipc_number          TEXT,
      raw_data            JSONB,
      cached_at           TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS diagrams (
      id                  SERIAL PRIMARY KEY,
      application_number  TEXT,
      diagram_type        TEXT NOT NULL,
      patent_content      TEXT,
      svg_content         TEXT,
      filing_type         TEXT DEFAULT 'K',
      created_at          TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_patents_appnum ON patents(application_number)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_diagrams_created ON diagrams(created_at DESC)`;
}

export async function logSearch(query: string, resultCount: number) {
  try {
    const sql = getDb();
    await sql`INSERT INTO searches (query, result_count) VALUES (${query}, ${resultCount})`;
  } catch {
    // DB 없이도 동작
  }
}

export async function getRecentSearches(limit = 10) {
  try {
    const sql = getDb();
    return await sql`
      SELECT DISTINCT ON (query) query, result_count, created_at
      FROM searches
      ORDER BY query, created_at DESC
      LIMIT ${limit}
    `;
  } catch {
    return [];
  }
}

export async function saveDiagram(data: {
  applicationNumber?: string;
  diagramType: string;
  patentContent?: string;
  svgContent: string;
  filingType?: string;
}) {
  try {
    const sql = getDb();
    const result = await sql`
      INSERT INTO diagrams (application_number, diagram_type, patent_content, svg_content, filing_type)
      VALUES (
        ${data.applicationNumber ?? null},
        ${data.diagramType},
        ${data.patentContent ?? null},
        ${data.svgContent},
        ${data.filingType ?? "K"}
      )
      RETURNING id
    `;
    return result[0]?.id;
  } catch {
    return null;
  }
}

export async function getRecentDiagrams(limit = 20) {
  try {
    const sql = getDb();
    return await sql`
      SELECT id, application_number, diagram_type, filing_type, created_at,
             LEFT(patent_content, 100) as content_preview
      FROM diagrams
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  } catch {
    return [];
  }
}
