"use client";

import * as React from "react";
import type { QuestCategory } from "@/lib/game/category-guesser";
import { CATEGORY_METAS } from "@/lib/game/category-guesser";

export interface AttributeRadarChartProps {
  attributes: Array<{ name: string; value: number }> | Record<string, number>;
  targetMax?: number;
  className?: string;
  onSelectCategory?: (category: QuestCategory) => void;
}

const CATEGORIES: QuestCategory[] = [
  "Discipline", // Vertex 0: Top (-90°)
  "Mind",       // Vertex 1: Upper Right (-18°)
  "Craft",      // Vertex 2: Lower Right (54°)
  "Spirit",     // Vertex 3: Lower Left (126°)
  "Body",       // Vertex 4: Upper Left (198°)
];

const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

export function AttributeRadarChart({
  attributes: rawAttributes,
  targetMax = 50,
  className = "",
  onSelectCategory,
}: AttributeRadarChartProps) {
  const [hoveredCategory, setHoveredCategory] = React.useState<QuestCategory | null>(null);

  // Normalize raw attributes
  const valueMap = React.useMemo(() => {
    const map: Record<QuestCategory, number> = {
      Discipline: 0,
      Mind: 0,
      Craft: 0,
      Spirit: 0,
      Body: 0,
    };

    if (Array.isArray(rawAttributes)) {
      for (const item of rawAttributes) {
        const match = CATEGORIES.find(
          (c) => c.toLowerCase() === item.name.trim().toLowerCase()
        );
        if (match) map[match] = Number(item.value) || 0;
      }
    } else if (rawAttributes && typeof rawAttributes === "object") {
      for (const [k, v] of Object.entries(rawAttributes)) {
        const match = CATEGORIES.find(
          (c) => c.toLowerCase() === k.trim().toLowerCase()
        );
        if (match) map[match] = Number(v) || 0;
      }
    }

    return map;
  }, [rawAttributes]);

  // Center and scale definitions for 360x360 viewBox
  const center = 180;
  const maxRadius = 110;

  // Compute 5 outer vertex positions (Pentagon)
  const axisVertices = React.useMemo(() => {
    return CATEGORIES.map((cat, i) => {
      const angle = (i * 72 - 90) * (Math.PI / 180);
      const x = center + maxRadius * Math.cos(angle);
      const y = center + maxRadius * Math.sin(angle);
      // Label offset position slightly further out
      const lx = center + (maxRadius + 28) * Math.cos(angle);
      const ly = center + (maxRadius + 24) * Math.sin(angle);
      return { cat, x, y, lx, ly, angle };
    });
  }, [center, maxRadius]);

  // Concentric pentagonal grid guide rings (20%, 40%, 60%, 80%, 100%)
  const gridPolygons = React.useMemo(() => {
    return GRID_LEVELS.map((level) => {
      const r = maxRadius * level;
      const points = CATEGORIES.map((_, i) => {
        const angle = (i * 72 - 90) * (Math.PI / 180);
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      }).join(" ");
      return { level, points };
    });
  }, [center, maxRadius]);

  // User's attribute polygon points
  const userPolygonPoints = React.useMemo(() => {
    return axisVertices
      .map(({ cat, angle }) => {
        const val = valueMap[cat];
        const ratio = Math.min(1.0, Math.max(0.08, val / targetMax));
        const r = maxRadius * ratio;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [axisVertices, valueMap, targetMax, center, maxRadius]);

  // Accessible summary narrative for screen readers
  const accessibleSummary = CATEGORIES.map(
    (cat) => `${cat}: ${valueMap[cat]} points (${Math.round((valueMap[cat] / targetMax) * 100)}%)`
  ).join("; ");

  return (
    <div
      className={`relative flex flex-col items-center select-none ${className}`}
      role="region"
      aria-label="Five Attributes Radar Chart"
    >
      <div className="sr-only" aria-live="polite">
        Attribute Balance Radar Chart: {accessibleSummary}. Target milestone per rank is {targetMax} points.
      </div>

      <svg
        viewBox="0 0 360 360"
        className="h-full w-full max-h-[340px] max-w-[340px] overflow-visible"
        aria-hidden="true"
      >
        <defs>
          {/* Subtle gradient fill for user's attribute constellation */}
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--atlas-reward)" stopOpacity="0.35" />
            <stop offset="85%" stopColor="var(--atlas-reward)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--atlas-reward)" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Concentric Guide Rings */}
        {gridPolygons.map(({ level, points }) => (
          <polygon
            key={`grid-${level}`}
            points={points}
            fill="none"
            stroke="var(--atlas-line)"
            strokeWidth={level === 1.0 ? "1" : "0.75"}
            strokeDasharray={level === 1.0 ? "none" : "2 4"}
            opacity={level === 1.0 ? 0.7 : 0.4}
          />
        ))}

        {/* Axis Spokes from center to each vertex */}
        {axisVertices.map(({ cat, x, y }) => (
          <line
            key={`spoke-${cat}`}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="var(--atlas-line)"
            strokeWidth="0.75"
            strokeDasharray="2 4"
            opacity="0.6"
          />
        ))}

        {/* Center Astrolabe Pivot Star */}
        <circle cx={center} cy={center} r="3.5" fill="var(--atlas-reward)" />
        <circle cx={center} cy={center} r="7" fill="none" stroke="var(--atlas-reward)" strokeWidth="0.75" opacity="0.4" />

        {/* User's Current Attribute Shape */}
        <polygon
          points={userPolygonPoints}
          fill="url(#radarGlow)"
          stroke="var(--atlas-reward)"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />

        {/* Vertex Points and Interactive Badges */}
        {axisVertices.map(({ cat, angle, lx, ly }) => {
          const val = valueMap[cat];
          const ratio = Math.min(1.0, Math.max(0.08, val / targetMax));
          const r = maxRadius * ratio;
          const px = center + r * Math.cos(angle);
          const py = center + r * Math.sin(angle);
          const meta = CATEGORY_METAS[cat];
          const isHovered = hoveredCategory === cat;

          return (
            <g
              key={`vertex-${cat}`}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredCategory(cat)}
              onMouseLeave={() => setHoveredCategory(null)}
              onClick={() => onSelectCategory?.(cat)}
            >
              {/* Point on the user's polygon */}
              <circle
                cx={px}
                cy={py}
                r={isHovered ? 6 : 4}
                fill="var(--atlas-bg)"
                stroke="var(--atlas-reward)"
                strokeWidth={isHovered ? 2.5 : 1.5}
              />

              {/* Outer Category Anchor Icon / Text */}
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                className={`font-mono text-[11px] font-bold tracking-wider transition-colors ${
                  isHovered ? "fill-[var(--atlas-ink)]" : "fill-[var(--atlas-muted)]"
                }`}
              >
                {meta.icon} {cat}
              </text>
              <text
                x={lx}
                y={ly + 12}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-mono text-[9px] fill-[var(--atlas-reward)] font-semibold"
              >
                {val} XP
              </text>
            </g>
          );
        })}
      </svg>

      {/* Selected / Active Attribute Indicator Bar */}
      <div className="mt-2 w-full rounded-lg border border-[var(--atlas-line)] bg-[var(--atlas-surface)] p-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">
            {CATEGORY_METAS[hoveredCategory ?? "Discipline"].icon}
          </span>
          <div>
            <div className="font-display font-bold text-[var(--atlas-ink)]">
              {hoveredCategory ?? "Attribute Synergy"}
            </div>
            <div className="text-[10px] text-[var(--atlas-muted)] font-mono">
              {hoveredCategory
                ? `${valueMap[hoveredCategory]} / ${targetMax} points toward celestial rank`
                : "Hover an aspect to inspect balance"}
            </div>
          </div>
        </div>

        {hoveredCategory && (
          <span className="font-mono text-[11px] font-bold text-[var(--atlas-reward)] bg-[var(--atlas-reward-subtle)] px-2 py-0.5 rounded border border-[var(--atlas-reward)]/30">
            {Math.round((valueMap[hoveredCategory] / targetMax) * 100)}%
          </span>
        )}
      </div>

      {/* Accessible Text Summary Table for Low Vision & Assistive Tech */}
      <div
        className="mt-3 w-full overflow-hidden rounded-lg border border-[var(--atlas-line)] bg-[var(--atlas-surface)] p-3 text-xs"
        aria-label="Attribute text summary"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--atlas-muted)]">
            Attribute Telemetry Summary
          </span>
          <span className="font-mono text-[10px] text-[var(--atlas-muted)]">
            Rank Milestone: {targetMax} pts
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {CATEGORIES.map((cat) => (
            <button
              key={`summary-${cat}`}
              type="button"
              onClick={() => onSelectCategory?.(cat)}
              className="rounded bg-[var(--atlas-surface-elevated)] p-1.5 border border-[var(--atlas-line-subtle)] hover:border-[var(--atlas-muted)] transition-colors text-center focus-visible:ring-1 focus-visible:ring-[var(--atlas-ink)]"
              aria-label={`${cat}: ${valueMap[cat]} points, ${Math.round((valueMap[cat] / targetMax) * 100)} percent`}
            >
              <div className="font-mono text-[10px] text-[var(--atlas-muted)] truncate">{cat}</div>
              <div className="font-mono font-bold text-xs text-[var(--atlas-ink)]">{valueMap[cat]}</div>
              <div className="font-mono text-[9px] text-[var(--atlas-reward)]">
                {Math.round((valueMap[cat] / targetMax) * 100)}%
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
