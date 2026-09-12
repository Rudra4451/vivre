"use client";

import * as React from "react";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { ErrorState } from "@/components/ui/ErrorState";

export function QuestErrorBanner() {
  const activeError = useQuestBoardStore((s) => s.activeError);
  const setActiveError = useQuestBoardStore((s) => s.setActiveError);

  if (!activeError) return null;

  return (
    <ErrorState
      title="Atlas Sync Notice"
      message={activeError}
      onRetry={() => setActiveError(null)}
    />
  );
}
