"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

export default function CommandDeckError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[Command Deck Route Error]", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto max-w-2xl px-4 py-16 text-center space-y-6"
    >
      <div className="rounded-2xl border border-[var(--atlas-danger)]/30 bg-[var(--atlas-surface)] p-8 shadow-lg">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--atlas-danger)]/10 text-[var(--atlas-danger)] text-2xl font-bold mb-3">
          ⚠️
        </div>

        <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)] tracking-tight">
          Command Deck Signal Interrupted
        </h2>

        <p className="mt-2 text-sm text-[var(--atlas-muted)] leading-relaxed">
          Could not establish synchronization with the authoritative progression engine. Your local task drafts and offline completions are preserved.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 rounded bg-[var(--atlas-surface-elevated)] border border-[var(--atlas-line)] text-left font-mono text-[11px] text-[var(--atlas-danger)] overflow-x-auto">
            {error.message}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => reset()}
            className="text-xs"
          >
            Retry Synchronization
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            Reload Deck
          </Button>
        </div>
      </div>
    </div>
  );
}
