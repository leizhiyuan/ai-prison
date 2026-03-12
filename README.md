# ⛓ AI PRISON

**AI 问责与透明度平台** — 收录各大 AI 模型失误案例，公开"服刑记录"。

> Documenting AI failures. Holding models accountable.

**线上地址：https://ai-prison.pages.dev**

---

## 关于这个项目

AI PRISON 用"监狱"作为品牌隐喻，将 AI 模型的失误案例以"犯罪档案"的形式归档展示。每一条案例是一份服刑记录，每个 AI 模型是一名在押犯人，严重程度用"刑期"衡量，排行榜是"通缉令榜单"。

目的是以轻松但严肃的方式，推动 AI 问责与透明度的公众讨论。

---

## 功能

- **案例库** — 按模型、类别、严重度筛选，分页浏览所有失误案例
- **案例详情** — 完整"犯罪档案"，含来源链接
- **通缉令排行榜** — 按累计严重度得分对 AI 模型排名
- **匿名举报** — 任何人都可以匿名提交新案例，经管理员审核后公开
- **管理后台** — Token 保护的后台，一键批准或拒绝待审核案例
- **双语支持** — 中英文内容并行展示

### 严重度等级

| 等级 | 名称 | 含义 |
|------|------|------|
| 1 | ⚠️ 警告 | 轻微失误，无实质危害 |
| 2 | 🔒 拘留 | 明显错误，影响用户体验 |
| 3 | ⛓️ 有期 | 造成一定误导或损害 |
| 4 | 🔴 重刑 | 严重失误，产生实际负面影响 |
| 5 | ☠️ 无期 | 极端案例，造成重大危害 |

---

## 技术栈

完全基于 **Cloudflare 免费套餐**构建，零成本运行。

| 层级 | 技术 |
|------|------|
| 前端 | [Astro](https://astro.build) v5 (SSR) + React Islands |
| 样式 | Tailwind CSS + JetBrains Mono（暗色赛博朋克主题）|
| API | [Hono](https://hono.dev) on Cloudflare Workers |
| 数据库 | Cloudflare D1 (SQLite) |
| 托管 | Cloudflare Pages + Workers |

### 架构

```
Cloudflare Pages (Astro SSR)
  └── fetch → Cloudflare Workers (Hono API)
                  └── Cloudflare D1 (SQLite)
```

---

## 本地开发

### 前置条件

- Node.js 18+
- npm

### 启动

**终端 1 — 启动 Worker API（端口 8787）：**

```bash
cd apps/worker
npm install
npm run dev
```

**终端 2 — 启动前端（端口 4321）：**

```bash
cd apps/web
npm install
PUBLIC_API_URL=http://localhost:8787 npm run dev
```

打开 http://localhost:4321 查看效果。

---

## 部署到 Cloudflare

### 1. 登录

```bash
npx wrangler login
```

### 2. 创建 D1 数据库

```bash
cd apps/worker
npx wrangler d1 create ai-prison-db
# 将输出的 database_id 填入 wrangler.toml
```

### 3. 推送数据库

```bash
npx wrangler d1 execute ai-prison-db --remote --file=src/db/schema.sql
npx wrangler d1 execute ai-prison-db --remote --file=src/db/seed.sql
```

### 4. 设置管理员 Token

```bash
npx wrangler secret put ADMIN_TOKEN
# 输入一个随机字符串作为管理后台密码
```

### 5. 部署 Worker

```bash
npx wrangler deploy
# 记录输出的 Worker URL
```

### 6. 构建并部署前端

```bash
cd apps/web
PUBLIC_API_URL=https://<your-worker>.workers.dev npm run build
npx wrangler pages project create ai-prison --production-branch=main
npx wrangler pages deploy dist --project-name=ai-prison --branch=main
```

---

## 项目结构

```
ai-prison/
├── apps/
│   ├── worker/                  # Cloudflare Workers API
│   │   ├── src/
│   │   │   ├── index.ts         # 入口，路由注册
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts      # 管理员 Token 验证
│   │   │   ├── routes/
│   │   │   │   ├── cases.ts     # GET /api/cases, /api/cases/:id
│   │   │   │   ├── models.ts    # GET /api/models
│   │   │   │   ├── rankings.ts  # GET /api/rankings
│   │   │   │   ├── submit.ts    # POST /api/submit
│   │   │   │   └── admin.ts     # GET/POST /api/admin/*
│   │   │   └── db/
│   │   │       ├── schema.sql   # 数据库表结构
│   │   │       └── seed.sql     # 初始种子数据（8个案例）
│   │   └── wrangler.toml
│   └── web/                     # Astro 前端
│       └── src/
│           ├── lib/api.ts       # 类型化 API 客户端
│           ├── components/      # UI 组件
│           ├── layouts/         # 页面布局
│           └── pages/           # 路由页面
│               ├── index.astro       # 首页
│               ├── cases/
│               │   ├── index.astro   # 案例列表
│               │   └── [id].astro    # 案例详情
│               ├── rankings.astro    # 排行榜
│               ├── submit.astro      # 提交案件
│               └── admin.astro       # 管理后台
└── docs/
    └── superpowers/
        ├── specs/               # 设计文档
        └── plans/               # 实施计划
```

---

## API 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/cases` | 案例列表（支持 model/category/severity/page/limit 筛选）|
| GET | `/api/cases/:id` | 案例详情 |
| GET | `/api/models` | 所有模型 |
| GET | `/api/rankings` | 排行榜（按严重度排序）|
| POST | `/api/submit` | 提交新案例（匿名）|
| GET | `/api/admin/pending` | 待审核案例（需 Bearer Token）|
| POST | `/api/admin/approve/:id` | 批准案例（需 Bearer Token）|
| POST | `/api/admin/reject/:id` | 拒绝案例（需 Bearer Token）|

---

## License

MIT
