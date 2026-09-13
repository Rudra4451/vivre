export default function CommandDeckLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Command Deck Telemetry"
      aria-live="polite"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--atlas-line)] pb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-[var(--atlas-surface-elevated)]" />
          <div className="h-4 w-72 rounded-lg bg-[var(--atlas-surface-elevated)] opacity-60" />
        </div>
        <div className="h-8 w-36 rounded-lg bg-[var(--atlas-surface-elevated)]" />
      </div>

      {/* Header Gauge Skeleton */}
      <div className="h-28 rounded-xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)] p-6" />

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Directives Card Skeleton */}
          <div className="h-44 rounded-xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)] p-6" />
          {/* Quests Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 rounded-xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)]" />
            <div className="h-40 rounded-xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)]" />
            <div className="h-40 rounded-xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)]" />
            <div className="h-40 rounded-xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)]" />
          </div>
        </div>

        {/* Right Column: Starmap & Radar Skeleton */}
        <div className="space-y-6">
          <div className="h-80 rounded-xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)]" />
          <div className="h-72 rounded-xl border border-[var(--atlas-line)] bg-[var(--atlas-surface)]" />
        </div>
      </div>
    </div>
  );
}
