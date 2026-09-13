"use client";

import * as React from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Vivre Root Error]", error);
  }, [error]);

  return (
    <main
      role="alert"
      className="min-h-screen flex items-center justify-center p-4 bg-[var(--atlas-bg)] text-[var(--atlas-ink)]"
    >
      <div className="max-w-md w-full rounded-2xl border border-[var(--atlas-danger)]/30 bg-[var(--atlas-surface)] p-8 text-center shadow-xl">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--atlas-danger)]/10 border border-[var(--atlas-danger)]/30 text-2xl text-[var(--atlas-danger)] mb-4">
          ⚠️
        </div>

        <h1 className="font-display text-2xl font-bold text-[var(--atlas-ink)] tracking-tight">
          Orbital Anomaly Detected
        </h1>

        <p className="mt-3 text-sm text-[var(--atlas-muted)] leading-relaxed">
          An unexpected interruption disrupted the celestial telemetry stream. Your data and progression remain safe and synchronized.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--atlas-surface-elevated)] border border-[var(--atlas-line)] text-left font-mono text-[11px] text-[var(--atlas-danger)] overflow-x-auto">
            {error.message}
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[var(--atlas-ink)] text-[var(--atlas-bg)] font-bold text-xs px-6 py-3 tracking-wide transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--atlas-ink)]"
          >
            Re-align Telemetry
          </button>
          <Link
            href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-[var(--atlas-line)] bg-[var(--atlas-surface-elevated)] text-[var(--atlas-ink)] font-medium text-xs px-6 py-3 transition-colors hover:bg-[var(--atlas-surface-hover)] focus-visible:ring-2 focus-visible:ring-[var(--atlas-ink)]"
          >
            Command Deck
          </Link>
        </div>
      </div>
    </main>
  );
}
