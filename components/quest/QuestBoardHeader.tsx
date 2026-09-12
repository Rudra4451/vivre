"use client";

import * as React from "react";
import type { Profile } from "@/types";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { calculateXpToNext } from "@/lib/game/progression";

export interface QuestBoardHeaderProps {
  initialProfile: Profile;
  todayCompletionsCount: number;
}

export function QuestBoardHeader({
  initialProfile,
  todayCompletionsCount,
}: QuestBoardHeaderProps) {
  const authoritativeOverride = useQuestBoardStore((s) => s.authoritativeProfile);

  // Authoritative server state with client override if updated via RPC
  const level = authoritativeOverride?.level ?? initialProfile.level;
  const currentXp = authoritativeOverride?.currentXp ?? initialProfile.current_xp;
  const xpToNext =
    authoritativeOverride?.xpToNext ?? calculateXpToNext(level);
  const currentStreak =
    authoritativeOverride?.currentStreak ?? initialProfile.current_streak;
  const streakShieldAvailable =
    authoritativeOverride?.streakShieldAvailable ??
    initialProfile.streak_shield_available;

  const xpProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((currentXp / Math.max(1, xpToNext)) * 100))
  );

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        {/* Level & Pilot Title */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-600/30 border border-sky-500/40 text-sky-400 font-bold text-xl shadow-[0_0_20px_rgba(56,189,248,0.15)]">
            <span>{level}</span>
            <span className="absolute -bottom-1 -right-1 text-[9px] font-mono uppercase bg-slate-900 border border-sky-500/40 text-sky-300 px-1.5 py-0.2 rounded">
              Lvl
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pilot Status
            </div>
            <div className="text-base font-bold text-slate-100">
              {initialProfile.username ?? "Autonomous Explorer"}
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Experience Telemetry
            </span>
            <span className="font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">{currentXp}</span> / {xpToNext} XP ({xpProgressPercent}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/90 border border-slate-700/50 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              style={{ width: `${xpProgressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Progress to Level {level + 1}</span>
            <span>{Math.max(0, xpToNext - currentXp)} XP remaining</span>
          </div>
        </div>

        {/* Streak & Today's Progress */}
        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
          {/* Streak Flame */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="text-lg">🔥</span>
              <span className="font-mono text-xl font-bold">{currentStreak}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>Day Streak</span>
              {streakShieldAvailable && (
                <span
                  title="Streak Shield active: protects 1 missed day"
                  className="cursor-help text-sky-400"
                >
                  🛡️
                </span>
              )}
            </div>
          </div>

          {/* Today's Completions */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="text-lg">✓</span>
              <span className="font-mono text-xl font-bold">
                {todayCompletionsCount}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Today Done</span>
          </div>
        </div>
      </div>
    </div>
  );
}
