import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--atlas-bg)] text-[var(--atlas-ink)]">
      <div className="max-w-md w-full rounded-2xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)] p-8 text-center shadow-xl">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--atlas-surface-elevated)] border border-[var(--atlas-line)] text-2xl font-mono text-[var(--atlas-reward)] mb-4">
          ✦
        </div>

        <h1 className="font-display text-3xl font-bold text-[var(--atlas-ink)] tracking-tight">
          404 • Lost in the Void
        </h1>

        <p className="mt-3 text-sm text-[var(--atlas-muted)] leading-relaxed">
          The celestial coordinates you requested do not align with any known charted constellations.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[var(--atlas-reward)] text-[var(--atlas-bg)] font-bold text-xs px-6 py-3 tracking-wide transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--atlas-ink)]"
          >
            Return to Command Deck
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-[var(--atlas-line)] bg-[var(--atlas-surface-elevated)] text-[var(--atlas-ink)] font-medium text-xs px-6 py-3 transition-colors hover:bg-[var(--atlas-surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--atlas-ink)]"
          >
            Home Orbit
          </Link>
        </div>
      </div>
    </main>
  );
}
