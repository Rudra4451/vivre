"use client";

import * as React from "react";
import type { NormalizedAttribute } from "./types";
import { CATEGORY_COLORS } from "./starmap-math";
import type { QuestCategory } from "@/lib/game/category-guesser";

export interface WebGLFallbackProps {
  attributes: Record<QuestCategory, NormalizedAttribute>;
  level?: number;
  reason?: "unsupported" | "reduced-motion" | "offscreen" | "calm-mode";
  className?: string;
}

export function WebGLFallback({
  attributes,
  level = 1,
  reason = "unsupported",
  className = "",
}: WebGLFallbackProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<QuestCategory>("Discipline");

  const categories: QuestCategory[] = ["Body", "Mind", "Discipline", "Craft", "Spirit"];
  const currentAttr = attributes[selectedCategory];

  // Polar coordinates for 5 vertices in 300x300 viewBox
  const center = 150;
  const radius = 95;
  const nodes = categories.map((cat, i) => {
    // 5 vertices rotated so Discipline is at top (-90 deg)
    const angle = (i * 72 - 90) * (Math.PI / 180);
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { cat, x, y, attr: attributes[cat] };
  });

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-between p-4 bg-[var(--atlas-bg)] text-[var(--atlas-ink)] overflow-hidden select-none ${className}`}
      role="region"
      aria-label="Static Constellation Star Atlas"
    >
      {/* Top Status Header */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono border-b border-[var(--atlas-line)] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--atlas-reward)]">✦</span>
          <span className="font-bold tracking-wider uppercase">Cartographic Star Atlas</span>
        </div>
        <div className="text-[10px] text-[var(--atlas-muted)] uppercase tracking-wider bg-[var(--atlas-surface)] px-2 py-0.5 rounded border border-[var(--atlas-line)]">
          {reason === "reduced-motion" || reason === "calm-mode"
            ? "Calm Projection"
            : "Static Projection"}
        </div>
      </div>

      {/* Main Astrolabe SVG Projection */}
      <div className="relative my-auto flex h-full max-h-[220px] w-full items-center justify-center">
        <svg
          viewBox="0 0 300 300"
          className="h-full w-full max-h-[220px] max-w-[280px]"
          aria-hidden="true"
        >
          {/* Astrolabe Background Circles & Coordinate Grid */}
          <circle
            cx={center}
            cy={center}
            r="135"
            fill="none"
            stroke="var(--atlas-line)"
            strokeWidth="1"
          />
          <circle
            cx={center}
            cy={center}
            r="130"
            fill="none"
            stroke="var(--atlas-line)"
            strokeWidth="0.5"
            strokeDasharray="2 4"
          />
          <circle
            cx={center}
            cy={center}
            r="80"
            fill="none"
            stroke="var(--atlas-line)"
            strokeWidth="0.75"
            strokeDasharray="4 6"
          />
          <circle
            cx={center}
            cy={center}
            r="30"
            fill="none"
            stroke="var(--atlas-line)"
            strokeWidth="1"
          />

          {/* Coordinate Crosshairs */}
          <line
            x1={center}
            y1="15"
            x2={center}
            y2="285"
            stroke="var(--atlas-line)"
            strokeWidth="0.75"
            strokeDasharray="2 6"
          />
          <line
            x1="15"
            y1={center}
            x2="285"
            y2={center}
            stroke="var(--atlas-line)"
            strokeWidth="0.75"
            strokeDasharray="2 6"
          />

          {/* Nexus Web Links connecting the 5 vertices */}
          {nodes.map((node, i) => {
            const nextNode = nodes[(i + 1) % nodes.length];
            if (!nextNode) return null;
            const isForged = node.attr.isMastered && nextNode.attr.isMastered;
            return (
              <line
                key={`perimeter-${node.cat}`}
                x1={node.x}
                y1={node.y}
                x2={nextNode.x}
                y2={nextNode.y}
                stroke={isForged ? "var(--atlas-reward)" : "var(--atlas-line)"}
                strokeWidth={isForged ? "1.5" : "1"}
                strokeDasharray={isForged ? "none" : "3 3"}
                opacity={isForged ? 0.9 : 0.4}
              />
            );
          })}

          {/* Spoke Lines from Center to Vertices */}
          {nodes.map((node) => {
            const isIgnited = node.attr.starsIgnited > 0;
            return (
              <line
                key={`spoke-${node.cat}`}
                x1={center}
                y1={center}
                x2={node.x}
                y2={node.y}
                stroke={isIgnited ? node.attr.colorHex : "var(--atlas-line)"}
                strokeWidth={isIgnited ? "1.2" : "0.75"}
                opacity={isIgnited ? 0.7 : 0.3}
              />
            );
          })}

          {/* Center Origin Star */}
          <circle
            cx={center}
            cy={center}
            r="4"
            fill="var(--atlas-reward)"
          />
          <circle
            cx={center}
            cy={center}
            r="8"
            fill="none"
            stroke="var(--atlas-reward)"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Attribute Vertices and Stars */}
          {nodes.map((node) => {
            const isSelected = selectedCategory === node.cat;
            const isIgnited = node.attr.starsIgnited > 0;
            const color = node.attr.colorHex;

            return (
              <g
                key={node.cat}
                className="cursor-pointer transition-transform"
                onClick={() => setSelectedCategory(node.cat)}
              >
                {/* Major Luminary Anchor */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? "9" : "7"}
                  fill={isIgnited ? color : "var(--atlas-surface)"}
                  stroke={isSelected ? "var(--atlas-ink)" : color}
                  strokeWidth={isSelected ? "2.5" : "1.5"}
                />

                {/* Satellite Mini Stars (representing 5 stars count) */}
                {[1, 2, 3, 4].map((starIdx) => {
                  const subAngle = ((starIdx * 90 - 45) * Math.PI) / 180;
                  const sx = node.x + 14 * Math.cos(subAngle);
                  const sy = node.y + 14 * Math.sin(subAngle);
                  const starActive = starIdx < node.attr.starsIgnited;

                  return (
                    <circle
                      key={`star-${node.cat}-${starIdx}`}
                      cx={sx}
                      cy={sy}
                      r={starActive ? "2.5" : "1.5"}
                      fill={starActive ? color : "var(--atlas-line)"}
                      opacity={starActive ? 0.9 : 0.3}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Interactive Attribute Details Bar */}
      <div className="w-full rounded-lg border border-[var(--atlas-line)] bg-[var(--atlas-surface)] p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: currentAttr.colorHex }}
            />
            <span className="font-display text-xs font-bold tracking-wide text-[var(--atlas-ink)]">
              {currentAttr.name} Constellation
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-[var(--atlas-reward)]">
            {currentAttr.value} XP ({currentAttr.progressPercent}%)
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--atlas-muted)] font-mono">
          <span>
            Stars Ignited: {currentAttr.starsIgnited} / 5
          </span>
          <span>
            {currentAttr.isMastered ? "★ Constellation Aligned" : "Coordinates Charting"}
          </span>
        </div>
      </div>
    </div>
  );
}
