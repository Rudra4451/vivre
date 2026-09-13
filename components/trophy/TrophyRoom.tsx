"use client";

import React, { useState, useEffect } from "react";
import type { TrophyWithProgress, TrophyTier } from "@/types";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getTrophySummary } from "@/lib/game/trophies";
import { AudioManager } from "@/lib/game/audio-manager";

interface TrophyRoomProps {
  initialTrophies: TrophyWithProgress[];
  className?: string;
}

export function TrophyRoom({ initialTrophies, className = "" }: TrophyRoomProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [tierFilter, setTierFilter] = useState<"all" | TrophyTier>("all");
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyWithProgress | null>(null);

  const summary = getTrophySummary(initialTrophies);

  const filteredTrophies = initialTrophies.filter((t) => {
    if (filter === "unlocked" && !t.isUnlocked) return false;
    if (filter === "locked" && t.isUnlocked) return false;
    if (tierFilter !== "all" && t.tier !== tierFilter) return false;
    return true;
  });

  // Handle ESC to close modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedTrophy) {
        setSelectedTrophy(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTrophy]);

  function handleInspect(trophy: TrophyWithProgress) {
    setSelectedTrophy(trophy);
    try {
      AudioManager.play("bonus");
    } catch {
      // Audio fallback safe
    }
    // Subtle haptic pulse on mobile if supported
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // Safe fallback
      }
    }
  }

  return (
    <Card className={`p-6 bg-atlas-surface border-atlas-line ${className}`}>
      {/* Header & Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-atlas-line pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-atlas-reward text-base">✦</span>
            <CardTitle as="h2" className="text-lg font-display tracking-wide text-atlas-ink">
              Celestial Reliquary
            </CardTitle>
            <Badge variant="outline" size="sm" className="font-mono text-[10px] uppercase">
              Trophy Room
            </Badge>
          </div>
          <CardDescription className="text-xs text-atlas-muted mt-1">
            Authoritative milestones, expedition honors, and constellation masteries.
          </CardDescription>
        </div>

        {/* Aggregate Milestone Meter */}
        <div className="flex items-center gap-4 bg-atlas-bg px-4 py-2.5 rounded-lg border border-atlas-line">
          <div className="text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-atlas-muted">
              Charted Milestones
            </div>
            <div className="text-sm font-bold font-mono text-atlas-ink flex items-center gap-1">
              <span>{summary.unlockedCount}</span>
              <span className="text-atlas-muted">/</span>
              <span>{summary.totalCount}</span>
              <span className="text-xs text-atlas-reward font-normal ml-1">
                ({summary.percentUnlocked}%)
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-atlas-line" />
          <div className="text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-atlas-muted">
              Celestial Sigils
            </div>
            <div className="text-sm font-bold font-mono text-atlas-reward flex items-center gap-1">
              <span>{summary.celestialUnlocked}</span>
              <span className="text-atlas-muted">/</span>
              <span>{summary.celestialCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-atlas-bg p-1 rounded-md border border-atlas-line" role="group" aria-label="Filter trophies by completion status">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              filter === "all"
                ? "bg-atlas-surface text-atlas-ink shadow-sm border border-atlas-line"
                : "text-atlas-muted hover:text-atlas-ink"
            }`}
          >
            All ({initialTrophies.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unlocked")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              filter === "unlocked"
                ? "bg-atlas-surface text-atlas-ink shadow-sm border border-atlas-line"
                : "text-atlas-muted hover:text-atlas-ink"
            }`}
          >
            Unlocked ({summary.unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("locked")}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              filter === "locked"
                ? "bg-atlas-surface text-atlas-ink shadow-sm border border-atlas-line"
                : "text-atlas-muted hover:text-atlas-ink"
            }`}
          >
            In Progress ({summary.totalCount - summary.unlockedCount})
          </button>
        </div>

        {/* Tier Filter */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-atlas-muted font-mono text-[11px] mr-1">Tier:</span>
          {(["all", "celestial", "solar", "lunar", "astral"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(t)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-colors ${
                tierFilter === t
                  ? "bg-atlas-reward/15 text-atlas-reward border border-atlas-reward/30 font-semibold"
                  : "text-atlas-muted hover:text-atlas-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Trophy Cards Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" role="list" aria-label="Celestial Trophies">
        {filteredTrophies.map((trophy) => {
          const tierBorder =
            trophy.tier === "celestial"
              ? "border-purple-500/40 hover:border-purple-500/70"
              : trophy.tier === "solar"
              ? "border-amber-500/40 hover:border-amber-500/70"
              : trophy.tier === "lunar"
              ? "border-cyan-500/40 hover:border-cyan-500/70"
              : "border-atlas-line hover:border-atlas-muted";

          const tierGlow =
            trophy.isUnlocked
              ? trophy.tier === "celestial"
                ? "bg-purple-950/20"
                : trophy.tier === "solar"
                ? "bg-amber-950/20"
                : trophy.tier === "lunar"
                ? "bg-cyan-950/20"
                : "bg-atlas-surface"
              : "bg-atlas-bg/60 opacity-75 hover:opacity-100";

          return (
            <button
              key={trophy.id}
              type="button"
              onClick={() => handleInspect(trophy)}
              className={`group relative text-left p-4 rounded-lg border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-atlas-reward ${tierBorder} ${tierGlow}`}
              role="listitem"
              aria-label={`${trophy.title}: ${trophy.isUnlocked ? "Unlocked" : `${trophy.progressPercent}% in progress`}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-9 w-9 rounded-md flex items-center justify-center border ${
                      trophy.isUnlocked
                        ? "bg-atlas-bg border-atlas-reward/50 text-atlas-reward"
                        : "bg-atlas-bg/40 border-atlas-line text-atlas-muted"
                    }`}
                  >
                    <TrophySigilIcon icon={trophy.icon} isUnlocked={trophy.isUnlocked} />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-atlas-ink group-hover:text-atlas-reward transition-colors">
                      {trophy.title}
                    </h3>
                    <p className="text-[10px] font-mono text-atlas-muted uppercase tracking-wider">
                      {trophy.tier} • {trophy.category}
                    </p>
                  </div>
                </div>

                {trophy.isUnlocked ? (
                  <span className="text-[10px] font-mono text-atlas-success bg-atlas-success/10 border border-atlas-success/30 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                    <span>✦</span> Done
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-atlas-muted bg-atlas-bg border border-atlas-line px-1.5 py-0.5 rounded">
                    {trophy.progressPercent}%
                  </span>
                )}
              </div>

              <p className="text-xs text-atlas-muted line-clamp-2 mt-1">
                {trophy.description}
              </p>

              {/* In-progress progress bar */}
              {!trophy.isUnlocked && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-mono text-atlas-muted mb-1">
                    <span>Progress</span>
                    <span>
                      {trophy.currentValue} / {trophy.targetValue}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-atlas-line/40 overflow-hidden">
                    <div
                      className="h-full bg-atlas-reward rounded-full transition-all duration-300"
                      style={{ width: `${trophy.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {filteredTrophies.length === 0 && (
        <div className="mt-8 text-center py-8 text-atlas-muted text-xs border border-dashed border-atlas-line rounded-lg">
          No celestial trophies match the active filter criteria.
        </div>
      )}

      {/* Modal Dialog for Trophy Inspection */}
      {selectedTrophy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trophy-modal-title"
        >
          <div className="relative w-full max-w-md rounded-xl border border-atlas-reward/40 bg-atlas-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-atlas-bg border border-atlas-reward text-atlas-reward text-xl">
                  <TrophySigilIcon icon={selectedTrophy.icon} isUnlocked={selectedTrophy.isUnlocked} size="lg" />
                </div>
                <div>
                  <h3 id="trophy-modal-title" className="font-display text-lg font-bold text-atlas-ink">
                    {selectedTrophy.title}
                  </h3>
                  <p className="text-xs font-mono text-atlas-reward uppercase tracking-wider">
                    {selectedTrophy.tier} Rank • {selectedTrophy.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrophy(null)}
                className="text-atlas-muted hover:text-atlas-ink p-1 rounded transition-colors text-sm"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="border-t border-b border-atlas-line py-3 space-y-2 text-xs">
              <div>
                <span className="text-atlas-muted font-mono uppercase text-[10px]">Objective:</span>
                <p className="text-atlas-ink mt-0.5">{selectedTrophy.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded bg-atlas-bg border border-atlas-line">
                  <div className="text-[10px] font-mono text-atlas-muted uppercase">Status</div>
                  <div className="text-xs font-bold mt-0.5 text-atlas-ink">
                    {selectedTrophy.isUnlocked ? "✦ Attained" : "In Progress"}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-atlas-bg border border-atlas-line">
                  <div className="text-[10px] font-mono text-atlas-muted uppercase">Progress</div>
                  <div className="text-xs font-bold mt-0.5 font-mono text-atlas-reward">
                    {selectedTrophy.currentValue} / {selectedTrophy.targetValue} ({selectedTrophy.progressPercent}%)
                  </div>
                </div>
              </div>

              {selectedTrophy.unlockedAt && (
                <div className="text-[11px] font-mono text-atlas-muted pt-1">
                  Recorded in Atlas: {new Date(selectedTrophy.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTrophy(null)}
              >
                Close Reliquary
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function TrophySigilIcon({
  icon,
  isUnlocked = false,
  size = "md",
}: {
  icon: string;
  isUnlocked?: boolean;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  const strokeClass = isUnlocked ? "stroke-atlas-reward" : "stroke-current";

  switch (icon) {
    case "sparkles":
      return (
        <svg className={`${dim} ${strokeClass}`} viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        </svg>
      );
    case "flame":
      return (
        <svg className={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    case "sun":
      return (
        <svg className={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );
    case "compass":
      return (
        <svg className={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "globe":
      return (
        <svg className={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "shield-star":
      return (
        <svg className={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polygon points="12 8 13.5 11 16.5 11.5 14.25 13.75 14.8 17 12 15.3 9.2 17 9.75 13.75 7.5 11.5 10.5 11 12 8" />
        </svg>
      );
    case "crown":
      return (
        <svg className={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
      );
    case "pentagon":
      return (
        <svg className={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 22 9.5 18 21 6 21 2 9.5" />
        </svg>
      );
    case "gem":
      return (
        <svg className={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 3h12l4 6-10 12L2 9z" />
          <path d="M11 3 8 9l4 12 4-12-3-6" />
          <path d="M2 9h20" />
        </svg>
      );
    case "trophy":
    default:
      return (
        <svg className={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
          <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
        </svg>
      );
  }
}
