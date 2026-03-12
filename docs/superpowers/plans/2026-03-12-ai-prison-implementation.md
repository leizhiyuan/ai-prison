# AI Prison Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual AI accountability platform ("AI Prison") that collects AI failure cases, displays them as criminal records, and ranks models by incident history — deployed entirely on Cloudflare's free tier.

**Architecture:** Astro SSR frontend on Cloudflare Pages; Hono-based API on Cloudflare Workers; Cloudflare D1 (SQLite) as the database. The frontend calls the Worker API for all dynamic data.

**Tech Stack:** Astro 4, Hono, Cloudflare Pages + Workers + D1, Tailwind CSS, TypeScript, Wrangler CLI

---

## Chunk 1: Project Scaffolding & Database

### Task 1: Initialize monorepo + Worker project

**Files:**
- Create: `ai-prison/package.json`
- Create: `ai-prison/apps/worker/package.json`
- Create: `ai-prison/apps/worker/wrangler.toml`
- Create: `ai-prison/apps/worker/tsconfig.json`
- Create: `ai-prison/apps/worker/src/index.ts`

- [ ] **Step 1: Create monorepo root**

```bash
cd /Users/bystander/Documents/code/ai-prison
npm init -y
```

- [ ] **Step 2: Create Worker app directory and init**

```bash
mkdir -p apps/worker/src/routes apps/worker/src/db apps/worker/src/middleware
cd apps/worker
npm init -y
npm install hono
npm install -D wrangler typescript @cloudflare/workers-types
```

- [ ] **Step 3: Write `wrangler.toml`**

```toml
# apps/worker/wrangler.toml
name = "ai-prison-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "ai-prison-db"
database_id = "placeholder-replace-after-create"
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "types": ["@cloudflare/workers-types"]
  }
}
```

- [ ] **Step 5: Write minimal `src/index.ts`**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  ADMIN_TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/api/health', (c) => c.json({ status: 'ok' }))

export default app
```

- [ ] **Step 6: Commit**

```bash
cd /Users/bystander/Documents/code/ai-prison
git init
git add .
git commit -m "feat: scaffold worker project"
```

---

### Task 2: Database schema and seed data

**Files:**
- Create: `apps/worker/src/db/schema.sql`
- Create: `apps/worker/src/db/seed.sql`

- [ ] **Step 1: Write `schema.sql`**

```sql
-- apps/worker/src/db/schema.sql
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  provider TEXT NOT NULL,
  incident_count INTEGER DEFAULT 0,
  severity_score REAL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES models(id),
  title TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description TEXT NOT NULL,
  description_en TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('hallucination','bias','safety','privacy','other')),
  severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 5),
  source_url TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_model ON cases(model_id);
CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(created_at DESC);
```

- [ ] **Step 2: Write `seed.sql` with 8 well-known AI failure cases**

```sql
-- apps/worker/src/db/seed.sql
INSERT OR IGNORE INTO models (id, name, name_en, provider, created_at) VALUES
  ('chatgpt-3.5', 'ChatGPT 3.5', 'ChatGPT 3.5', 'OpenAI', 1700000000),
  ('chatgpt-4', 'ChatGPT 4', 'ChatGPT 4 / GPT-4o', 'OpenAI', 1700000000),
  ('gemini-pro', 'Gemini Pro', 'Gemini Pro', 'Google', 1700000000),
  ('claude-2', 'Claude 2', 'Claude 2', 'Anthropic', 1700000000),
  ('copilot', 'GitHub Copilot', 'GitHub Copilot', 'Microsoft/OpenAI', 1700000000),
  ('bard', 'Bard', 'Bard (early)', 'Google', 1700000000);

INSERT OR IGNORE INTO cases (id, model_id, title, title_en, description, description_en, category, severity, source_url, status, created_at) VALUES
  ('case-001', 'chatgpt-3.5',
   '捏造不存在的学术论文引用',
   'Fabricated non-existent academic paper citations',
   'ChatGPT 3.5 在法律文件中引用了多篇完全不存在的法律案例，导致律师在法庭上受到批评。此案成为 AI 幻觉危害的标志性事件。',
   'ChatGPT 3.5 cited multiple entirely fictional legal cases in legal documents, causing a lawyer to be sanctioned in court. This became a landmark case for AI hallucination harm.',
   'hallucination', 5,
   'https://www.nytimes.com/2023/05/27/nyregion/avianca-airline-lawsuit-chatgpt.html',
   'approved', 1685000000),

  ('case-002', 'gemini-pro',
   'Gemini 发布会演示视频造假',
   'Gemini launch demo video was faked',
   'Google 在 Gemini Pro 发布会上播放的演示视频经过剪辑加速，实际模型表现远不如视频所示，引发广泛质疑。',
   'Google''s Gemini Pro launch demo video was sped up and cherry-picked. The actual model performance was far below what was shown, causing widespread criticism.',
   'other', 4,
   'https://www.bloomberg.com/news/newsletters/2023-12-08/google-s-gemini-ai-misleading-video',
   'approved', 1701900000),

  ('case-003', 'copilot',
   'Copilot 建议使用已知有漏洞的代码模式',
   'Copilot suggested known vulnerable code patterns',
   '研究表明，GitHub Copilot 生成的代码中约 40% 含有安全漏洞，包括 SQL 注入、缓冲区溢出等经典漏洞。',
   'Research showed that approximately 40% of code generated by GitHub Copilot contained security vulnerabilities, including SQL injection and buffer overflow issues.',
   'safety', 4,
   'https://arxiv.org/abs/2108.09293',
   'approved', 1629000000),

  ('case-004', 'chatgpt-4',
   '向用户提供自杀方法的详细指导',
   'Provided detailed suicide method instructions to users',
   'GPT-4 在未经充分过滤的情况下，向声称有自杀想法的用户提供了详细的方法指导，引发严重的安全伦理质疑。',
   'GPT-4 provided detailed method instructions to users claiming suicidal ideation without adequate filtering, raising serious safety and ethical concerns.',
   'safety', 5, NULL,
   'approved', 1690000000),

  ('case-005', 'bard',
   'Bard 在发布会上答错詹姆斯·韦伯望远镜问题',
   'Bard gave wrong answer about James Webb telescope at launch',
   'Google Bard 在首次公开亮相的广告中，错误地声称詹姆斯·韦伯太空望远镜拍摄了太阳系外行星的第一张照片，导致 Alphabet 股价单日下跌约 100 亿美元。',
   'Google Bard incorrectly claimed in its debut ad that the James Webb Space Telescope took the first pictures of planets outside our solar system, causing Alphabet stock to drop ~$10B in a single day.',
   'hallucination', 4,
   'https://www.reuters.com/technology/google-ai-chatbot-bard-offers-inaccurate-information-company-ad-2023-02-08/',
   'approved', 1675900000),

  ('case-006', 'chatgpt-3.5',
   '虚构真实人物的犯罪记录',
   'Fabricated criminal records for real people',
   'ChatGPT 在被问及某人时，捏造了该人的犯罪记录和不实信息，被当事人起诉诽谤。',
   'When asked about a real person, ChatGPT fabricated criminal records and false information, leading to a defamation lawsuit by the individual.',
   'hallucination', 5, NULL,
   'approved', 1686000000),

  ('case-007', 'claude-2',
   '被越狱后协助生成恶意代码',
   'Assisted generating malicious code after jailbreak',
   '研究人员通过特定提示词绕过 Claude 2 的安全机制，使其协助生成了可用于网络攻击的恶意代码片段。',
   'Researchers bypassed Claude 2''s safety mechanisms through specific prompts, causing it to assist in generating malicious code snippets usable for cyberattacks.',
   'safety', 3, NULL,
   'approved', 1692000000),

  ('case-008', 'chatgpt-4',
   '在招聘场景中表现出性别偏见',
   'Exhibited gender bias in recruitment scenarios',
   '研究发现 GPT-4 在评估简历时存在明显的性别偏见，在相同资历下倾向于推荐男性候选人担任技术职位。',
   'Research found GPT-4 exhibited significant gender bias when evaluating resumes, tending to recommend male candidates for technical roles with equal qualifications.',
   'bias', 3,
   'https://arxiv.org/abs/2309.00164',
   'approved', 1694000000);

