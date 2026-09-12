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

## 8. Production Build Commands

Create an optimized production bundle and verify compile-time constraints:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

---

## Project Structure Overview

```text
├── app/
│   ├── (public)/          # Public marketing & landing routes
│   ├── login/             # PKCE authentication sign-in
│   ├── signup/            # Account registration
│   ├── app/               # Authenticated Command Deck dashboard
│   ├── api/
│   │   ├── health/        # System telemetry health-check
│   │   └── auth/callback/ # PKCE code-for-session exchange
│   ├── globals.css        # Tailwind CSS styles
│   └── layout.tsx         # Root layout shell
├── components/
│   ├── ui/                # Base primitives (Button, Card, Input)
│   ├── quest/             # Quest status & overview components
│   ├── starmap/           # React Three Fiber 3D visualizer
│   └── layout/            # Navbar & Footer
├── lib/
│   ├── supabase/          # Browser, Server, and Admin (server-only) clients
│   ├── auth/              # Server-side authentication helpers
│   ├── game/              # Authoritative contracts & Zustand store
│   ├── validation/        # Zod validation schemas
│   ├── rate-limit/        # Route rate limiting
│   └── utils/             # Utility helpers (cn)
├── emails/                # React Email templates
├── types/                 # TypeScript domain and database types
├── SECURITY.md            # Security architecture specifications
└── README.md
```
