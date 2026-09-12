"use client";

import * as React from "react";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";

export function QuestCelebrationModal() {
  const celebration = useQuestBoardStore((s) => s.celebration);
  const clearCelebration = useQuestBoardStore((s) => s.clearCelebration);

  if (!celebration) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-sky-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center shadow-[0_0_50px_rgba(56,189,248,0.2)]">
        {/* Glow indicator */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-sky-500/20 to-emerald-500/30 border border-sky-400/40 text-4xl shadow-[0_0_25px_rgba(56,189,248,0.3)] mb-4 animate-bounce">
          {celebration.leveledUp ? "🌟" : "⚡"}
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          {celebration.leveledUp
            ? `Ascension to Level ${celebration.newLevel}!`
            : "Telemetry Synchronized!"}
        </h3>

        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-lg font-extrabold text-emerald-400">
              +{celebration.xpAwarded} XP
            </span>
            {celebration.bonusRoll !== "base" && (
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-400 uppercase">
                {celebration.bonusRoll} Critical
              </span>
            )}
          </div>
          <p className="text-slate-400">
            {celebration.leveledUp
              ? "New planetary milestones unlocked across the Starmap."
              : `Quadrant ${celebration.category} progression ledger updated.`}
          </p>
        </div>

        <button
          type="button"
          onClick={clearCelebration}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg hover:from-sky-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all"
        >
          Resume Deck
        </button>
      </div>
    </div>
  );
}