-- Update incident counts and severity scores
UPDATE models SET
  incident_count = (SELECT COUNT(*) FROM cases WHERE model_id = models.id AND status = 'approved'),
  severity_score = (SELECT COALESCE(AVG(severity), 0) * COUNT(*) FROM cases WHERE model_id = models.id AND status = 'approved');
```

- [ ] **Step 3: Create D1 database via Wrangler**

```bash
cd /Users/bystander/Documents/code/ai-prison/apps/worker
npx wrangler d1 create ai-prison-db
# Copy the database_id from output and update wrangler.toml
```

- [ ] **Step 4: Apply schema and seed**

```bash
npx wrangler d1 execute ai-prison-db --local --file=src/db/schema.sql
npx wrangler d1 execute ai-prison-db --local --file=src/db/seed.sql
```

- [ ] **Step 5: Commit**

```bash
cd /Users/bystander/Documents/code/ai-prison
git add .
git commit -m "feat: add D1 schema and seed data"
```

---

## Chunk 2: Worker API Routes

### Task 3: Auth middleware + cases routes

**Files:**
- Create: `apps/worker/src/middleware/auth.ts`
- Create: `apps/worker/src/routes/cases.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] **Step 1: Write auth middleware**

```typescript
// apps/worker/src/middleware/auth.ts
import { MiddlewareHandler } from 'hono'

type Env = { Bindings: { ADMIN_TOKEN: string } }

export const adminAuth: MiddlewareHandler<Env> = async (c, next) => {
  const auth = c.req.header('Authorization')
  if (!auth || auth !== `Bearer ${c.env.ADMIN_TOKEN}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
```

- [ ] **Step 2: Write cases route**

```typescript
// apps/worker/src/routes/cases.ts
import { Hono } from 'hono'

type Bindings = { DB: D1Database; ADMIN_TOKEN: string }

const cases = new Hono<{ Bindings: Bindings }>()

// GET /api/cases - list approved cases
cases.get('/', async (c) => {
  const { model, category, severity, page = '1', limit = '20' } = c.req.query()
  const offset = (parseInt(page) - 1) * parseInt(limit)

  let query = `SELECT c.*, m.name as model_name, m.name_en as model_name_en, m.provider
               FROM cases c JOIN models m ON c.model_id = m.id
               WHERE c.status = 'approved'`
  const params: (string | number)[] = []

  if (model) { query += ' AND c.model_id = ?'; params.push(model) }
  if (category) { query += ' AND c.category = ?'; params.push(category) }
  if (severity) { query += ' AND c.severity = ?'; params.push(parseInt(severity)) }

  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
  params.push(parseInt(limit), offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()

  // count total
  let countQuery = `SELECT COUNT(*) as total FROM cases WHERE status = 'approved'`
  const countParams: (string | number)[] = []
  if (model) { countQuery += ' AND model_id = ?'; countParams.push(model) }
  if (category) { countQuery += ' AND category = ?'; countParams.push(category) }
  if (severity) { countQuery += ' AND severity = ?'; countParams.push(parseInt(severity)) }

  const { results: countResult } = await c.env.DB.prepare(countQuery).bind(...countParams).all()
  const total = (countResult[0] as { total: number }).total

  return c.json({ cases: results, total, page: parseInt(page), limit: parseInt(limit) })
})

// GET /api/cases/:id
cases.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    `SELECT c.*, m.name as model_name, m.name_en as model_name_en, m.provider
     FROM cases c JOIN models m ON c.model_id = m.id
     WHERE c.id = ? AND c.status = 'approved'`
  ).bind(id).first()

  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result)
})

export default cases
```

- [ ] **Step 3: Write models + rankings route**

```typescript
// apps/worker/src/routes/models.ts
import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const models = new Hono<{ Bindings: Bindings }>()

models.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM models ORDER BY incident_count DESC'
  ).all()
  return c.json(results)
})

export default models
```

```typescript
// apps/worker/src/routes/rankings.ts
import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const rankings = new Hono<{ Bindings: Bindings }>()

rankings.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT m.*,
       (SELECT COUNT(*) FROM cases WHERE model_id = m.id AND status='approved') as total_cases,
       (SELECT COALESCE(SUM(severity),0) FROM cases WHERE model_id = m.id AND status='approved') as total_severity,
       (SELECT COUNT(*) FROM cases WHERE model_id = m.id AND status='approved' AND severity=5) as life_sentences
     FROM models m
     ORDER BY total_severity DESC, total_cases DESC`
  ).all()
  return c.json(results)
})

export default rankings
```

