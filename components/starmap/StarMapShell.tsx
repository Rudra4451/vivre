"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useMotionPreferences } from "@/lib/game/motion-config";
import type { QuestCategory } from "@/lib/game/category-guesser";
import type { StarMapProps, StarAtlasTelemetry } from "./types";
import {
  checkWebGLSupport,
  normalizeAttributes,
  buildConstellationsData,
  generateAccessibilityDescription,
} from "./starmap-math";
import { WebGLFallback } from "./WebGLFallback";
import { PerformanceDebugHUD } from "./PerformanceDebugHUD";

// Lazy loaded and code-split WebGL Canvas
const LazyStarMapCanvas = dynamic(
  () => import("./StarMapCanvas").then((mod) => mod.StarMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[var(--atlas-bg)] font-mono text-xs text-[var(--atlas-muted)]">
        Aligning Celestial Coordinates...
      </div>
    ),
  }
);

export function StarMapShell({
  attributes: rawAttributes,
  level = 1,
  className = "",
  onSelectConstellation,
}: StarMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<QuestCategory | null>(null);
  const [telemetry, setTelemetry] = React.useState<StarAtlasTelemetry | null>(null);
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [isTabVisible, setIsTabVisible] = React.useState(true);

  const { shouldReduceMotion, isCalmMode } = useMotionPreferences();

  // Normalize server data purely
  const normalized = React.useMemo(
    () => normalizeAttributes(rawAttributes),
    [rawAttributes]
  );

  const constellations = React.useMemo(
    () => buildConstellationsData(normalized),
    [normalized]
  );

  const accessibilityText = React.useMemo(
    () => generateAccessibilityDescription(level, normalized),
    [level, normalized]
  );

  // Check WebGL support once on mount
  const hasWebGL = React.useSyncExternalStore(
    () => () => {},
    () => checkWebGLSupport(),
    () => false
  );

  // 1. IntersectionObserver: Pause/unmount scene when offscreen
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(Boolean(entry?.isIntersecting));
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Visibility Listener: Pause scene when tab is hidden
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState !== "hidden");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleSelect = (category: QuestCategory) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
    onSelectConstellation?.(category);
  };

  // Determine fallback rendering conditions
  const showFallback = !hasWebGL || shouldReduceMotion || isCalmMode;
  const fallbackReason = !hasWebGL
    ? "unsupported"
    : shouldReduceMotion
    ? "reduced-motion"
    : "calm-mode";

  // Pause WebGL rendering if offscreen or tab hidden
  const shouldRender3D = hasWebGL && !showFallback && isIntersecting && isTabVisible;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden select-none ${className}`}
      aria-label="Star Atlas Navigation Deck"
    >
      {/* 3D Scene Accessible Text Alternative for Assistive Tech */}
      <div className="sr-only" aria-live="polite" id="atlas-3d-text-alternative">
        {accessibilityText}
      </div>

      {showFallback ? (
        <WebGLFallback
          attributes={normalized}
          level={level}
          reason={fallbackReason}
        />
      ) : shouldRender3D ? (
        <>
          <LazyStarMapCanvas
            constellations={constellations}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelect}
            onTelemetryChange={setTelemetry}
          />
          {process.env.NODE_ENV === "development" && (
            <PerformanceDebugHUD telemetry={telemetry} />
          )}
        </>
      ) : (
        // Lightweight paused placeholder when offscreen or tab hidden
        <div className="flex h-full w-full items-center justify-center bg-[var(--atlas-bg)] font-mono text-xs text-[var(--atlas-muted)]">
          {!isTabVisible ? "Astrolabe Suspended (Tab Hidden)" : "Astrolabe Idle"}
        </div>
      )}
    </div>
  );
}
