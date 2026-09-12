import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";

export default function PublicLandingPage() {
  return (
    <div className="relative isolate overflow-hidden py-16 sm:py-24">
      {/* Background ambient glow */}
      <div
        className="absolute -top-40 left-1/2 -z-10 -translate-x-1/2 blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 opacity-30"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Server-Authoritative Architecture
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Chart the Unknown in <span className="text-sky-400">Vivre</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Next-generation expedition command platform powered by React Three Fiber,
            cookie-based Supabase SSR, and strict server-authoritative integrity.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-4">
            <Link href="/signup">
              <Button size="lg" variant="primary">
                Initialize Expedition
              </Button>
            </Link>
            <Link href="/app">
              <Button size="lg" variant="outline">
                Enter Command Deck
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card className="border-slate-800/80 bg-slate-900/40">
              <CardTitle className="text-sky-400">PKCE SSR Auth</CardTitle>
              <CardDescription className="mt-2 text-slate-400">
                Secure cookie-based authentication avoiding localStorage token vulnerabilities,
                integrated with Supabase SSR and Next.js App Router.
              </CardDescription>
            </Card>
            <Card className="border-slate-800/80 bg-slate-900/40">
              <CardTitle className="text-sky-400">Server-Authoritative</CardTitle>
              <CardDescription className="mt-2 text-slate-400">
                Guaranteed game action verification on the server with isolated service-role
                credentials and immutable audit logs.
              </CardDescription>
            </Card>
            <Card className="border-slate-800/80 bg-slate-900/40">
              <CardTitle className="text-sky-400">3D Starmap Ready</CardTitle>
              <CardDescription className="mt-2 text-slate-400">
                Pre-configured React Three Fiber and Three.js canvas setup with SSR hydration
                guardrails.
              </CardDescription>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
