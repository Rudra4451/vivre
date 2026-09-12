"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { useMotionPreferences } from "@/lib/game/motion-config";
import { AtlasAudio } from "@/lib/game/audio";
import { AtlasAnnounce } from "@/lib/game/announcements";
import { Button } from "@/components/ui/Button";

export function LevelUpCelebration() {
  const celebration = useQuestBoardStore((s) => s.celebration);
  const clearCelebration = useQuestBoardStore((s) => s.clearCelebration);
  const { shouldReduceMotion } = useMotionPreferences();

  const isLevelUp = Boolean(celebration?.leveledUp);
  const newLevel = celebration?.newLevel ?? 2;
  const xpAwarded = celebration?.xpAwarded ?? 0;
  const category = celebration?.category ?? "Celestial";

  // Trigger audio, announcement, and auto-dismiss timer on level up
  React.useEffect(() => {
    if (!isLevelUp) return;

    // 1. Authoritative accessibility announcement
    AtlasAnnounce.levelUp(newLevel);

    // 2. Procedural harmonic sound (respects soundEnabled & calmMode)
    AtlasAudio.playLevelUp();

    // 3. Max visual duration: approximately 2.8 seconds auto-dismiss
    const autoDismissTimer = setTimeout(() => {
      clearCelebration();
    }, 2800);

    // 4. Keyboard dismissal listener (Esc, Space, Enter)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        clearCelebration();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(autoDismissTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLevelUp, newLevel, clearCelebration]);

  if (!isLevelUp) return null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ascension to Level ${newLevel}`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
        onClick={clearCelebration} // Click anywhere to skip
      >
        {/* Full-screen Dark Canvas Backdrop with Subtle Starlight */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.05 : 0.25 }}
        />

        {/* Content Container (stopPropagation allows button clicks or clicking container to skip) */}
        <motion.div
          className="relative z-10 flex flex-col items-center text-center max-w-lg w-full px-6 py-10 rounded-2xl border border-atlas-line bg-atlas-surface shadow-2xl"
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { scale: 0.88, opacity: 0, y: 15 }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : { scale: 1, opacity: 1, y: 0 }
          }
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { scale: 0.94, opacity: 0 }
          }
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Astrolabe Rotating Rings (Skipped if Reduced Motion) */}
          {!shouldReduceMotion && (
            <div className="relative mb-6 flex h-36 w-36 items-center justify-center">
              {/* Outer Dial */}
              <motion.svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 144 144"
                initial={{ rotate: -90 }}
                animate={{ rotate: 90 }}
                transition={{ duration: 2.6, ease: "easeOut" }}
              >
                <circle
                  cx="72"
                  cy="72"
                  r="66"
                  fill="none"
                  stroke="var(--atlas-line)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  fill="none"
                  stroke="var(--atlas-reward)"
                  strokeWidth="1.5"
                  strokeDasharray="1 8"
                  opacity="0.7"
                />
              </motion.svg>

              {/* Center Ascendant Star Badge */}
              <motion.div
                className="relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-atlas-reward bg-atlas-bg shadow-[0_0_30px_var(--atlas-reward-subtle)]"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: [0, 1.15, 1], rotate: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.1 }}
              >
                <span className="text-xl text-atlas-reward">★</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-atlas-reward">
                  ASCENT
                </span>
              </motion.div>
            </div>
          )}

          {/* Level Up Announcement Text */}
          <div className="space-y-2">
            <span className="inline-block font-mono text-xs uppercase tracking-widest text-atlas-muted border border-atlas-line px-2.5 py-0.5 rounded-full bg-atlas-bg">
              Constellation Synchronized · {category}
            </span>

            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-atlas-ink">
              Ascension to Level {newLevel}
            </h2>

            <p className="font-mono text-sm font-semibold text-atlas-reward">
              +{xpAwarded} XP Earned · New Milestone Coordinates Unlocked
            </p>
          </div>

          <p className="mt-4 text-xs text-atlas-muted max-w-xs leading-relaxed">
            Your discipline has expanded your territory across the star atlas. Higher tier coordinates are now charted.
          </p>

          {/* Action & Skip Controls */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
            <Button
              variant="reward"
              size="md"
              onClick={clearCelebration}
              className="w-full font-semibold"
              autoFocus
            >
              Resume Journey
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCelebration}
              className="text-xs text-atlas-muted hover:text-atlas-ink"
            >
              Skip (Esc)
            </Button>
          </div>

          <span className="mt-3 text-[10px] font-mono text-atlas-muted/70">
            Auto-advancing in ~2s · Press Esc to dismiss
          </span>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