- [ ] **Step 4: Write submit route**

```typescript
// apps/worker/src/routes/submit.ts
import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const submit = new Hono<{ Bindings: Bindings }>()

function nanoid(len = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

submit.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)

  const { model_id, title, title_en, description, description_en, category, severity, source_url } = body

  // Validation
  if (!model_id || !title || !description || !category || !severity) {
    return c.json({ error: 'Missing required fields' }, 400)
  }
  if (!['hallucination','bias','safety','privacy','other'].includes(category)) {
    return c.json({ error: 'Invalid category' }, 400)
  }
  if (typeof severity !== 'number' || severity < 1 || severity > 5) {
    return c.json({ error: 'Severity must be 1-5' }, 400)
  }

  // Check model exists
  const model = await c.env.DB.prepare('SELECT id FROM models WHERE id = ?').bind(model_id).first()
  if (!model) return c.json({ error: 'Unknown model' }, 400)

  const id = `case-${nanoid()}`
  const now = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(
    `INSERT INTO cases (id, model_id, title, title_en, description, description_en, category, severity, source_url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
  ).bind(id, model_id, title, title_en || title, description, description_en || description, category, severity, source_url || null, now).run()

  return c.json({ success: true, id, message: '案件已受理，等待审核' }, 201)
})

export default submit
```

- [ ] **Step 5: Write admin route**

```typescript
// apps/worker/src/routes/admin.ts
import { Hono } from 'hono'
import { adminAuth } from '../middleware/auth'

type Bindings = { DB: D1Database; ADMIN_TOKEN: string }
const admin = new Hono<{ Bindings: Bindings }>()

admin.use('*', adminAuth)

admin.get('/pending', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, m.name as model_name FROM cases c
     JOIN models m ON c.model_id = m.id
     WHERE c.status = 'pending' ORDER BY c.created_at ASC`
  ).all()
  return c.json(results)
})

admin.post('/approve/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`UPDATE cases SET status='approved' WHERE id=?`).bind(id).run()

  // Update model stats
  const caseRow = await c.env.DB.prepare('SELECT model_id, severity FROM cases WHERE id=?').bind(id).first() as { model_id: string; severity: number } | null
  if (caseRow) {
    await c.env.DB.prepare(
      `UPDATE models SET
         incident_count = (SELECT COUNT(*) FROM cases WHERE model_id=? AND status='approved'),
         severity_score = (SELECT COALESCE(SUM(severity),0) FROM cases WHERE model_id=? AND status='approved')
       WHERE id=?`
    ).bind(caseRow.model_id, caseRow.model_id, caseRow.model_id).run()
  }

  return c.json({ success: true })
})

admin.post('/reject/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`UPDATE cases SET status='rejected' WHERE id=?`).bind(id).run()
  return c.json({ success: true })
})

export default admin
```

- [ ] **Step 6: Wire all routes into `src/index.ts`**

```typescript
// apps/worker/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import cases from './routes/cases'
import models from './routes/models'
import rankings from './routes/rankings'
import submit from './routes/submit'
import admin from './routes/admin'

type Bindings = { DB: D1Database; ADMIN_TOKEN: string }
const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({ origin: '*' }))

app.get('/api/health', (c) => c.json({ status: 'ok', time: Date.now() }))
app.route('/api/cases', cases)
app.route('/api/models', models)
app.route('/api/rankings', rankings)
app.route('/api/submit', submit)
app.route('/api/admin', admin)

export default app
```

- [ ] **Step 7: Test locally**

```bash
cd /Users/bystander/Documents/code/ai-prison/apps/worker
npx wrangler dev --local
# In another terminal:
curl http://localhost:8787/api/health
curl http://localhost:8787/api/cases
curl http://localhost:8787/api/rankings
```

Expected: health returns `{"status":"ok"}`, cases returns list of 8 seed cases, rankings returns models sorted by severity.

- [ ] **Step 8: Commit**

```bash
cd /Users/bystander/Documents/code/ai-prison
git add .
git commit -m "feat: add Worker API routes (cases, models, rankings, submit, admin)"
```

---

## Chunk 3: Astro Frontend Setup

### Task 4: Initialize Astro project with Cloudflare adapter

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/astro.config.mjs`
- Create: `apps/web/tailwind.config.mjs`
- Create: `apps/web/src/styles/global.css`
- Create: `apps/web/src/layouts/Layout.astro`

- [ ] **Step 1: Create Astro project**

```bash
cd /Users/bystander/Documents/code/ai-prison/apps
npm create astro@latest web -- --template minimal --typescript strict --no-git --install
```

- [ ] **Step 2: Add Cloudflare adapter and Tailwind**

```bash
cd /Users/bystander/Documents/code/ai-prison/apps/web
npx astro add cloudflare tailwind react --yes
npm install @fontsource/jetbrains-mono
```

- [ ] **Step 3: Write `astro.config.mjs`**

```javascript
// apps/web/astro.config.mjs
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import tailwind from '@astrojs/tailwind'
import react from '@astrojs/react'

export default defineConfig({
  output: 'server',
  adapter: cloudflare({ mode: 'directory' }),
  integrations: [tailwind(), react()],
  vite: {
    define: {
      'import.meta.env.PUBLIC_API_URL': JSON.stringify(process.env.PUBLIC_API_URL || 'http://localhost:8787')
    }
  }
})
```

- [ ] **Step 4: Write `tailwind.config.mjs`**

```javascript
// apps/web/tailwind.config.mjs
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        prison: {
          bg: '#0a0a0a',
          surface: '#111111',
          border: '#222222',
          green: '#00ff41',
          red: '#ff3333',
          yellow: '#ffcc00',
          muted: '#555555',
          text: '#cccccc',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Courier New', 'monospace'],
      },
      animation: {
        'flicker': 'flicker 3s infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.8' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.6' },
          '97%': { opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        }
      }
    }
  }
}
```

- [ ] **Step 5: Write `src/styles/global.css`**

```css
/* apps/web/src/styles/global.css */
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/700.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { background-color: #0a0a0a; color: #cccccc; font-family: 'JetBrains Mono', monospace; }
  body { position: relative; overflow-x: hidden; }
  /* CRT scanline overlay */
  body::before {
    content: '';
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent, transparent 2px,
      rgba(0, 255, 65, 0.02) 2px, rgba(0, 255, 65, 0.02) 4px
    );
    pointer-events: none; z-index: 9999;
  }
}

