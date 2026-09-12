"use client";

import * as React from "react";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { LevelUpCelebration } from "./LevelUpCelebration";

export function QuestCelebrationModal() {
  const celebration = useQuestBoardStore((s) => s.celebration);

  if (!celebration) return null;

  // Level up receives the premium full-screen celestial ascension moment
  if (celebration.leveledUp) {
    return <LevelUpCelebration />;
  }

  // Normal / Critical completions are experienced in-situ on the QuestCard via QuestCompletionEffect
  return null;
}
