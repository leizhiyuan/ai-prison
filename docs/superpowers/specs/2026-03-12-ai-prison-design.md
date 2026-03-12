# AI Prison — Design Spec

## Overview

An AI accountability and transparency platform using a "prison" brand metaphor. It collects AI model failure cases, displays them as "criminal records", and ranks models by their incident history.

## Brand Concept

- Platform name: **AI Prison** / **AI 监狱**
- Cases = "服刑记录" (criminal records)
- Models = "犯人" (criminals/inmates)
- Severity levels = "刑期" (sentence length)
- Rankings = "通缉令排行榜" (most-wanted list)
- Submission = "举报" (report/tip)
- Pending review = "案件受理中"

## Tech Stack

- **Frontend**: Astro (SSR mode with Islands architecture)
- **Hosting**: Cloudflare Pages
- **API**: Cloudflare Workers (Hono framework)
- **Database**: Cloudflare D1 (SQLite)
- **Styling**: Tailwind CSS (dark cyberpunk theme)
- **Language**: Bilingual (Chinese primary, English secondary)

## Architecture

```
Cloudflare Pages (Astro SSR)
  └── API calls → Cloudflare Workers (Hono)
                      └── Cloudflare D1 (SQLite)
```

Astro runs in SSR mode on Cloudflare Pages. The Workers API is a separate service bound to the Pages project.

## Database Schema

### `models` table
```sql
CREATE TABLE models (
  id TEXT PRIMARY KEY,           -- e.g. "gpt-4o"
  name TEXT NOT NULL,            -- Display name
  name_en TEXT NOT NULL,         -- English name
  provider TEXT NOT NULL,        -- e.g. "OpenAI"
  incident_count INTEGER DEFAULT 0,
  severity_score REAL DEFAULT 0, -- weighted score for ranking
  created_at INTEGER NOT NULL    -- Unix timestamp
);
```

### `cases` table
```sql
CREATE TABLE cases (
  id TEXT PRIMARY KEY,           -- nanoid
  model_id TEXT NOT NULL REFERENCES models(id),
  title TEXT NOT NULL,           -- Chinese title
  title_en TEXT NOT NULL,        -- English title
  description TEXT NOT NULL,     -- Chinese description
  description_en TEXT NOT NULL,  -- English description
  category TEXT NOT NULL,        -- hallucination|bias|safety|privacy|other
  severity INTEGER NOT NULL,     -- 1-5
  source_url TEXT,               -- optional source link
  status TEXT DEFAULT 'pending', -- pending|approved|rejected
  created_at INTEGER NOT NULL
);
```

## Pages / Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage: hero, latest approved cases, top 5 rankings |
| `/cases` | Case list with filter by model/category/severity |
| `/cases/[id]` | Case detail page |
| `/rankings` | Full rankings page (most-wanted list style) |
| `/submit` | Anonymous submission form |
| `/admin` | Password-protected admin panel |

## API Endpoints (Workers)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cases` | List approved cases (paginated, filterable) |
| GET | `/api/cases/:id` | Single case detail |
| GET | `/api/models` | List all models with stats |
| GET | `/api/rankings` | Model rankings |
| POST | `/api/submit` | Submit new case (anonymous) |
| GET | `/api/admin/pending` | List pending cases (auth required) |
| POST | `/api/admin/approve/:id` | Approve case (auth required) |
| POST | `/api/admin/reject/:id` | Reject case (auth required) |

## Admin Authentication

Simple Bearer token stored as a Cloudflare Workers environment secret (`ADMIN_TOKEN`). No user accounts needed.

## Visual Design

- **Color palette**: `#0a0a0a` background, `#00ff41` (matrix green) accents, `#ff3333` danger red, `#888` muted gray
- **Typography**: Monospace font (`JetBrains Mono` or `Courier New`) for "terminal" feel
- **UI motifs**: Scanlines overlay, flickering text effects, "CLASSIFIED" stamps on cards
- **Severity display**:
  - 1 = ⚠️ 警告 (Warning)
  - 2 = 🔒 拘留 (Detention)
  - 3 = ⛓️ 有期徒刑 (Fixed term)
  - 4 = 🔴 重刑 (Heavy sentence)
  - 5 = ☠️ 无期 (Life sentence)

## Category Labels

| Key | Chinese | English |
|-----|---------|---------|
| hallucination | 幻觉 | Hallucination |
| bias | 偏见 | Bias |
| safety | 安全风险 | Safety Risk |
| privacy | 隐私泄露 | Privacy Leak |
| other | 其他 | Other |

## Seed Data

Pre-load 5-10 well-known AI failure cases on first deployment to make the platform immediately useful.

## File Structure

```
ai-prison/
├── apps/
│   ├── web/                    # Astro frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── CaseCard.astro
│   │   │   │   ├── ModelBadge.astro
│   │   │   │   ├── SeverityBadge.astro
│   │   │   │   ├── RankingTable.astro
│   │   │   │   └── SubmitForm.astro  (React Island)
│   │   │   ├── layouts/
│   │   │   │   └── Layout.astro
│   │   │   ├── pages/
│   │   │   │   ├── index.astro
│   │   │   │   ├── cases/
│   │   │   │   │   ├── index.astro
│   │   │   │   │   └── [id].astro
│   │   │   │   ├── rankings.astro
│   │   │   │   ├── submit.astro
│   │   │   │   └── admin.astro
│   │   │   └── styles/
│   │   │       └── global.css
│   │   ├── astro.config.mjs
│   │   ├── tailwind.config.mjs
│   │   └── package.json
│   └── worker/                 # Cloudflare Workers API
│       ├── src/
│       │   ├── index.ts        # Hono app entry
│       │   ├── routes/
│       │   │   ├── cases.ts
│       │   │   ├── models.ts
│       │   │   ├── rankings.ts
│       │   │   ├── submit.ts
│       │   │   └── admin.ts
│       │   ├── db/
│       │   │   ├── schema.sql
│       │   │   └── seed.sql
│       │   └── middleware/
│       │       └── auth.ts
│       ├── wrangler.toml
│       └── package.json
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```