@layer components {
  .prison-card {
    @apply bg-prison-surface border border-prison-border rounded-none p-4
           hover:border-prison-green transition-colors duration-200;
  }
  .prison-btn {
    @apply font-mono text-sm px-4 py-2 border transition-colors duration-200 cursor-pointer;
  }
  .prison-btn-green {
    @apply prison-btn border-prison-green text-prison-green
           hover:bg-prison-green hover:text-prison-bg;
  }
  .prison-btn-red {
    @apply prison-btn border-prison-red text-prison-red
           hover:bg-prison-red hover:text-white;
  }
  .severity-badge {
    @apply inline-block px-2 py-0.5 text-xs font-bold font-mono;
  }
  .classified-stamp {
    @apply inline-block border-2 border-prison-red text-prison-red
           font-bold text-xs px-2 py-0.5 rotate-[-5deg] opacity-70;
  }
}
```

- [ ] **Step 6: Write `src/layouts/Layout.astro`**

```astro
---
// apps/web/src/layouts/Layout.astro
export interface Props {
  title?: string
  description?: string
}
const { title = 'AI PRISON', description = 'AI 问责与透明度平台 — 收录各大 AI 模型失误案例，公开服刑记录' } = Astro.props
---
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content={description} />
  <title>{title} | AI PRISON</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body class="bg-prison-bg text-prison-text font-mono min-h-screen">
  <!-- Top nav -->
  <nav class="border-b border-prison-border px-6 py-3 flex items-center justify-between">
    <a href="/" class="text-prison-green font-bold text-lg tracking-widest hover:animate-flicker">
      ⛓ AI PRISON
    </a>
    <div class="flex gap-6 text-sm text-prison-muted">
      <a href="/cases" class="hover:text-prison-green transition-colors">案例库 / CASES</a>
      <a href="/rankings" class="hover:text-prison-green transition-colors">排行榜 / RANKINGS</a>
      <a href="/submit" class="hover:text-prison-green transition-colors">举报 / REPORT</a>
    </div>
  </nav>

  <main class="max-w-6xl mx-auto px-6 py-8">
    <slot />
  </main>

  <footer class="border-t border-prison-border px-6 py-4 text-center text-prison-muted text-xs mt-12">
    AI PRISON — 记录 AI 的每一次失误 | Documenting every AI failure
    <span class="ml-4 opacity-50">v0.1.0</span>
  </footer>
</body>
</html>
```

- [ ] **Step 7: Commit**

```bash
cd /Users/bystander/Documents/code/ai-prison
git add .
git commit -m "feat: init Astro project with Cloudflare adapter and cyberpunk theme"
```

---

## Chunk 4: Frontend Pages

### Task 5: Shared components

**Files:**
- Create: `apps/web/src/components/CaseCard.astro`
- Create: `apps/web/src/components/SeverityBadge.astro`
- Create: `apps/web/src/components/CategoryBadge.astro`
- Create: `apps/web/src/components/ModelBadge.astro`
- Create: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Write `src/lib/api.ts`** — typed API client

```typescript
// apps/web/src/lib/api.ts
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787'

export interface Case {
  id: string; model_id: string; title: string; title_en: string
  description: string; description_en: string; category: string
  severity: number; source_url?: string; status: string; created_at: number
  model_name: string; model_name_en: string; provider: string
}

export interface Model {
  id: string; name: string; name_en: string; provider: string
  incident_count: number; severity_score: number
}

export interface RankingModel extends Model {
  total_cases: number; total_severity: number; life_sentences: number
}

export async function getCases(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  const res = await fetch(`${API_URL}/api/cases${qs}`)
  return res.json() as Promise<{ cases: Case[]; total: number; page: number; limit: number }>
}

export async function getCase(id: string) {
  const res = await fetch(`${API_URL}/api/cases/${id}`)
  if (!res.ok) return null
  return res.json() as Promise<Case>
}

export async function getRankings() {
  const res = await fetch(`${API_URL}/api/rankings`)
  return res.json() as Promise<RankingModel[]>
}

export async function getModels() {
  const res = await fetch(`${API_URL}/api/models`)
  return res.json() as Promise<Model[]>
}

export const SEVERITY_LABELS: Record<number, { zh: string; en: string; color: string }> = {
  1: { zh: '⚠️ 警告', en: 'Warning', color: 'text-yellow-400' },
  2: { zh: '🔒 拘留', en: 'Detention', color: 'text-orange-400' },
  3: { zh: '⛓️ 有期', en: 'Fixed Term', color: 'text-orange-500' },
  4: { zh: '🔴 重刑', en: 'Heavy', color: 'text-red-500' },
  5: { zh: '☠️ 无期', en: 'Life', color: 'text-red-600' },
}

export const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  hallucination: { zh: '幻觉', en: 'Hallucination' },
  bias: { zh: '偏见', en: 'Bias' },
  safety: { zh: '安全风险', en: 'Safety Risk' },
  privacy: { zh: '隐私泄露', en: 'Privacy Leak' },
  other: { zh: '其他', en: 'Other' },
}
```

- [ ] **Step 2: Write `SeverityBadge.astro`**

```astro
---
// apps/web/src/components/SeverityBadge.astro
import { SEVERITY_LABELS } from '../lib/api'
export interface Props { severity: number; showBar?: boolean }
const { severity, showBar = false } = Astro.props
const label = SEVERITY_LABELS[severity]
---
<span class={`severity-badge border ${label.color} border-current`}>
  {label.zh}
</span>
{showBar && (
  <div class="flex gap-0.5 mt-1">
    {[1,2,3,4,5].map(i => (
      <div class={`h-1.5 w-4 ${i <= severity ? 'bg-prison-red' : 'bg-prison-border'}`}></div>
    ))}
  </div>
)}
```

- [ ] **Step 3: Write `CategoryBadge.astro`**

```astro
---
// apps/web/src/components/CategoryBadge.astro
import { CATEGORY_LABELS } from '../lib/api'
export interface Props { category: string }
const { category } = Astro.props
const label = CATEGORY_LABELS[category] || { zh: category, en: category }
---
<span class="inline-block border border-prison-muted text-prison-muted text-xs px-2 py-0.5">
  {label.zh} / {label.en}
