"use client";

import * as React from "react";
import type { QuestDefinition } from "@/types";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface QuestCardProps {
  quest: QuestDefinition;
  onSelect?: (questId: string) => void;
}

export function QuestCard({ quest, onSelect }: QuestCardProps) {
  return (
    <Card className="flex flex-col justify-between border-slate-800/80 bg-slate-900/40 hover:border-sky-500/30 transition-all">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
            Sector Quest
          </span>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            +{quest.rewardXp} XP
          </span>
        </div>
        <CardTitle className="text-base text-slate-100">{quest.title}</CardTitle>
        <CardDescription className="mt-1 text-xs text-slate-400">
          {quest.description}
        </CardDescription>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Status: {quest.isCompleted ? "Completed" : "Available"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect?.(quest.id)}
          disabled={quest.isCompleted}
          className="text-xs"
        >
          {quest.isCompleted ? "Resolved" : "Examine"}
        </Button>
      </div>
    </Card>
  );
}
