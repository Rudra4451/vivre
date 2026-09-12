"use client";

import * as React from "react";
import { useTheme, type ThemeChoice } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const options: { id: ThemeChoice; label: string; icon: string }[] = [
    { id: "night", label: "Night Sky", icon: "🌙" },
    { id: "atlas", label: "Star Atlas", icon: "📜" },
    { id: "system", label: "System", icon: "⚙️" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Celestial Theme"
      className={`inline-flex items-center rounded-lg border border-atlas-line bg-atlas-surface p-0.5 text-xs ${className}`}
    >
      {options.map((opt) => {
        const isSelected = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(opt.id)}
            title={`${opt.label} (${opt.id === "system" ? `Active: ${resolvedTheme === "night" ? "Night Sky" : "Star Atlas"}` : opt.label})`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
              isSelected
                ? "bg-atlas-surface-elevated text-atlas-ink shadow-sm border border-atlas-line font-semibold"
                : "text-atlas-muted hover:text-atlas-ink"
            }`}
          >
            <span>{opt.icon}</span>
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
