import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function PublicLandingPage() {
  return (
    <div className="relative isolate overflow-hidden py-16 sm:py-24">
      {/* Background Cartographic Star Chart Grid Elements */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-10"
        aria-hidden="true"
      >
        <div className="h-[600px] w-[600px] rounded-full border border-[var(--atlas-line)] [mask-image:radial-gradient(circle,black,transparent_70%)]" />
        <div className="absolute h-[420px] w-[420px] rounded-full border border-dashed border-[var(--atlas-line)]" />
        <div className="absolute h-[800px] w-px bg-[var(--atlas-line)]" />
        <div className="absolute w-[800px] h-px bg-[var(--atlas-line)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center">
            <Badge variant="outline" size="md">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--atlas-success)] mr-1.5" />
              Cartographic Star Atlas
            </Badge>
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--atlas-ink)] sm:text-6xl">
            Chart the Course of Your Life in <span className="underline decoration-[var(--atlas-line)] decoration-1 underline-offset-8">Vivre</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-[var(--atlas-muted)] max-w-2xl mx-auto">
            A celestial star atlas of human discipline. Every verified undertaking aligns your constellations,
            backed by server-authoritative integrity and cartographic precision.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-4">
            <Link href="/signup">
              <Button size="lg" variant="primary">
                Begin Cartography
              </Button>
            </Link>
            <Link href="/app">
              <Button size="lg" variant="outline">
                Enter Command Deck
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid with Cartographic Engraving */}
        <div className="mx-auto mt-20 max-w-5xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card>
              <div className="text-[10px] font-mono text-[var(--atlas-muted)] uppercase tracking-wider mb-2">
                Section 01 · Codex
              </div>
              <CardTitle className="text-base font-display">Authoritative Ledgers</CardTitle>
              <CardDescription className="mt-2 text-xs leading-relaxed">
                Task completion transactions execute atomically inside PostgreSQL. No client-side
                XP inflation or unverified progression.
              </CardDescription>
            </Card>

            <Card>
              <div className="text-[10px] font-mono text-[var(--atlas-muted)] uppercase tracking-wider mb-2">
                Section 02 · Dual-State
              </div>
              <CardTitle className="text-base font-display">Night Sky & Star Atlas</CardTitle>
              <CardDescription className="mt-2 text-xs leading-relaxed">
                Two authentic visual states of one living cosmos. Restrained ink and linework by day,
                deep celestial observation by night.
              </CardDescription>
            </Card>

            <Card>
              <div className="text-[10px] font-mono text-[var(--atlas-muted)] uppercase tracking-wider mb-2">
                Section 03 · Celestial Map
              </div>
              <CardTitle className="text-base font-display">3D Constellation Sphere</CardTitle>
              <CardDescription className="mt-2 text-xs leading-relaxed">
                Interactive spatial star map powered by Three.js, projecting your discipline categories
                into resonant celestial geometry.
              </CardDescription>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
