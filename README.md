<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Supabase-RLS-3fcf8e?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Three.js-R186-black?style=for-the-badge&logo=three.js" alt="Three.js" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
</p>

<h1 align="center">✦ V I V R E ✦</h1>
<h3 align="center"><em>Chart the Course of Your Life</em></h3>

<p align="center">
  <strong>A gamified self-improvement platform that transforms daily habits into a celestial star atlas.</strong><br/>
  Complete real-world quests. Build constellations. Level up your life.
</p>

<p align="center">
  <a href="https://vivre-five.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live_Demo-vivre--five.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <img src="https://img.shields.io/badge/Team-Orbit-blueviolet?style=for-the-badge" alt="Team Orbit" />
  <img src="https://img.shields.io/badge/Tests-132_passing-brightgreen?style=for-the-badge" alt="132 Tests" />
  <img src="https://img.shields.io/badge/Database-Connected-success?style=for-the-badge&logo=supabase" alt="Database Connected" />
</p>

---

## 🌟 The Problem

Most habit trackers are boring. They show you a checkbox. You check it. You forget about it the next day. There is no sense of **journey**, no feeling of **progress**, and no reason to come back.

**People don't abandon habits because they're lazy — they abandon them because the tools are uninspiring.**

## 🚀 Our Solution

**Vivre** reimagines self-improvement as an **interactive star atlas**. Instead of ticking checkboxes, you embark on quests across five life dimensions — **Body, Mind, Discipline, Craft, and Spirit** — and watch your personal constellation grow in a real-time 3D star map.

Every completed quest earns XP, currency, and attribute points. Maintain streaks to unlock multipliers. Conquer weekly challenges. Collect trophies. Customize your sky with cosmetics from the Starlight Shop.

> **The result:** A self-improvement app that feels like a game, backed by the security of a production-grade platform.

---

## ✨ Feature Highlights

| Feature | Description |
|:---|:---|
| 🗺️ **3D Star Atlas** | Interactive WebGL constellation map built with React Three Fiber. Under 50k triangles, demand-driven rendering, auto-pauses when hidden. |
| ⚔️ **Quest Board** | Server-authoritative quest system with optimistic UI. Daily caps, streak tracking, XP curves, and level-up celebrations. |
| 📊 **Attribute Pentagon** | Responsive SVG radar chart visualizing your five core life attributes — no heavy chart library needed. |
| 🏆 **Trophy Room** | 10 milestone-based trophies evaluated server-side. Filterable display with audio and haptic feedback on unlock. |
| 🛒 **Cosmetic Shop** | Spend earned currency on sky overlays, star colors, avatar frames, and constellation styles. Atomic purchase transactions. |
| 📅 **Weekly Challenges** | Server-generated challenges like "Complete 5 Discipline quests." Rewards rare currency only. |
| 🔔 **Email Notifications** | Come-back reminders and weekly recap emails via Resend + React Email. Timezone-aware, cooldown-protected. |
| 🎵 **Celestial Audio** | Adaptive sound system with Howler.js. Completion chimes, level-up fanfares, and a calm mode toggle. |
| 🌙 **Calm Mode** | One toggle to disable non-essential sounds, reduce animations, and respect `prefers-reduced-motion`. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│                                                             │
│   Landing Page ──► Login / Signup ──► Command Deck          │
│        │                                    │               │
│   3D Star Atlas        Quest Board ◄── Attribute Chart      │
│   (React Three         Trophy Room     Weekly Challenge     │
│    Fiber, lazy)        Cosmetic Shop                        │
│        │                    │                               │
│        ▼                    ▼                               │
│   ┌─────────────────────────────────────┐                   │
│   │     Zustand Store (Client State)    │                   │
│   │     Audio Manager (Howler.js)       │                   │
│   └─────────────────────────────────────┘                   │
└────────────────────────┬────────────────────────────────────┘
                         │  Server Actions (RSC)
                         │  + Zod Validation
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS 16 SERVER                        │
│                                                             │
│   Server Components ── Server Actions ── Route Handlers     │
│        │                    │                  │             │
│   Auth Guard           Game Engine        Cron Jobs         │
│   (requireAuth)        (Atomic RPCs)      (Email Send)      │
│        │                    │                  │             │
│        ▼                    ▼                  ▼             │
│   ┌─────────────────────────────────────────────────┐       │
│   │              Supabase (PostgreSQL)              │       │
│   │                                                 │       │
│   │   Row-Level Security on ALL tables              │       │
│   │   Atomic RPCs for XP / Currency / Purchases     │       │
│   │   7 Migration Files · 11+ Tables                │       │
│   └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security (Zero Trust, Server-Authoritative)

Vivre is built with the principle that **the client is never trusted**.

