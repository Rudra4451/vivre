"use client";

import * as React from "react";
import type { StarAtlasTelemetry } from "./types";

export interface PerformanceDebugHUDProps {
  telemetry: StarAtlasTelemetry | null;
}

export function PerformanceDebugHUD({ telemetry }: PerformanceDebugHUDProps) {
  // Available strictly in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!telemetry) return null;

  const isUnder50k = telemetry.triangles < 50000;
  const isLowDrawCalls = telemetry.drawCalls <= 30;

  return (
    <div
      className="pointer-events-auto absolute bottom-2 left-2 z-20 rounded-md border border-[var(--atlas-line)] bg-slate-950/90 p-2 font-mono text-[10px] text-slate-300 shadow-lg backdrop-blur-xs select-none max-w-[240px]"
      role="status"
      aria-label="WebGL Performance Telemetry"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5 font-bold text-slate-100">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          STAR ATLAS TELEMETRY
        </span>
        <span className="text-[9px] uppercase px-1 rounded bg-slate-800 text-slate-400">
          DEV ONLY
        </span>
      </div>

      <div className="space-y-1 leading-tight">
        <div className="flex justify-between">
          <span className="text-slate-400">Frameloop:</span>
          <span className="text-sky-400 font-semibold">{telemetry.frameloop}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Invalidations:</span>
          <span className="text-amber-400">{telemetry.invalidations}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Triangles:</span>
          <span className={isUnder50k ? "text-emerald-400" : "text-rose-400"}>
            {telemetry.triangles.toLocaleString()} / 50k
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Draw Calls:</span>
          <span className={isLowDrawCalls ? "text-emerald-400" : "text-amber-400"}>
            {telemetry.drawCalls}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Adaptive DPR:</span>
          <span className="text-slate-200">
            {telemetry.dpr.toFixed(2)} ({telemetry.isMobile ? "mobile" : "desktop"})
          </span>
        </div>

        <div className="flex justify-between border-t border-slate-800/80 pt-1 mt-1 text-[9px] text-slate-400">
          <span>Geoms: {telemetry.geometries}</span>
          <span>Textures: {telemetry.textures}</span>
        </div>
      </div>
    </div>
  );
}
