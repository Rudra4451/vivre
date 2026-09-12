# Vivre Security Architecture & Policy

This document mandates core security standards and non-negotiable operational requirements for the Vivre platform.

---

## 1. Row Level Security (RLS) Requirement

- **Mandatory Enablement**: Every table exposed to Supabase clients (e.g. `profiles`, `game_audit_logs`, `quests`) **MUST** have Row Level Security explicitly enabled (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`).
- **Default Deny**: Default posture is complete denial of all operations until explicit policies are declared.
- **Least Privilege Access**:
  - `SELECT` policies must restrict reading private data to `auth.uid() = user_id`.
  - Client-originated `INSERT`, `UPDATE`, and `DELETE` on critical state tables (experience, quest completion, item acquisitions) are **strictly forbidden**.
  - All critical mutations must be executed strictly by server-authoritative Route Handlers or Server Actions leveraging the isolated Admin/Service-Role client.

---

## 2. Server-Authoritative Game Logic

- **Zero Client Trust**: The browser client is treated as an untrusted visual presentation layer.
- **Server Validation**:
  - All game state transitions, actions, quests, and rewards are calculated and validated strictly on the server.
  - Clients emit intentions/actions (e.g., `POST /api/action`), which are verified by server-side rules engines before committing state changes.
- **Tamper Resistance**: No client calculation or payload attribute may be trusted without cryptographic validation or server-side replay verification.

---

## 3. Secret Handling & Boundary Isolation

- **Client vs. Server Environment Variables**:
  - `NEXT_PUBLIC_*` variables are strictly limited to non-sensitive identifiers (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`).
  - `SUPABASE_SECRET_KEY` (service-role key) and `RESEND_API_KEY` must **never** receive the `NEXT_PUBLIC_` prefix and must never be exposed or bundled into browser code.
- **`server-only` Guardrails**:
  - The admin Supabase client is isolated in [`lib/supabase/admin.ts`](file:///c:/Users/rudra/Vivre/lib/supabase/admin.ts) and guarded with `import "server-only";`.
  - Next.js build-time bundling enforces that any attempt to import this module from a Client Component will fail compilation immediately.

---

## 4. Authentication & Authorization Requirements

- **PKCE-Compatible SSR Flow**:
  - Authentication adheres to modern Supabase SSR conventions using secure HTTP-only cookies.
  - State is negotiated via Proof Key for Code Exchange (PKCE) tokens exchanged at [`app/api/auth/callback/route.ts`](file:///c:/Users/rudra/Vivre/app/api/auth/callback/route.ts).
- **No LocalStorage Token Storage**:
  - Session tokens must never be persisted in browser `localStorage` or `sessionStorage` to mitigate Cross-Site Scripting (XSS) credential theft.
- **Server-Side Session Verification**:
  - Protected endpoints and server components verify sessions using `supabase.auth.getUser()`, ensuring cryptographic authenticity directly against the auth authority.

---

## 5. Rate Limiting Requirement

- **Abuse Prevention**:
  - All public APIs, authentication routes, and game action endpoints must pass through rate limiters.
  - Implementations conform to [`lib/rate-limit/index.ts`](file:///c:/Users/rudra/Vivre/lib/rate-limit/index.ts).
- **Thresholds**:
  - Authentication attempts: capped at 5 attempts per IP per 5 minutes.
  - Game action submissions: capped at 30 requests per minute per authenticated user.
  - Excess requests return `429 Too Many Requests` along with standard `Retry-After` headers.

---

## 6. Immutable Game History & Audit Trail

- **Append-Only Ledger**:
  - Game progression events, inventory modifications, and quest resolutions must be committed to append-only audit tables (e.g., `game_audit_logs`).
- **Prohibition of Mutation**:
  - Audit log tables must strictly forbid `UPDATE` and `DELETE` operations, even for application users. Only append `INSERT` operations are permitted via the server-authoritative service role.
- **Traceability**:
  - Every game event record records `user_id`, `event_type`, `payload`, and a server-generated `created_at` timestamp for forensic validation.