- **Every mutation** goes through a Server Action that re-authenticates the user via `supabase.auth.getUser()`
- **Every database table** has Row-Level Security (RLS) policies scoped to `auth.uid()`
- **XP, currency, prices, and levels** are computed server-side inside atomic PostgreSQL RPCs
- **Purchases** use idempotency keys and atomic balance-check-then-deduct in a single transaction
- **Daily quest caps** are enforced server-side with race-condition protection
- **No client-side** user ID, balance, or price is ever trusted

---

## 🧪 Testing

**132 tests** across 13 test suites, covering:

| Suite | Covers |
|:---|:---|
| `progression-engine` | XP curves, level-up logic, streak multipliers |
| `server-action` | Auth guards, input validation, atomic mutations |
| `concurrency` | Race conditions, duplicate requests, daily caps |
| `security-hardening` | RLS policies, secret exposure, input sanitization |
| `quest-board` | Completion flow, optimistic UI, error recovery |
| `shop-and-challenges` | Purchase atomicity, challenge progress, rewards |
| `starmap` | 3D scene lifecycle, demand rendering, cleanup |
| `audio-system` | Howler integration, calm mode, blocked audio |
| `trophies` | Milestone evaluation, unlock logic, filtering |
| `email-notifications` | Timezone handling, cooldowns, duplicate prevention |
| `accessibility` | Keyboard nav, ARIA, focus management, reduced motion |
| `motion-system` | Animation triggers, reduced motion respect |
| `xp-curve` | Mathematical progression, edge cases |

```bash
npm run test        # Run all 132 tests
npm run lint        # ESLint
npm run typecheck   # TypeScript strict mode
```

---

## 📂 Project Structure

```
vivre/
├── app/                          # Next.js 16 App Router
│   ├── (public)/page.tsx         #   Landing page with 3D hero
│   ├── app/page.tsx              #   Command Deck (main dashboard)
│   ├── showcase/page.tsx         #   Constellation Atlas showcase
│   ├── login/                    #   Authentication pages
│   ├── signup/
│   ├── reset-password/
│   └── api/                      #   Route Handlers (health, cron)
│
├── components/
│   ├── starmap/                  #   3D Star Atlas (R3F)
│   ├── quest/                    #   Quest Board UI
│   ├── attributes/               #   SVG Radar Chart
│   ├── challenges/               #   Weekly Challenge Cards
│   ├── shop/                     #   Cosmetic Shop
│   ├── trophy/                   #   Trophy Room
│   ├── emails/                   #   React Email Templates
│   ├── layout/                   #   Navbar, Shell
│   ├── ui/                       #   Design System Primitives
│   └── theme/                    #   Theme Provider
│
├── lib/
│   ├── auth/                     #   Authentication helpers
│   ├── game/                     #   Core game engine + actions
│   ├── notifications/            #   Email delivery system
│   ├── supabase/                 #   Client, server, admin clients
│   ├── rate-limit/               #   Upstash rate limiting
│   └── validation/               #   Input validation
│
├── supabase/
│   └── migrations/               #   7 SQL migration files
│
├── tests/                        #   13 test suites, 132 tests
└── types/                        #   Generated database types
```

---

## ⚡ Performance

Vivre is engineered for speed across every device:

| Metric | Target |
|:---|:---|
| **Desktop FPS** | ~60 fps |
| **Mobile FPS** | 30–60 fps (adaptive) |
| **3D Triangle Budget** | < 50,000 |
| **WebGL Loading** | Lazy-loaded, code-split, zero initial bundle cost |
| **Rendering Strategy** | `frameloop="demand"` — renders only on interaction |
| **Background Behavior** | Auto-pauses when tab hidden or offscreen |
| **Reduced Motion** | Fully respects `prefers-reduced-motion` |
| **Server Components** | Default — minimal client-side hydration |
| **Font Strategy** | Subsetted Google Fonts with `display: swap` |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19, Tailwind CSS 4, Framer Motion |
| **3D** | Three.js R186, React Three Fiber, Drei |
| **Database** | Supabase (PostgreSQL + RLS + Auth) |
| **Audio** | Howler.js |
| **Email** | Resend + React Email |
| **State** | Zustand |
| **Validation** | Zod 4 |
| **Testing** | Vitest |
| **Language** | TypeScript (strict mode) |

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Rudra4451/vivre.git
cd vivre

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL and keys

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see Vivre in action.

### Database Setup

```bash
# Install Supabase CLI
npm install -D supabase

# Start local Supabase (requires Docker)
npx supabase init
npx supabase start

# Apply all migrations
npx supabase db reset
```

---

## 🌐 Deployment

Vivre is designed for **Vercel + Supabase** deployment:

1. Push to GitHub → Import into [Vercel](https://vercel.com)
2. Create a [Supabase](https://supabase.com) project
3. Set environment variables in Vercel dashboard
4. Push migrations: `npx supabase db push`
5. Deploy 🚀

---

## 👥 Team Orbit

Built with ❤️ by **Team Orbit** for the hackathon.

---

## 📄 License

MIT © 2026 Team Orbit