</span>
```

- [ ] **Step 4: Write `CaseCard.astro`**

```astro
---
// apps/web/src/components/CaseCard.astro
import type { Case } from '../lib/api'
import SeverityBadge from './SeverityBadge.astro'
import CategoryBadge from './CategoryBadge.astro'
export interface Props { case: Case }
const { case: c } = Astro.props
const date = new Date(c.created_at * 1000).toLocaleDateString('zh-CN')
---
<a href={`/cases/${c.id}`} class="prison-card block group">
  <div class="flex items-start justify-between gap-4 mb-2">
    <div class="flex-1">
      <div class="text-xs text-prison-muted mb-1">
        {c.model_name} · {date}
      </div>
      <h3 class="text-prison-text group-hover:text-prison-green transition-colors font-bold">
        {c.title}
      </h3>
      <p class="text-xs text-prison-muted mt-0.5">{c.title_en}</p>
    </div>
    <div class="flex flex-col items-end gap-1 shrink-0">
      <SeverityBadge severity={c.severity} />
      <CategoryBadge category={c.category} />
    </div>
  </div>
  <p class="text-sm text-prison-muted line-clamp-2 mt-2">
    {c.description}
  </p>
</a>
```

- [ ] **Step 5: Commit**

```bash
cd /Users/bystander/Documents/code/ai-prison
git add .
git commit -m "feat: add shared components and API client"
```

---

### Task 6: Homepage

**Files:**
- Create: `apps/web/src/pages/index.astro`
- Create: `apps/web/src/components/RankingTable.astro`

- [ ] **Step 1: Write `RankingTable.astro`**

```astro
---
// apps/web/src/components/RankingTable.astro
import type { RankingModel } from '../lib/api'
export interface Props { models: RankingModel[]; limit?: number }
const { models, limit = 5 } = Astro.props
const top = models.slice(0, limit)
---
<table class="w-full text-sm">
  <thead>
    <tr class="text-prison-muted text-xs border-b border-prison-border">
      <th class="text-left pb-2 w-8">#</th>
      <th class="text-left pb-2">模型 / Model</th>
      <th class="text-right pb-2">案件数</th>
      <th class="text-right pb-2">严重度</th>
    </tr>
  </thead>
  <tbody>
    {top.map((m, i) => (
      <tr class="border-b border-prison-border hover:bg-prison-surface transition-colors">
        <td class="py-2 text-prison-muted font-bold">{i + 1}</td>
        <td class="py-2">
          <div class="text-prison-text">{m.name}</div>
          <div class="text-xs text-prison-muted">{m.provider}</div>
        </td>
        <td class="py-2 text-right text-prison-red font-bold">{m.total_cases}</td>
        <td class="py-2 text-right text-prison-yellow font-bold">{m.total_severity}</td>
      </tr>
    ))}
  </tbody>
</table>
```

- [ ] **Step 2: Write `pages/index.astro`**

```astro
---
// apps/web/src/pages/index.astro
import Layout from '../layouts/Layout.astro'
import CaseCard from '../components/CaseCard.astro'
import RankingTable from '../components/RankingTable.astro'
import { getCases, getRankings } from '../lib/api'

const [{ cases }, rankings] = await Promise.all([
  getCases({ limit: '6' }),
  getRankings()
])
---
<Layout title="AI PRISON — 首页">
  <!-- Hero -->
  <section class="text-center py-16 border-b border-prison-border mb-12">
    <div class="text-prison-muted text-xs tracking-widest mb-4">CLASSIFIED // 机密档案库</div>
    <h1 class="text-5xl font-bold text-prison-green tracking-widest mb-4 animate-flicker">
      ⛓ AI PRISON
    </h1>
    <p class="text-prison-muted max-w-xl mx-auto">
      收录各大 AI 模型失误案例，公开服刑记录。<br/>
      <span class="text-xs">Documenting AI failures. Holding models accountable.</span>
    </p>
    <div class="flex gap-4 justify-center mt-8">
      <a href="/cases" class="prison-btn-green">查看案例库</a>
      <a href="/submit" class="prison-btn border-prison-muted text-prison-muted hover:border-prison-text hover:text-prison-text">提交案件</a>
    </div>
  </section>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Latest cases -->
    <div class="lg:col-span-2">
      <h2 class="text-prison-green text-xs tracking-widest mb-4">
        ▶ 最新入狱记录 / LATEST INCIDENTS
      </h2>
      <div class="space-y-3">
        {cases.map(c => <CaseCard case={c} />)}
      </div>
      <a href="/cases" class="block text-center text-prison-muted text-xs mt-6 hover:text-prison-green">
        查看全部案例 →
      </a>
    </div>

    <!-- Rankings sidebar -->
    <div>
      <h2 class="text-prison-red text-xs tracking-widest mb-4">
        ▶ 通缉令排行榜 / MOST WANTED
      </h2>
      <div class="prison-card">
        <RankingTable models={rankings} limit={5} />
        <a href="/rankings" class="block text-center text-prison-muted text-xs mt-4 hover:text-prison-green">
          完整排行榜 →
        </a>
      </div>
    </div>
  </div>
</Layout>
```

- [ ] **Step 3: Commit**

```bash
cd /Users/bystander/Documents/code/ai-prison
git add .
git commit -m "feat: homepage with case list and rankings sidebar"
```

---

### Task 7: Cases list + detail pages

**Files:**
- Create: `apps/web/src/pages/cases/index.astro`
- Create: `apps/web/src/pages/cases/[id].astro`

- [ ] **Step 1: Write `cases/index.astro`**

```astro
---
// apps/web/src/pages/cases/index.astro
import Layout from '../../layouts/Layout.astro'
import CaseCard from '../../components/CaseCard.astro'
import { getCases, getModels, CATEGORY_LABELS } from '../../lib/api'

const url = Astro.url
const model = url.searchParams.get('model') || ''
const category = url.searchParams.get('category') || ''
const severity = url.searchParams.get('severity') || ''
const page = url.searchParams.get('page') || '1'

const params: Record<string, string> = { page, limit: '20' }
if (model) params.model = model
if (category) params.category = category
if (severity) params.severity = severity

