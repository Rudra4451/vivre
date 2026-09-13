"use client";

import * as React from "react";
import type { Profile } from "@/types";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { calculateXpToNext } from "@/lib/game/progression";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AtlasAudio } from "@/lib/game/audio";
import { AtlasAnnounce } from "@/lib/game/announcements";

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

  // Announce streak shield use if authoritative server consumed it
  const prevShield = React.useRef(streakShieldAvailable);
  React.useEffect(() => {
    if (prevShield.current && !streakShieldAvailable) {
      AtlasAnnounce.streakShieldUsed(currentStreak);
      AtlasAudio.playStreakShield();
    }
    prevShield.current = streakShieldAvailable;
  }, [streakShieldAvailable, currentStreak]);

  return (
    <div className="rounded-xl border border-atlas-line bg-atlas-surface p-5 sm:p-6 text-atlas-ink shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        {/* Level & Pilot Title */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-atlas-line bg-atlas-surface-elevated text-atlas-ink font-display font-bold text-xl shadow-xs">
            <span>{level}</span>
            <span className="absolute -bottom-1 -right-1 text-[9px] font-mono uppercase bg-atlas-surface border border-atlas-line text-atlas-muted px-1.5 py-0.2 rounded">
              Lvl
            </span>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-atlas-muted">
              Pilot Status
            </div>
            <div className="font-display text-base font-bold text-atlas-ink tracking-wide">
              {initialProfile.username ?? "Autonomous Explorer"}
            </div>
          </div>
        </div>

        {/* XP Progress Bar (Reward Metric: uses --atlas-reward) */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-atlas-muted flex items-center gap-1.5 font-mono text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-atlas-reward" />
              TELEMETRY XP
            </span>
            <span className="font-mono text-xs text-atlas-ink">
              <span className="text-atlas-reward font-bold">{currentXp}</span> / {xpToNext} XP ({xpProgressPercent}%)
            </span>
          </div>
          <ProgressBar
            value={xpProgressPercent}
            label="Level ascension progress"
            variant="reward"
            size="md"
          />
          <div className="flex justify-between text-[11px] text-atlas-muted font-mono">
            <span>Ascension to Level {level + 1}</span>
            <span>{Math.max(0, xpToNext - currentXp)} XP remaining</span>
          </div>
        </div>

        {/* Streak & Today's Progress */}
        <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 md:border-l border-atlas-line-subtle pt-4 md:pt-0 md:pl-6">
          {/* Streak Flame */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-atlas-ink">
              <span className="text-base">🔥</span>
              <span className="font-mono text-xl font-bold">{currentStreak}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-atlas-muted font-mono">
              <span>Streak</span>
              {streakShieldAvailable && (
                <span
                  title="Streak Shield active: forgives 1 missed day"
                  className="cursor-help"
                >
                  🛡️
                </span>
              )}
            </div>
          </div>

          {/* Today's Completions */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-atlas-ink">
              <span className="text-base">✓</span>
              <span className="font-mono text-xl font-bold">
                {todayCompletionsCount}
              </span>
            </div>
            <span className="text-[11px] text-atlas-muted font-mono">Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
