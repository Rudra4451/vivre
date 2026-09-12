"use client";

import * as React from "react";

export interface QuestEmptyStateProps {
  onQuickAddFocus?: () => void;
}

export function QuestEmptyState({ onQuickAddFocus }: QuestEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-10 sm:p-14 text-center backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/10 to-indigo-500/20 border border-sky-500/20 text-3xl mb-4 shadow-[0_0_30px_rgba(56,189,248,0.1)]">
        🪐
      </div>
      <h3 className="text-lg font-bold text-slate-100">
        All Quadrants Clear
      </h3>
      <p className="mt-1.5 max-w-sm text-xs text-slate-400">
        No active quests currently assigned to your flight deck. Initialize a routine or custom objective above to begin earning telemetry XP.
      </p>
      {onQuickAddFocus && (
        <button
          type="button"
          onClick={onQuickAddFocus}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-sky-400 border border-slate-700/60 transition-all hover:border-sky-500/40"
        >
          <span>+</span>
          <span>Assign First Objective</span>
        </button>
      )}
    </div>
  );
}