const [{ cases, total }, models] = await Promise.all([
  getCases(params),
  getModels()
])
const totalPages = Math.ceil(total / 20)
---
<Layout title="案例库 — AI PRISON">
  <h1 class="text-prison-green text-xs tracking-widest mb-6">
    ▶ 案例库 / INCIDENT DATABASE
    <span class="text-prison-muted ml-4">共 {total} 条记录</span>
  </h1>

  <!-- Filters -->
  <form method="GET" class="flex flex-wrap gap-3 mb-8 pb-6 border-b border-prison-border">
    <select name="model" class="bg-prison-surface border border-prison-border text-prison-text text-sm px-3 py-1.5 focus:border-prison-green outline-none">
      <option value="">全部模型</option>
      {models.map(m => <option value={m.id} selected={model === m.id}>{m.name}</option>)}
    </select>
    <select name="category" class="bg-prison-surface border border-prison-border text-prison-text text-sm px-3 py-1.5 focus:border-prison-green outline-none">
      <option value="">全部类型</option>
      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
        <option value={k} selected={category === k}>{v.zh}</option>
      ))}
    </select>
    <select name="severity" class="bg-prison-surface border border-prison-border text-prison-text text-sm px-3 py-1.5 focus:border-prison-green outline-none">
      <option value="">全部严重度</option>
      {[1,2,3,4,5].map(s => <option value={s} selected={severity === String(s)}>{s} 级</option>)}
    </select>
    <button type="submit" class="prison-btn-green text-xs">筛选</button>
    <a href="/cases" class="prison-btn border-prison-muted text-prison-muted hover:text-prison-text text-xs">重置</a>
  </form>

  <!-- Cases grid -->
  <div class="space-y-3">
    {cases.length === 0
      ? <p class="text-prison-muted text-center py-12">暂无符合条件的案例</p>
      : cases.map(c => <CaseCard case={c} />)
    }
  </div>

  <!-- Pagination -->
  {totalPages > 1 && (
    <div class="flex gap-2 justify-center mt-8">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <a
          href={`/cases?${new URLSearchParams({ ...params, page: String(p) })}`}
          class={`prison-btn text-xs ${p === parseInt(page) ? 'border-prison-green text-prison-green' : 'border-prison-border text-prison-muted'}`}
        >{p}</a>
      ))}
    </div>
  )}
</Layout>
```

- [ ] **Step 2: Write `cases/[id].astro`**

```astro
---
// apps/web/src/pages/cases/[id].astro
import Layout from '../../layouts/Layout.astro'
import SeverityBadge from '../../components/SeverityBadge.astro'
import CategoryBadge from '../../components/CategoryBadge.astro'
import { getCase } from '../../lib/api'

const { id } = Astro.params
const c = await getCase(id!)
if (!c) return Astro.redirect('/cases')

const date = new Date(c.created_at * 1000).toLocaleDateString('zh-CN')
---
<Layout title={`${c.title} — AI PRISON`}>
  <div class="max-w-3xl mx-auto">
    <a href="/cases" class="text-prison-muted text-xs hover:text-prison-green mb-6 block">
      ← 返回案例库
    </a>

    <div class="prison-card mb-6">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-prison-border">
        <div>
          <div class="text-xs text-prison-muted mb-2">
            案件编号 / CASE ID: <span class="text-prison-green">{c.id}</span>
          </div>
          <h1 class="text-xl font-bold text-prison-text mb-1">{c.title}</h1>
          <p class="text-sm text-prison-muted">{c.title_en}</p>
        </div>
        <div class="classified-stamp shrink-0">CLASSIFIED</div>
      </div>

      <!-- Meta -->
      <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <div class="text-prison-muted text-xs mb-1">被告模型 / MODEL</div>
          <div class="text-prison-text font-bold">{c.model_name}</div>
          <div class="text-xs text-prison-muted">{c.provider}</div>
        </div>
        <div>
          <div class="text-prison-muted text-xs mb-1">记录时间 / DATE</div>
          <div class="text-prison-text">{date}</div>
        </div>
        <div>
          <div class="text-prison-muted text-xs mb-1">罪行类型 / CATEGORY</div>
          <CategoryBadge category={c.category} />
        </div>
        <div>
          <div class="text-prison-muted text-xs mb-1">刑期等级 / SEVERITY</div>
          <SeverityBadge severity={c.severity} showBar={true} />
        </div>
      </div>

      <!-- Description -->
      <div class="mb-4">
        <div class="text-prison-muted text-xs mb-2">案件详情 / INCIDENT DETAIL</div>
        <p class="text-prison-text leading-relaxed">{c.description}</p>
        {c.description_en !== c.description && (
          <p class="text-prison-muted text-sm mt-2 leading-relaxed">{c.description_en}</p>
        )}
      </div>

      <!-- Source -->
      {c.source_url && (
        <div class="border-t border-prison-border pt-4">
          <div class="text-prison-muted text-xs mb-1">来源 / SOURCE</div>
          <a href={c.source_url} target="_blank" rel="noopener noreferrer"
             class="text-prison-green text-sm hover:underline break-all">
            {c.source_url}
          </a>
        </div>
      )}
    </div>
  </div>
</Layout>
```

- [ ] **Step 3: Commit**

```bash
cd /Users/bystander/Documents/code/ai-prison
git add .
git commit -m "feat: cases list and detail pages"
```

---

### Task 8: Rankings + Submit + Admin pages

**Files:**
- Create: `apps/web/src/pages/rankings.astro`
- Create: `apps/web/src/pages/submit.astro`
- Create: `apps/web/src/pages/admin.astro`
- Create: `apps/web/src/components/SubmitForm.tsx`

- [ ] **Step 1: Write `rankings.astro`**

```astro
---
// apps/web/src/pages/rankings.astro
import Layout from '../layouts/Layout.astro'
import { getRankings, SEVERITY_LABELS } from '../lib/api'

