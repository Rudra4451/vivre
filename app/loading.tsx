export default function GlobalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading celestial telemetry"
      className="min-h-screen flex items-center justify-center p-4 bg-[var(--atlas-bg)]"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing Starlight Astrolabe Ring */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute h-full w-full rounded-full border border-[var(--atlas-line)] animate-ping opacity-25" />
          <div className="h-12 w-12 rounded-full border-2 border-[var(--atlas-line)] border-t-[var(--atlas-reward)] animate-spin" />
          <span className="absolute font-mono text-sm text-[var(--atlas-reward)]">✦</span>
        </div>

        <div className="text-center space-y-1">
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--atlas-ink)] font-semibold">
            Calibrating Constellations
          </div>
          <div className="font-mono text-[11px] text-[var(--atlas-muted)]">
            Synchronizing telemetry coordinates...
          </div>
        </div>
      </div>
    </div>
  );
}
