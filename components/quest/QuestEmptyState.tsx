import * as React from "react";
import { EmptyState } from "@/components/ui/EmptyState";

export interface QuestEmptyStateProps {
  onQuickAddFocus?: () => void;
}

export function QuestEmptyState({ onQuickAddFocus }: QuestEmptyStateProps) {
  return (
    <EmptyState
      icon="✧"
      title="All Celestial Quadrants Clear"
      description="No active directives currently charted in your celestial log. Chart a new routine or custom objective above to begin recording authoritative telemetry."
      actionLabel={onQuickAddFocus ? "+ Chart First Directive" : undefined}
      onAction={onQuickAddFocus}
    />
  );
}
