# 한국 특허 플랫폼 — 개발 명세서 v1.0

> 작성일: 2026-06-23 | 저자: kimlawtech (SpeciAI)

---

## 1. 프로젝트 개요

### 1.1 배경

| 기존 프로젝트 | 역할 | 한계 |
|---|---|---|
| `kimlawtech/korean-patent-diagram` | Claude Code 스킬 — matplotlib 기반 KIPO 규격 도면 PNG 생성 | 로컬 Python 실행만 가능, 웹 서비스 불가 |
| `Tech-curator/korean-patent-mcp` | Python MCP 서버 — KIPRIS API 통합 (특허 검색·상세·인용) | AI 클라이언트 전용, 브라우저 접근 불가 |

### 1.2 목표

두 프로젝트를 융합하여 **변리사·발명자를 위한 올인원 한국 특허 웹 플랫폼** 구축.

- KIPRIS API로 실시간 특허 검색
- 검색 결과 → AI 분석 → KIPO 규격 도면 자동 생성
- 검색 이력·생성 도면 Neon DB 저장
- Vercel 서버리스 배포

---

## 2. 기술 스택

| 영역 | 기술 | 선택 이유 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | Vercel 최적화, RSC, API Route |
| 언어 | TypeScript | 타입 안전성 |
| 스타일 | Tailwind CSS + shadcn/ui | 빠른 현대적 UI |
| 데이터베이스 | Neon PostgreSQL | 서버리스 PostgreSQL, Vercel Edge 지원 |
| 외부 API | KIPRIS Plus Open API | KIPO 공식 특허 데이터 |
| 도면 생성 | SVG (React) + Canvas API | Python 의존성 없이 KIPO 규격 도면 생성 |
| 배포 | Vercel | Next.js 공식 플랫폼 |
| 아이콘 | Lucide React | shadcn/ui 표준 |

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    브라우저 클라이언트                     │
│  홈(검색) → 검색결과 → 특허상세 → 도면생성 → 다운로드        │
└─────────────┬───────────────────────┬───────────────┘
              │ Next.js App Router     │
┌─────────────▼───────────────────────▼───────────────┐
│                  Vercel (서버리스)                      │
│                                                       │
│  API Routes:                                          │
│  /api/patents/search   ←→  KIPRIS Plus Open API      │
│  /api/patents/detail   ←→  plus.kipris.or.kr          │
│  /api/patents/citing   ←→  (XML REST API)             │
│  /api/diagrams/generate  (SVG 생성 엔진)               │
│  /api/diagrams/save    ←→  Neon PostgreSQL            │
│  /api/history          ←→  Neon PostgreSQL            │
│                                                       │
└─────────────────────────────────────────────────────┘
                          │
              ┌───────────▼──────────┐
              │   Neon PostgreSQL    │
              │  searches (검색이력)  │
              │  patents (캐시)       │
              │  diagrams (도면이력)  │
              └──────────────────────┘
