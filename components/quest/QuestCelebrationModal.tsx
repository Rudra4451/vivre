"use client";

import * as React from "react";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function QuestCelebrationModal() {
  const celebration = useQuestBoardStore((s) => s.celebration);
  const clearCelebration = useQuestBoardStore((s) => s.clearCelebration);

  if (!celebration) return null;

  return (
    <Modal
      isOpen={!!celebration}
      onClose={clearCelebration}
      title={celebration.leveledUp ? `Ascension to Level ${celebration.newLevel}` : "Authoritative Telemetry Synchronized"}
      description={`Quadrant ${celebration.category} progression ledger updated.`}
    >
      <div className="text-center py-4 space-y-4">
        {/* Celestial Star Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-atlas-reward/50 bg-atlas-reward-subtle text-3xl shadow-[0_0_25px_var(--atlas-reward-subtle)]">
          {celebration.leveledUp ? "🌟" : "✦"}
        </div>

        <div className="space-y-1">
          <div className="font-mono text-2xl font-bold text-atlas-reward">
            +{celebration.xpAwarded} XP
          </div>
          {celebration.bonusRoll !== "base" && (
            <div className="inline-block font-mono text-[11px] uppercase tracking-wider text-atlas-reward bg-atlas-reward-subtle px-2 py-0.5 rounded border border-atlas-reward/40">
              {celebration.bonusRoll} Critical Roll
            </div>
          )}
        </div>

        <p className="text-xs text-atlas-muted max-w-xs mx-auto leading-relaxed">
          {celebration.leveledUp
            ? "Your stellar chart has unlocked new milestone coordinates across the atlas."
            : "Atomic state transition confirmed in PostgreSQL progression engine."}
        </p>

        <div className="pt-2">
          <Button variant="reward" size="md" onClick={clearCelebration} className="w-full">
            Resume Celestial Atlas
          </Button>
        </div>
      </div>
    </Modal>
  );
}
