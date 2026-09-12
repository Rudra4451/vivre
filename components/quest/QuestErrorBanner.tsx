"use client";

import * as React from "react";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";

export function QuestErrorBanner() {
  const activeError = useQuestBoardStore((s) => s.activeError);
  const setActiveError = useQuestBoardStore((s) => s.setActiveError);

  if (!activeError) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs text-rose-300 backdrop-blur-md shadow-lg"
    >
      <div className="flex items-center gap-2">
        <span className="text-base text-rose-400">⚠️</span>
        <span>{activeError}</span>
      </div>

      <button
        type="button"
        onClick={() => setActiveError(null)}
        className="text-rose-400 hover:text-rose-200 font-semibold uppercase text-[11px] tracking-wider px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}
