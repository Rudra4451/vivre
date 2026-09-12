"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPreferences, generateCelestialParticles } from "@/lib/game/motion-config";

export interface QuestCompletionEffectProps {
  isActive: boolean;
  isCritical?: boolean;
  onAnimationEnd?: () => void;
  className?: string;
}

export function QuestCompletionEffect({
  isActive,
  isCritical = false,
  onAnimationEnd,
  className = "",
}: QuestCompletionEffectProps) {
  const { shouldReduceMotion } = useMotionPreferences();
  const particles = React.useMemo(
    () => (isActive ? generateCelestialParticles(isCritical ? 12 : 8, isCritical) : []),
    [isActive, isCritical]
  );

  React.useEffect(() => {
    if (!isActive) return;

    // Fixed lifetime: 900ms for full animation, then clean up
    const timer = setTimeout(() => {
      onAnimationEnd?.();
    }, shouldReduceMotion ? 300 : 900);

    return () => clearTimeout(timer);
  }, [isActive, onAnimationEnd, shouldReduceMotion]);

  if (!isActive) return null;

  // Reduced motion / calm mode fallback: minimal static indicator without bursts
  if (shouldReduceMotion) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
        aria-hidden="true"
      >
        <span className="font-mono text-xs font-bold text-atlas-reward bg-atlas-reward-subtle border border-atlas-reward/40 px-2 py-0.5 rounded shadow-xs">
          {isCritical ? "★ CRITICAL" : "✓ VERIFIED"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-visible flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      {/* 1. Constellation Connection Line */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <motion.line
          x1="10"
          y1="50"
          x2="50"
          y2="50"
          stroke="var(--atlas-reward)"
          strokeWidth={isCritical ? "2" : "1.5"}
          strokeDasharray={isCritical ? "3 1" : "none"}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.9, 0.4] }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        <motion.line
          x1="50"
          y1="50"
          x2="90"
          y2="50"
          stroke="var(--atlas-reward)"
          strokeWidth={isCritical ? "2" : "1.5"}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.9, 0.4] }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        />
      </svg>

      {/* 2. Celestial Star Centerpiece with Subtle Spring */}
      <motion.div
        className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-atlas-reward bg-atlas-surface shadow-[0_0_20px_var(--atlas-reward-subtle)]"
        initial={{ scale: 0, opacity: 0, rotate: -45 }}
        animate={{ scale: [0, 1.15, 1], opacity: 1, rotate: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 24,
        }}
      >
        <span className="text-atlas-reward text-sm select-none">
          {isCritical ? "✦" : "★"}
        </span>

        {isCritical && (
          <motion.div
            className="absolute inset-0 rounded-full border border-atlas-reward"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </motion.div>

      {/* 3. Restrained Particle Burst (6-12 particles max, 0 continuous loop) */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.isReward ? "var(--atlas-reward)" : "var(--atlas-ink)",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [1, 0.8, 0],
              scale: [1, 1.2, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
