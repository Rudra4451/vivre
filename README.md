# Vivre

Production-grade, server-authoritative expedition command platform built with **Next.js 16 (App Router)**, **React 19**, **Supabase SSR (PKCE)**, **React Three Fiber**, and **Tailwind CSS**.

---

## 1. Requirements

- **Node.js**: Active LTS / `^20.9.0` or `^22.0.0` (Verified on Node `v24.x`)
- **Package Manager**: `npm` (`>= 10.x`) or `pnpm`
- **Docker**: Required for running the local Supabase environment via Supabase CLI

---

## 2. Installation

Clone the repository and install all project dependencies:

```bash
git clone <repository-url> Vivre
cd Vivre
npm install
```

---

## 3. Environment Setup

Copy the example environment template to `.env.local`:

```bash
cp .env.example .env.local
```

Populate `.env.local` with your configuration:

```env
# Public Supabase variables (safe for browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Private Server-Only variables (NEVER expose to client)
SUPABASE_SECRET_KEY=sb_secret_your_key_here
RESEND_API_KEY=re_your_api_key_here
CRON_SECRET=your_secure_random_cron_secret
```

> **Important Security Rule**: `SUPABASE_SECRET_KEY` and `RESEND_API_KEY` are guarded by `server-only` in [`lib/supabase/admin.ts`](file:///c:/Users/rudra/Vivre/lib/supabase/admin.ts) and must never be prefixed with `NEXT_PUBLIC_`.

---

## 4. Local Supabase Setup

To start a full Supabase stack (PostgreSQL, Auth, Storage, Studio) locally:

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -D supabase
   ```

2. **Initialize & Start Services**:
   ```bash
   npx supabase init
   npx supabase start
   ```

3. Note down the output credentials (`API URL`, `publishable key`, `secret key`) and update `.env.local`.

4. Access the local Supabase Studio dashboard at:
   `http://localhost:54323`

---

## 5. Database Migration Workflow

Vivre tracks schema evolution using reproducible SQL migration files.

- **Create a new migration**:
  ```bash
  npx supabase migration new <migration_name>
  ```
  This creates a timestamped SQL file inside `supabase/migrations/`.

- **Apply migrations to local database**:
  ```bash
  npx supabase db reset
  ```

- **Generate TypeScript database types**:
  ```bash
  npx supabase gen types typescript --local > types/database.types.ts
  ```

- **Push migrations to remote Supabase project**:
  ```bash
  npx supabase db push
  ```

---

## 6. Development Commands

- **Start Development Server**:
  ```bash
  npm run dev
  ```
  Accessible at [http://localhost:3000](http://localhost:3000).

- **Format Code with Prettier**:
  ```bash
  npx prettier --write .
  ```

- **Check Formatting**:
  ```bash
  npx prettier --check .
  ```

---

## 7. Testing & Quality Commands

- **Run ESLint**:
  ```bash
  npm run lint
  ```

- **Run TypeScript Compiler Check**:
  ```bash
  npm run typecheck
  ```

- **Health Check Endpoint**:
  With the dev server running, verify system responsiveness:
  ```bash
  curl http://localhost:3000/api/health
  ```

---

## 8. Production Deployment Guide

### Vercel Deployment

1. **Push to Remote Repository**:
   Ensure all changes are committed and pushed to GitHub or your Git provider.

2. **Import Project into Vercel**:
   - Create a new project in the [Vercel Dashboard](https://vercel.com).
   - Select the `Vivre` repository.
   - Framework preset: **Next.js**.
   - Build command: `npm run build` (or Next.js default).
   - Install command: `npm install`.

3. **Configure Environment Variables in Vercel**:
   In **Project Settings > Environment Variables**, add the following production variables:

   | Variable | Type | Description |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Public | Production Supabase Project URL (`https://<project-ref>.supabase.co`) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Production Supabase Publishable Key (`sb_publishable_...`) |
   | `SUPABASE_SECRET_KEY` | Secret | Production Supabase Secret Key (`sb_secret_...` server-only) |
   | `NEXT_PUBLIC_APP_URL` | Public | Canonical production URL (e.g. `https://vivre.app`) |
   | `RESEND_API_KEY` | Secret | Resend API Key for transactional notifications |
   | `CRON_SECRET` | Secret | High-entropy secret for securing Vercel Cron endpoints |
   | `UPSTASH_REDIS_REST_URL` | Secret | (Optional) Upstash Redis REST URL for distributed rate limiting |
   | `UPSTASH_REDIS_REST_TOKEN` | Secret | (Optional) Upstash Redis token |

4. **Deploy**:
   Trigger the production deployment. Vercel automatically deploys edge functions, Server Components, and optimized static assets.

---

## 9. Production Database Setup (Supabase)

1. **Create Supabase Production Project**:
   Create a new project in [Supabase Cloud](https://supabase.com).

2. **Apply Production Migrations**:
   Execute the version-controlled SQL migrations against your remote Supabase instance:
   ```bash
   # Link Supabase project (one-time)
   npx supabase link --project-ref <your-project-ref>

   # Push all migrations to remote production database
   npx supabase db push
   ```

3. **Row Level Security (RLS) Verification**:
   All 11 public schema tables have Row Level Security enabled. Verify policies in the Supabase dashboard or via SQL:
   ```sql
   select tablename, rowsecurity from pg_tables where schemaname = 'public';
   ```

4. **Demo Account Seeding (Optional / Staging Only)**:
   To populate a clean staging or demonstration environment with sample directives and progression metrics:
   ```bash
   npx supabase db execute --file supabase/seed.sql
   ```

---

## 10. Demo Account Credentials

> **Notice**: The following credentials belong exclusively to the seeded, unprivileged demo account intended for automated smoke tests, preview reviews, and feature audits. Never use privileged or real production credentials in documentation.

- **Email**: `demo@vivre.app`
- **Password**: `VivrePilot2026!`
- **Callsign**: `AtlasDemoPilot`
- **Initial State**: Level 5, 450 XP, 180 Starlight, 12 Astral Shards, 7-day streak.

---

## 11. Production Health Check & Monitoring

Vivre provides an authoritative health check endpoint at `/api/health` that validates both Next.js server runtime and live Supabase database connectivity:

```bash
curl -i https://your-production-domain.com/api/health
```

**Expected JSON Response (200 OK)**:
```json
{
  "status": "ok",
  "uptime": 1420,
  "timestamp": "2026-09-13T11:30:00.000Z",
  "version": "0.1.0",
  "database": "connected"
}
```

External monitoring services (e.g. BetterStack, Datadog, or UptimeRobot) can monitor this URL with a 30s interval. If database connectivity is disrupted, the route returns `"status": "degraded"` or HTTP 503.

---

## 12. Performance & Architecture Standards

- **Server Components by Default**: Pages and layout shells are React Server Components with zero hydration overhead.
- **Dynamic 3D Code Splitting**: Three.js and `@react-three/fiber` bundles are isolated in asynchronous client chunks and dynamically loaded with Suspense fallbacks. No WebGL code enters the critical initial page bundle.
- **Demand Frameloop**: WebGL canvases run with `frameloop="demand"`, rendering strictly on interaction or state changes, automatically pausing when scrolled out of view or tab is hidden.
- **Font Subsetting**: Google Fonts (`Cinzel` and `Plus Jakarta Sans`) load strictly necessary weights with `display: swap`.
- **Dynamic SEO**: Dynamic OpenGraph images, Favicon, `robots.txt`, and `sitemap.xml` are built natively with Next.js 16 metadata conventions.
