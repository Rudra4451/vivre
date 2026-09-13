"use client";

import * as React from "react";
import type { WeeklyChallengeWithProgress } from "@/types";
import { claimWeeklyChallengeAction } from "@/lib/game/actions";
import { AtlasAudio } from "@/lib/game/audio";
import { AtlasAnnounce } from "@/lib/game/announcements";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

export interface WeeklyChallengesCardProps {
  initialChallenges: WeeklyChallengeWithProgress[];
  onRewardClaimed?: (awarded: number, newBalance: number) => void;
  className?: string;
}

export function WeeklyChallengesCard({
  initialChallenges,
  onRewardClaimed,
  className = "",
}: WeeklyChallengesCardProps) {
  const [challenges, setChallenges] = React.useState<WeeklyChallengeWithProgress[]>(initialChallenges);
  const [claimingId, setClaimingId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleClaim = async (challenge: WeeklyChallengeWithProgress) => {
    if (challenge.claimed || !challenge.completed || claimingId) return;

    setClaimingId(challenge.id);
    setErrorMsg(null);

    try {
      const res = await claimWeeklyChallengeAction({ challengeId: challenge.id });
      if (!res.success || !res.data) {
        setErrorMsg(res.error ?? "Failed to claim weekly challenge reward");
        return;
      }

      // Optimistically update claimed state
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challenge.id ? { ...c, claimed: true } : c
        )
      );

      // Play celestial chime & screen reader notification
      AtlasAudio.playBonus();
      AtlasAnnounce.xpGained(res.data.rare_currency_awarded, "Weekly Expedition");

      onRewardClaimed?.(res.data.rare_currency_awarded, res.data.rare_currency);
    } catch (err) {
      console.error("[WeeklyChallenges] Claim error:", err);
      setErrorMsg("A network error occurred while claiming reward.");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--atlas-line)] pb-3 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--atlas-reward)]">◈</span>
            <CardTitle as="h2" className="font-display text-sm font-bold tracking-wide text-[var(--atlas-ink)]">
              Weekly Celestial Directives
            </CardTitle>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Synchronize habits with the cosmos. Rewards Starlight Embers (rare currency) only.
          </CardDescription>
        </div>

        <Badge variant="outline" size="sm" className="font-mono text-[10px] self-start sm:self-auto">
          Resets Monday 00:00 UTC
        </Badge>
      </div>

      {errorMsg && (
        <div role="alert" aria-live="assertive" className="mt-3 text-xs text-[var(--atlas-danger)] bg-[var(--atlas-danger)]/10 border border-[var(--atlas-danger)]/30 rounded p-2 font-mono">
          {errorMsg}
        </div>
      )}

      <div className="mt-4 space-y-3.5">
        {challenges.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--atlas-muted)] italic">
            No active directives for this weekly cycle.
          </div>
        ) : (
          challenges.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-3.5 transition-all ${
                c.claimed
                  ? "border-[var(--atlas-line)]/50 bg-[var(--atlas-surface)]/40 opacity-70"
                  : c.completed
                  ? "border-[var(--atlas-reward)]/50 bg-[var(--atlas-surface-elevated)] ring-1 ring-[var(--atlas-reward)]/30"
                  : "border-[var(--atlas-line)] bg-[var(--atlas-surface)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-[var(--atlas-ink)]">
                      {c.title}
                    </h3>
                    {c.target_category && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-[var(--atlas-line)] bg-[var(--atlas-bg)] text-[var(--atlas-muted)]">
                        {c.target_category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--atlas-muted)] leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[var(--atlas-reward)] bg-[var(--atlas-reward-subtle)] border border-[var(--atlas-reward)]/30 px-2 py-0.5 rounded">
                    <span>✦</span>
                    <span>+{c.reward_rare_currency} Embers</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar & Claim Button */}
              <div className="mt-3.5 flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-[var(--atlas-muted)]">
                    <span>
                      Progress: {c.current_count} / {c.target_count} quests
                    </span>
                    <span>{c.percent}%</span>
                  </div>
                  <ProgressBar
                    value={c.percent}
                    label={`${c.title} progress`}
                    variant={c.completed ? "reward" : "default"}
                    size="sm"
                  />
                </div>

                <div className="shrink-0">
                  {c.claimed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-[var(--atlas-muted)] bg-[var(--atlas-surface)] border border-[var(--atlas-line)] px-2.5 py-1 rounded">
                      <span>✓</span>
                      <span>Claimed</span>
                    </span>
                  ) : c.completed ? (
                    <Button
                      variant="reward"
                      size="sm"
                      className="text-xs font-bold font-mono"
                      disabled={claimingId === c.id}
                      onClick={() => handleClaim(c)}
                      aria-label={`Claim ${c.reward_rare_currency} Starlight Embers for ${c.title}`}
                    >
                      {claimingId === c.id ? "Claiming..." : "Claim Embers"}
                    </Button>
                  ) : (
                    <span className="text-[11px] font-mono text-[var(--atlas-muted)] px-2">
                      In Flight
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