const rankings = await getRankings()
---
<Layout title="排行榜 — AI PRISON">
  <h1 class="text-prison-red text-xs tracking-widest mb-2">
    ☠ 通缉令排行榜 / MOST WANTED
  </h1>
  <p class="text-prison-muted text-xs mb-8">按累计严重度得分排序</p>

  <div class="space-y-2">
    {rankings.map((m, i) => (
      <div class={`prison-card flex items-center gap-4 ${i === 0 ? 'border-prison-red' : ''}`}>
        <div class={`text-3xl font-bold w-12 text-center ${i === 0 ? 'text-prison-red' : i === 1 ? 'text-orange-400' : i === 2 ? 'text-yellow-600' : 'text-prison-muted'}`}>
          #{i + 1}
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-3">
            <span class="font-bold text-prison-text">{m.name}</span>
            <span class="text-xs text-prison-muted">{m.provider}</span>
            {i === 0 && <span class="classified-stamp text-xs !text-prison-red !border-prison-red">头号通缉</span>}
          </div>
          <div class="flex gap-6 mt-1 text-xs text-prison-muted">
            <span>案件数: <span class="text-prison-red font-bold">{m.total_cases}</span></span>
            <span>严重度总分: <span class="text-prison-yellow font-bold">{m.total_severity}</span></span>
            {m.life_sentences > 0 && (
              <span>☠️ 无期: <span class="text-prison-red font-bold">{m.life_sentences}</span></span>
            )}
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-prison-muted mb-1">严重度</div>
          <div class="flex gap-0.5">
            {[1,2,3,4,5].map(s => {
              const filled = m.total_cases > 0 ? Math.min(5, Math.round(m.total_severity / m.total_cases)) : 0
              return <div class={`h-2 w-3 ${s <= filled ? 'bg-prison-red' : 'bg-prison-border'}`}></div>
            })}
          </div>
        </div>
      </div>
    ))}
  </div>
</Layout>
```

- [ ] **Step 2: Write `SubmitForm.tsx`** (React island for form handling)

```tsx
// apps/web/src/components/SubmitForm.tsx
import { useState } from 'react'

const CATEGORIES = [
  { value: 'hallucination', label: '幻觉 / Hallucination' },
  { value: 'bias', label: '偏见 / Bias' },
  { value: 'safety', label: '安全风险 / Safety Risk' },
  { value: 'privacy', label: '隐私泄露 / Privacy Leak' },
  { value: 'other', label: '其他 / Other' },
]

interface Model { id: string; name: string; provider: string }

