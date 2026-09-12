import { useReducedMotion } from "framer-motion";
import { useUIStore } from "./store";

export interface MotionPreferences {
  shouldReduceMotion: boolean;
  isCalmMode: boolean;
  soundEnabled: boolean;
}

/**
 * Hook to retrieve user and system motion preferences.
 * If prefers-reduced-motion or calmMode is active, shouldReduceMotion will be true.
 */
export function useMotionPreferences(): MotionPreferences {
  const prefersReduced = useReducedMotion();
  const calmMode = useUIStore((s) => s.calmMode);
  const soundEnabled = useUIStore((s) => s.soundEnabled);

  return {
    shouldReduceMotion: Boolean(prefersReduced || calmMode),
    isCalmMode: calmMode,
    soundEnabled,
  };
}

/**
 * Restrained spring configurations adhering to Constellation Atlas principles.
 * High damping prevents bouncy/playful oscillations; motions feel engraved and precise.
 */
export const MOTION_SPRINGS = {
  // Snappy, authoritative feedback for completed direct star nodes
  starArrival: {
    type: "spring" as const,
    stiffness: 350,
    damping: 26,
    mass: 0.8,
  },
  // Constellation link drawing
  lineDraw: {
    duration: 0.45,
    ease: [0.16, 1, 0.3, 1] as const, // Custom crisp ease-out
  },
  // Level up coordinate dial rotation
  dialAlignment: {
    type: "spring" as const,
    stiffness: 120,
    damping: 18,
  },
  // Instant fallback for reduced motion / calm mode
  instant: {
    duration: 0.01,
  },
};

/**
 * Deterministic particle generators with low count limits (6-12 particles max).
 * Pre-calculated radial geometry prevents runtime layout thrashing.
 */
export interface CelestialParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  isReward: boolean;
}

export function generateCelestialParticles(
  count: number = 8,
  isCritical: boolean = false
): CelestialParticle[] {
  // Cap strictly at 12 particles maximum to avoid GPU/CPU overhead
  const safeCount = Math.min(isCritical ? 12 : 8, count);
  const particles: CelestialParticle[] = [];

  for (let i = 0; i < safeCount; i++) {
    const angle = (i / safeCount) * 2 * Math.PI + (i % 2 ? 0.2 : -0.2);
    const distance = 24 + (i % 3) * 12 + (isCritical ? 10 : 0);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = isCritical ? (i % 2 === 0 ? 3 : 2) : 2;
    const delay = (i % 4) * 0.03;
    const duration = 0.45 + (i % 3) * 0.08;

    particles.push({
      id: i,
      x,
      y,
      size,
      delay,
      duration,
      isReward: isCritical || i % 2 === 0,
    });
  }

  return particles;
}
