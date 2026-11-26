# Edgelink SEO Automation Dashboard

Full-stack automated SEO audit platform built for the **Edgelink Technology — AI Developer & Automation Engineer Technical Assessment**.

It automates website SEO crawling, external signal aggregation, AI-powered analysis with **Anthropic Claude (`claude-sonnet-4-6`)**, **Puppeteer PDF report generation**, and **WhatsApp + Email delivery**, exposed through a dual-portal **Next.js 14** interface (Internal Admin Portal + Client-Facing Dashboard).

---

## Architecture & Pipeline Flow

```text
TRIGGER (Admin Portal "Run Audit" click / cron-job.org monthly cron)
   │
   ▼
POST /api/audit  ──►  Creates Audit (QUEUED) in Postgres + Enqueues job
   │
   ▼
BullMQ Queue: seo-audit-jobs  [Upstash Redis (serverless)]
   │
   ▼
Node.js Worker (src/worker/index.js) picks up job (status = RUNNING)
   ├── Step 1 (15%): Fetch + Cheerio crawls URL            (src/crawlers/htmlCrawler.js)
   ├── Step 2 (25%): PageSpeed Insights API   [USE_MOCKS]  (src/crawlers/pagespeed.js)
   ├── Step 3 (35%): Google Search Console    [USE_MOCKS]  (src/crawlers/gsc.js)
   ├── Step 4 (45%): Schema.org JSON-LD validator          (src/crawlers/schemaValidator.js)
   ├── Step 5 (55%): On-page SEO analysis                  (src/crawlers/onPageAnalyzer.js)
   ├── Step 6 (65%): robots.txt + sitemap.xml check        (src/crawlers/technicalChecker.js)
   └── Step 7 (75%): DataForSEO rankings      [USE_MOCKS]  (src/crawlers/dataforseo.js)
   │
   ▼
Claude API (claude-sonnet-4-6): Master SEO Audit Prompt -> strict JSON (REAL or MOCK)
   │
   ▼
Supabase / Neon Postgres (Prisma): Store overallScore, scoreBreakdown, signals & result
   │
   ▼
Puppeteer PDF Report Generator -> /tmp/reports/audit-<id>.pdf (Cloudflare R2 mock)
   │
   ▼
Twilio WhatsApp + Email -> console.log mock + Notification table rows -> status = COMPLETED
```

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui-style components, Lucide icons |
| **API Routes** | Next.js 14 Route Handlers (`/api/audit`, `/api/audit/[id]`, `/api/audit/[id]/pdf`, `/api/cron/audits`, `/api/clients`, `/api/health`) |
| **Job Queue & Worker** | BullMQ (`seo-audit-jobs`) + Upstash Redis (`ioredis` TLS) + long-running Node.js worker |
| **Crawler & Validators** | Fetch + Cheerio, Schema.org JSON-LD validator, On-page analyzer, `robots.txt` & `sitemap.xml` checker |
| **AI Analysis** | Anthropic Claude API (`claude-sonnet-4-6`) with strict JSON validation & `USE_MOCKS` fallback |
| **Database** | Prisma ORM + PostgreSQL (Neon or Supabase) |
| **PDF Reports** | Puppeteer HTML-to-PDF (`/tmp/reports/`) with pure-JS PDF fallback for lightweight containers |
| **Scheduler** | `cron-job.org` calling `GET /api/cron/audits` with `CRON_SECRET` header |

---

## Project Structure

```text
├── prisma/
│   ├── schema.prisma              # Exact Client, Audit, Notification, AuditStatus schema
│   └── seed.js                    # Seeds 3 sample Indian local business clients
├── src/
│   ├── mocks/                     # Exact required mock architecture (USE_MOCKS toggle)
│   │   ├── index.js               # const USE_MOCKS = process.env.USE_MOCKS === 'true'
│   │   ├── pagespeed.mock.js      # Exact PageSpeed Insights mock data
│   │   ├── gsc.mock.js            # Exact Google Search Console mock data
│   │   ├── dataforseo.mock.js     # Exact DataForSEO mock data
│   │   ├── twilio.mock.js         # Exact WhatsApp console.log mock
│   │   ├── claude.mock.js         # Structured JSON fallback matching Section 6.2 schema
│   │   └── email.mock.js          # Email console.log mock
│   ├── crawlers/                  # 7-step crawler & validator modules
│   ├── services/                  # claudeAnalyzer, pdfGenerator, notifier, auditPipeline
│   ├── lib/                       # prisma, redis, queue, utils
│   ├── worker/index.js            # Long-running BullMQ worker process
│   ├── components/                # UI primitives, Navbar, ScoreRing, AuditProgressBar, AuditDetailPanel
│   └── app/
│       ├── admin/page.jsx         # Internal Admin Portal (client CRUD, trigger audit, live polling)
│       ├── client/page.jsx        # Client Dashboard directory
│       ├── client/[clientId]/page.jsx  # Client-facing SEO Dashboard + history + PDF download
│       └── api/                   # All REST & Cron endpoints
├── scripts/verify-pipeline.js     # Offline mock & PDF smoke test
├── vercel.json                    # Vercel Hobby deployment config
├── render.yaml                    # Render worker deployment blueprint
├── Dockerfile.worker              # Docker image with Chromium for Puppeteer worker
└── .env.example                   # Environment variable template
```