export default function SubmitForm({ models, apiUrl }: { models: Model[]; apiUrl: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))

    try {
      const res = await fetch(`${apiUrl}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, severity: parseInt(data.severity as string) })
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) throw new Error(json.error || 'Submit failed')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  if (status === 'success') {
    return (
      <div class="prison-card text-center py-12">
        <div class="text-prison-green text-2xl mb-4">✓</div>
        <div class="text-prison-green font-bold mb-2">案件已受理</div>
        <div class="text-prison-muted text-sm">Case submitted successfully. Pending review.</div>
        <button onClick={() => setStatus('idle')} class="prison-btn-green mt-6 text-xs">继续提交</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <div>
        <label class="block text-xs text-prison-muted mb-1">被告模型 / Model *</label>
        <select name="model_id" required
          class="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm">
          <option value="">选择模型</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>)}
        </select>
      </div>
      <div>
        <label class="block text-xs text-prison-muted mb-1">案件标题（中文）*</label>
        <input name="title" required maxLength={100}
          class="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm"
          placeholder="简短描述失误内容" />
      </div>
      <div>
        <label class="block text-xs text-prison-muted mb-1">Title (English)</label>
        <input name="title_en" maxLength={100}
          class="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm"
          placeholder="English title (optional)" />
      </div>
      <div>
        <label class="block text-xs text-prison-muted mb-1">详细描述（中文）*</label>
        <textarea name="description" required rows={4} maxLength={2000}
          class="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm resize-none"
          placeholder="详细描述失误经过、影响和后果" />
      </div>
      <div>
        <label class="block text-xs text-prison-muted mb-1">Description (English)</label>
        <textarea name="description_en" rows={3} maxLength={2000}
          class="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm resize-none"
          placeholder="English description (optional)" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-prison-muted mb-1">罪行类型 / Category *</label>
          <select name="category" required
            class="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm">
            <option value="">选择类型</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label class="block text-xs text-prison-muted mb-1">严重程度 / Severity *</label>
          <select name="severity" required
            class="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm">
            <option value="">1-5</option>
            <option value="1">1 — ⚠️ 警告</option>
            <option value="2">2 — 🔒 拘留</option>
            <option value="3">3 — ⛓️ 有期</option>
            <option value="4">4 — 🔴 重刑</option>
            <option value="5">5 — ☠️ 无期</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs text-prison-muted mb-1">来源链接 / Source URL</label>
        <input name="source_url" type="url"
          class="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm"
          placeholder="https://..." />
      </div>

      {status === 'error' && (
        <div class="border border-prison-red text-prison-red text-xs px-3 py-2">
          错误: {errorMsg}
        </div>
      )}

      <button type="submit" disabled={status === 'loading'}
        class="prison-btn-green w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed">
        {status === 'loading' ? '提交中...' : '提交案件 / SUBMIT CASE'}
      </button>
      <p class="text-prison-muted text-xs text-center">匿名提交 · 经审核后公开 · Anonymous submission · Published after review</p>
    </form>
  )
}
```

- [ ] **Step 3: Write `submit.astro`**

```astro
---
// apps/web/src/pages/submit.astro
import Layout from '../layouts/Layout.astro'
import SubmitForm from '../components/SubmitForm'
import { getModels } from '../lib/api'

const models = await getModels()
const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787'
---
<Layout title="提交案件 — AI PRISON">
  <div class="max-w-2xl mx-auto">
    <h1 class="text-prison-green text-xs tracking-widest mb-2">▶ 提交案件 / REPORT AN INCIDENT</h1>
    <p class="text-prison-muted text-xs mb-8">
      发现 AI 模型的失误？匿名提交，经审核后收录到案例库。
    </p>
    <SubmitForm models={models} apiUrl={apiUrl} client:load />
  </div>
</Layout>
```

- [ ] **Step 4: Write `admin.astro`**

```astro
---
// apps/web/src/pages/admin.astro
import Layout from '../layouts/Layout.astro'

// Admin is purely client-side: fetches pending cases using token from local storage
const apiUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787'
---
<Layout title="管理后台 — AI PRISON">
  <div id="admin-app" data-api-url={apiUrl}>
    <div id="login-form" class="max-w-sm mx-auto mt-16">
      <h1 class="text-prison-red text-xs tracking-widest mb-6">⚠ 管理员入口 / ADMIN</h1>
      <input id="token-input" type="password" placeholder="Admin Token"
        class="w-full bg-prison-surface border border-prison-border text-prison-text px-3 py-2 focus:border-prison-green outline-none text-sm mb-3" />
      <button id="login-btn" class="prison-btn-green w-full text-sm">登录</button>
    </div>
    <div id="pending-list" class="hidden">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-prison-red text-xs tracking-widest">⚠ 待审核案件 / PENDING CASES</h1>
        <button id="logout-btn" class="prison-btn border-prison-muted text-prison-muted text-xs">退出</button>
      </div>
      <div id="cases-container" class="space-y-3"></div>
    </div>
  </div>
</Layout>

<script>
const apiUrl = document.getElementById('admin-app')!.dataset.apiUrl!
let token = ''

document.getElementById('login-btn')!.addEventListener('click', async () => {
  token = (document.getElementById('token-input') as HTMLInputElement).value
  await loadPending()
})

document.getElementById('logout-btn')!.addEventListener('click', () => {
  token = ''
  document.getElementById('login-form')!.classList.remove('hidden')
  document.getElementById('pending-list')!.classList.add('hidden')
})

async function loadPending() {
  const res = await fetch(`${apiUrl}/api/admin/pending`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) { alert('认证失败'); return }
  const cases = await res.json() as any[]

  document.getElementById('login-form')!.classList.add('hidden')
  document.getElementById('pending-list')!.classList.remove('hidden')

  const container = document.getElementById('cases-container')!
  if (cases.length === 0) {
    container.innerHTML = '<p class="text-prison-muted text-center py-8">暂无待审核案件</p>'
    return
  }
  container.innerHTML = cases.map(c => `
    <div class="prison-card" id="case-${c.id}">
      <div class="text-xs text-prison-muted mb-1">${c.model_name} · ${c.category} · 严重度 ${c.severity}</div>
      <div class="font-bold text-prison-text mb-1">${c.title}</div>
      <p class="text-sm text-prison-muted mb-3">${c.description}</p>
      ${c.source_url ? `<a href="${c.source_url}" target="_blank" class="text-prison-green text-xs hover:underline block mb-3">${c.source_url}</a>` : ''}
      <div class="flex gap-2">
        <button onclick="approve('${c.id}')" class="prison-btn-green text-xs">✓ 批准</button>
        <button onclick="reject('${c.id}')" class="prison-btn-red text-xs">✗ 拒绝</button>
      </div>
    </div>
  `).join('')
}

async function approve(id: string) {
  await fetch(`${apiUrl}/api/admin/approve/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  document.getElementById(`case-${id}`)?.remove()
}

async function reject(id: string) {
  await fetch(`${apiUrl}/api/admin/reject/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  document.getElementById(`case-${id}`)?.remove()
}

// Make functions global
;(window as any).approve = approve;
;(window as any).reject = reject;
</script>
```

- [ ] **Step 5: Add favicon**

```bash
cat > /Users/bystander/Documents/code/ai-prison/apps/web/public/favicon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0a0a0a"/>
  <text y=".9em" font-size="90" x="5">⛓</text>
</svg>
EOF
```

- [ ] **Step 6: Commit**

```bash
cd /Users/bystander/Documents/code/ai-prison
git add .
git commit -m "feat: rankings, submit, and admin pages"
```

---

## Chunk 5: Deployment

### Task 9: Deploy Worker to Cloudflare

**Prerequisites:** Cloudflare account, `wrangler login` completed.

- [ ] **Step 1: Login to Cloudflare**

```bash
cd /Users/bystander/Documents/code/ai-prison/apps/worker
npx wrangler login
```

- [ ] **Step 2: Create D1 database (production)**

```bash
npx wrangler d1 create ai-prison-db
```
Copy the `database_id` from output. Update `wrangler.toml`:
```toml
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"
```

- [ ] **Step 3: Apply schema and seed to production D1**

```bash
npx wrangler d1 execute ai-prison-db --file=src/db/schema.sql
npx wrangler d1 execute ai-prison-db --file=src/db/seed.sql
```

- [ ] **Step 4: Set ADMIN_TOKEN secret**

```bash
npx wrangler secret put ADMIN_TOKEN
# Enter a strong random token when prompted
```

- [ ] **Step 5: Deploy Worker**

```bash
npx wrangler deploy
# Note the Worker URL: https://ai-prison-api.<your-subdomain>.workers.dev
```

- [ ] **Step 6: Commit updated wrangler.toml**

```bash
cd /Users/bystander/Documents/code/ai-prison
git add apps/worker/wrangler.toml
git commit -m "chore: add production D1 database_id"
```

---

### Task 10: Deploy frontend to Cloudflare Pages

- [ ] **Step 1: Create `.env.production` for web app**

```bash
# apps/web/.env.production
PUBLIC_API_URL=https://ai-prison-api.<your-subdomain>.workers.dev
```

Replace with your actual Worker URL from Task 9 Step 5.

- [ ] **Step 2: Build Astro locally to verify**

```bash
cd /Users/bystander/Documents/code/ai-prison/apps/web
PUBLIC_API_URL=https://ai-prison-api.<your-subdomain>.workers.dev npm run build
```

Expected: `dist/` directory created with no errors.

- [ ] **Step 3: Deploy to Cloudflare Pages via Wrangler**

```bash
npx wrangler pages project create ai-prison
npx wrangler pages deploy dist --project-name=ai-prison
```

Or connect via Cloudflare Dashboard → Pages → Connect to Git for auto-deploy on push.

- [ ] **Step 4: Set environment variable in Pages dashboard**

In Cloudflare Dashboard → Pages → ai-prison → Settings → Environment Variables:
- Add `PUBLIC_API_URL` = `https://ai-prison-api.<your-subdomain>.workers.dev`

- [ ] **Step 5: Final verification**

```bash
# Visit your Pages URL and check:
# / - homepage loads with cases and rankings
# /cases - list loads with filter controls
# /cases/case-001 - case detail loads
# /rankings - rankings table shows
# /submit - form works (submit a test case)
# /admin - admin panel works with your ADMIN_TOKEN
```

- [ ] **Step 6: Final commit**

```bash
cd /Users/bystander/Documents/code/ai-prison
git add .
git commit -m "feat: complete AI Prison platform - ready for deployment"
```

---

## Summary

After completing all chunks you will have:

1. **Cloudflare Worker** with a full REST API (Hono) connected to D1
2. **Cloudflare D1** database with 6 AI models and 8 seed cases
3. **Astro SSR frontend** on Cloudflare Pages with:
   - Homepage with latest cases + rankings sidebar
   - Filterable case list
   - Case detail pages
   - Anonymous submission form (React island)
   - Full rankings "most-wanted" page
   - Password-protected admin panel
4. **Dark cyberpunk visual theme** with CRT scanline effect

All within Cloudflare free tier limits.
