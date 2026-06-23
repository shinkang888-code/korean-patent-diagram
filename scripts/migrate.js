#!/usr/bin/env node
/**
 * Neon DB 스키마 마이그레이션 스크립트
 * 사용법: node scripts/migrate.js
 */
require("dotenv").config({ path: ".env.local" });

const { neon } = require("@neondatabase/serverless");

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL 환경변수가 설정되지 않았습니다.");
    console.error("   .env.local 파일을 확인하세요.");
    process.exit(1);
  }

  const sql = neon(dbUrl);
  console.log("📦 Neon DB 마이그레이션 시작...");

  await sql`
    CREATE TABLE IF NOT EXISTS searches (
      id          SERIAL PRIMARY KEY,
      query       TEXT NOT NULL,
      result_count INTEGER DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("✅ searches 테이블");

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
  console.log("✅ patents 테이블");

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
  console.log("✅ diagrams 테이블");

  await sql`CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_patents_appnum ON patents(application_number)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_diagrams_created ON diagrams(created_at DESC)`;
  console.log("✅ 인덱스");

  console.log("\n🎉 마이그레이션 완료!");
}

migrate().catch((e) => {
  console.error("❌ 마이그레이션 실패:", e.message);
  process.exit(1);
});