```

---

## 4. 데이터베이스 스키마

```sql
-- 검색 이력
CREATE TABLE searches (
  id          SERIAL PRIMARY KEY,
  query       TEXT NOT NULL,           -- 검색어 (출원인명)
  result_count INTEGER,               -- 검색 결과 수
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 특허 캐시 (KIPRIS API 호출 최소화)
CREATE TABLE patents (
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
);

-- 생성된 도면 이력
CREATE TABLE diagrams (
  id                  SERIAL PRIMARY KEY,
  application_number  TEXT,            -- 연관 특허 (nullable)
  diagram_type        TEXT NOT NULL,   -- flowchart|block|state|graph|process
  patent_content      TEXT,            -- 입력된 명세서 내용
  svg_content         TEXT,            -- 생성된 SVG 데이터
  filing_type         TEXT DEFAULT 'K', -- K(국내) | P(PCT)
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_searches_created ON searches(created_at DESC);
CREATE INDEX idx_patents_appnum ON patents(application_number);
CREATE INDEX idx_diagrams_created ON diagrams(created_at DESC);
CREATE INDEX idx_diagrams_appnum ON diagrams(application_number);
```

---

## 5. API 명세

### 5.1 특허 검색

```
GET /api/patents/search
  ?q={출원인명}
  &page={1}
  &size={20}
  &status={A|R|J|}

Response: {
  patents: Patent[],
  total_count: number,
  page: number,
  has_more: boolean
}
```

### 5.2 특허 상세

```
GET /api/patents/detail?appNum={출원번호}

Response: Patent (상세 정보 포함)
```

### 5.3 인용 특허

```
GET /api/patents/citing?appNum={출원번호}

Response: CitingPatent[]
```

### 5.4 도면 생성

```
POST /api/diagrams/generate
Body: {
  content: string,       // 명세서 내용
  type?: DiagramType,    // 미지정시 자동 감지
  filingType?: 'K'|'P',
  diagramNo?: string,
  totalPages?: number
}

Response: {
  svg: string,          // SVG 마크업
  type: DiagramType,
  detected: boolean     // 자동 감지 여부
}
```

### 5.5 도면 저장

```
POST /api/diagrams/save
Body: { diagramId, applicationNumber?, title }

Response: { id: number }
```

---

## 6. 페이지 구조

| 경로 | 설명 |
|---|---|
| `/` | 홈 — 특허 검색 입력 + 최근 검색 이력 |
| `/search?q=삼성전자` | 검색 결과 목록 (페이지네이션) |
| `/patent/[appNum]` | 특허 상세 + 인용 특허 + 도면 생성 버튼 |
| `/diagram` | 독립 도면 생성기 (명세서 직접 입력) |
| `/history` | 생성 도면 이력 |

---

## 7. 도면 생성 엔진 (SVG 기반)

Python/matplotlib 구현을 TypeScript/SVG로 포팅.

| 도면 유형 | 크기 | 방향 | 주요 요소 |
|---|---|---|---|
| flowchart | A4 (794×1123px@96dpi) | 세로 | 타원·사각형·마름모·화살표 |
| block | A4 (1123×794px@96dpi) | 가로 | 블록·화살표·점선박스 |
| state | A4 (794×1123px@96dpi) | 세로 | 원·이중원·전이화살표 |
| graph | A5 (794×561px@96dpi) | 가로 | 선그래프·격자·범례 |
| process | A4 (794×1123px@96dpi) | 세로 | 사각형·평행사변형·마름모 |

**KIPO 규격 준수:**
- 해상도: 300 DPI (PNG 출력 시 3x 스케일)
- 색상: 흑백 전용
- 폰트: Noto Sans KR (한글 지원)
- 선 굵기: 외곽 2px, 보조 1.5px
- 도면 번호: 우측 하단 "도 N"
- 면수: 우측 상단 "N/M"

---

## 8. korea-patent-mcp 통합 가능 여부

### 결론: **부분 통합 가능 (API 레이어 직접 포팅)**

| 항목 | 결론 |
|---|---|
| Python MCP 서버 직접 실행 | ❌ Vercel 서버리스 환경 불가 |
| KIPRIS API 호출 로직 포팅 | ✅ TypeScript로 재구현 |
| 동일한 KIPRIS REST API 엔드포인트 사용 | ✅ 동일 |
| MCP 프로토콜 | ❌ 불필요 (웹 API로 대체) |

**포팅 대상:**
- `kipris_api.py` → `lib/kipris.ts` (TypeScript 재구현)
- 3개 Tool → Next.js API Route 3개

---

## 9. 환경 변수

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require

# KIPRIS Plus Open API (https://plus.kipris.or.kr)
KIPRIS_API_KEY=your_key_here

# (선택) 캐시 설정
CACHE_TTL=3600
```

---

## 10. 구현 단계

| 단계 | 작업 | 우선순위 |
|---|---|---|
| 1 | Next.js 프로젝트 셋업 | 필수 |
| 2 | Neon DB 연결 + 스키마 | 필수 |
| 3 | KIPRIS API 클라이언트 | 필수 |
| 4 | 특허 검색/상세/인용 API | 필수 |
| 5 | SVG 도면 생성 엔진 | 필수 |
| 6 | 홈·검색·상세 페이지 | 필수 |
| 7 | 도면 생성기 페이지 | 필수 |
| 8 | 이력 페이지 | 선택 |
| 9 | Vercel 배포 | 필수 |