---

## Local Setup

### 1. Prerequisites
- Node.js 18.18+ (or Node 20 LTS)
- Free PostgreSQL database on [Neon](https://neon.tech) (recommended — no inactivity pause) or [Supabase](https://supabase.com)
- Free Redis database on [Upstash](https://upstash.com)
- Optional: Anthropic API key from [console.anthropic.com](https://console.anthropic.com) (leave blank with `USE_MOCKS=true` to test with the built-in Claude JSON mock)

### 2. Install & Configure
```bash
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL, DIRECT_URL, REDIS_URL, CRON_SECRET, and optional ANTHROPIC_API_KEY
```

### 3. Push Prisma Schema & Seed Sample Clients
```bash
npx prisma db push
npm run db:seed
```

### 4. Run Web App & Worker (2 terminals)
```bash
# Terminal 1 — Next.js 14 Admin Portal + Client Dashboard + API
npm run dev

# Terminal 2 — Long-running BullMQ Worker
npm run worker
```

Open:
- **Admin Portal**: `http://localhost:3000/admin`
- **Client Dashboard**: `http://localhost:3000/client`
- **Health Check**: `http://localhost:3000/api/health`

### 5. Offline Mock Verification
```bash
npm run test:mocks
```

---

## Free-Tier Deployment Guide (Live URL)

### Step 1 — Database (Neon / Supabase) & Queue (Upstash Redis)
1. Create a free Postgres project on **Neon** (or Supabase) and copy `DATABASE_URL` and `DIRECT_URL`.
2. Create a free Redis database on **Upstash** and copy the `rediss://...` URL as `REDIS_URL`.
3. Run `npx prisma db push && npm run db:seed` locally pointing to the production database.

### Step 2 — Deploy Frontend + API to Vercel (Free Hobby)
1. Push this repository to GitHub.
2. Import the repository in **Vercel**.
3. Add environment variables in Vercel Project Settings:
   - `USE_MOCKS=true`
   - `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `CRON_SECRET`
   - `ANTHROPIC_API_KEY` (optional; if omitted while `USE_MOCKS=true`, mock Claude JSON is used)
   - `RUN_INLINE_WORKER=false` (set `true` ONLY if you choose not to host a separate worker)
4. Deploy and verify `https://<your-app>.vercel.app/api/health`.

### Step 3 — Deploy Long-Running Worker (Render / Railway / Fly.io)
BullMQ workers require a long-running process (Vercel Hobby functions time out at 10s).
- **Render**: Connect your GitHub repo as a **Blueprint** using the included `render.yaml` + `Dockerfile.worker`, and fill in `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, and `ANTHROPIC_API_KEY`.
- **Railway / Fly.io**: Deploy using `Dockerfile.worker` with the same environment variables.

### Step 4 — Configure `cron-job.org` (Free External Cron)
1. Sign up at [cron-job.org](https://cron-job.org).
2. Create a new cronjob:
   - **URL**: `https://<your-app>.vercel.app/api/cron/audits`
   - **Schedule**: Every 1 minute (or desired interval)
   - **HTTP Header**: `x-cron-secret: <your-CRON_SECRET>`
3. Optional (Supabase users): Add a daily ping to `https://<your-app>.vercel.app/api/health` to prevent the 7-day inactivity pause.

---

## Test Access
- No login wall is enabled on the demo portals so reviewers can directly open `/admin` and `/client`, click **Run Audit** on any seeded client, watch live 0–100% progress polling, inspect the Claude JSON output, and download the generated PDF report.

## API Reference

| Method & Path | Description |
| :--- | :--- |
| `POST /api/audit` | Body `{ "clientId": "..." }`. Creates `Audit` (`QUEUED`), adds `run-audit` job to `seo-audit-jobs`, returns `{ "auditId": "..." }` (`202`). |
| `GET /api/audit/[id]` | Returns `status`, `progress` (0–100), `currentStep`, `overallScore`, `result`, `pdfUrl`, and `notifications` for live polling. |
| `GET /api/audit/[id]/pdf` | Streams the generated PDF report from `/tmp/reports/` (auto-regenerates if `/tmp` was evicted). |
| `GET /api/cron/audits` | Requires `x-cron-secret` (or `Authorization: Bearer`) matching `CRON_SECRET`. Enqueues due monthly audits and optionally runs a bounded inline batch. |
| `GET /api/clients` / `POST /api/clients` | Lists all clients with latest audit status, or creates a new client. |
| `GET /api/clients/[id]` | Returns client profile and historical audits for the Client Dashboard. |
| `GET /api/health` | Verifies Postgres + BullMQ Redis connectivity and `USE_MOCKS` status. |
