import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";

export interface AttributeCardProps {
  name: string;
  value: number;
  maxScore?: number;
  category?: "body" | "mind" | "discipline" | "craft" | "spirit" | string;
  description?: string;
  className?: string;
}

const CATEGORY_GLYPHS: Record<string, string> = {
  body: "☉",
  mind: "☿",
  discipline: "♄",
  craft: "♃",
  spirit: "☽",
};

export function AttributeCard({
  name,
  value,
  maxScore = 100,
  category,
  description,
  className,
}: AttributeCardProps) {
  const normCategory = (category || name).toLowerCase();
  const glyph = CATEGORY_GLYPHS[normCategory] || "✦";
  const progress = Math.min(100, Math.round((value / maxScore) * 100));

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-150 hover:border-[var(--atlas-ink)]/30",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded border border-[var(--atlas-line)] bg-[var(--atlas-bg)] font-display text-sm text-[var(--atlas-ink)]">
            {glyph}
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--atlas-ink)]">
              {name}
            </h3>
            {description && (
              <p className="text-[11px] text-[var(--atlas-muted)] leading-tight mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-base font-bold text-[var(--atlas-ink)]">
            {value}
          </span>
          <span className="font-mono text-[10px] text-[var(--atlas-muted)]">
            /{maxScore}
          </span>
        </div>
      </div>

      <div className="mt-3.5">
        <ProgressBar
          value={progress}
          size="sm"
          aria-label={`${name} proficiency ${progress}%`}
        />
        <div className="mt-1 flex justify-between text-[10px] font-mono text-[var(--atlas-muted)]">
          <span className="uppercase tracking-wider">Proficiency</span>
          <span>{progress}%</span>
        </div>
      </div>
    </Card>
  );
}
