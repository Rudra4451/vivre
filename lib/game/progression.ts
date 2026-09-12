/**
 * Vivre Progression Engine Core Math & Rule Specification
 *
 * This module defines the authoritative progression rules and pure calculation utilities.
 * The authoritative production state transitions execute atomically inside PostgreSQL
 * via complete_task_v1. This module mirrors those exact algorithms in TypeScript for
 * client estimations, state reconciliation, and automated unit testing.
 */

export const CATEGORY_BASE_XP: Record<string, number> = Object.freeze({
  Body: 10,
  Mind: 10,
  Discipline: 12,
  Craft: 12,
  Spirit: 10,
});

export const DAILY_XP_CAP_PER_CATEGORY = 3;

export const REWARD_ROLL_TIERS = [
  { roll: "base", threshold: 70, multiplier: 1.0 },
  { roll: "x1.5", threshold: 95, multiplier: 1.5 },
  { roll: "x3", threshold: 100, multiplier: 3.0 },
] as const;

/**
 * Calculates the exact XP required to advance from `level` to `level + 1`.
 *
 * Specification:
 * - Levels 1–10:  50 + (level * 25)
 * - Levels 11–50: round(50 * level^1.5)
 * - Levels 51+:   round(50 * level^1.5 * 0.6)
 *
 * All results are strictly integers.
 */
export function calculateXpToNext(level: number): number {
  if (level < 1) {
    throw new Error("Level must be an integer >= 1");
  }

  if (level <= 10) {
    return 50 + level * 25;
  }

  if (level <= 50) {
    return Math.round(50 * Math.pow(level, 1.5));
  }

  return Math.round(50 * Math.pow(level, 1.5) * 0.6);
}

/**
 * Normalizes task category name and returns the server-authoritative base XP.
 * Rejects invalid or client-manipulated category values.
 */
export function getCategoryBaseXp(rawCategory: string): { category: string; baseXp: number } {
  const normalized = rawCategory.trim().toLowerCase();
  const titleCategory =
    normalized.charAt(0).toUpperCase() + normalized.slice(1);

  const baseXp = CATEGORY_BASE_XP[titleCategory];
  if (baseXp === undefined) {
    throw new Error(`Invalid task category: ${rawCategory}`);
  }

  return { category: titleCategory, baseXp };
}

/**
 * Atomically computes level-up transitions and XP overflow across multiple level boundaries.
 */
export function applyXpGain(
  startLevel: number,
  startXp: number,
  gainedXp: number
): {
  newLevel: number;
  newXp: number;
  levelsGained: number;
  xpToNext: number;
  leveledUp: boolean;
} {
  let currentLevel = startLevel;
  let currentXp = startXp + gainedXp;
  let levelsGained = 0;

  while (true) {
    const xpToNext = calculateXpToNext(currentLevel);
    if (currentXp < xpToNext) {
      return {
        newLevel: currentLevel,
        newXp: currentXp,
        levelsGained,
        xpToNext,
        leveledUp: levelsGained > 0,
      };
    }
    currentXp -= xpToNext;
    currentLevel += 1;
    levelsGained += 1;
  }
}

/**
 * Converts a date to an integer calendar day string "YYYY-MM-DD" in the user's specific timezone.
 * Never relies on UTC alone.
 */
export function getLocalDateString(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    // Fallback to default Asia/Kolkata if invalid timezone string
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  }
}

/**
 * Calculates calendar day difference between two timestamps in a given timezone.
 */
export function getCalendarDayDiff(
  fromDate: Date,
  toDate: Date,
  timeZone: string
): number {
  const fromStr = getLocalDateString(fromDate, timeZone);
  const toStr = getLocalDateString(toDate, timeZone);

  const fromParts = fromStr.split("-").map(Number);
  const toParts = toStr.split("-").map(Number);

  const fromUtc = Date.UTC(fromParts[0]!, fromParts[1]! - 1, fromParts[2]!);
  const toUtc = Date.UTC(toParts[0]!, toParts[1]! - 1, toParts[2]!);

  const msPerDay = 86_400_000;
  return Math.round((toUtc - fromUtc) / msPerDay);
}

export interface StreakCalculationInput {
  currentStreak: number;
  longestStreak: number;
  lastCompletionAt: Date | string | null;
  now: Date;
  timeZone: string;
  shieldAvailable: boolean;
  shieldRefillAt: Date | string | null;
  shieldRefillDurationDays?: number;
}

export interface StreakCalculationOutput {
  newStreak: number;
  newLongestStreak: number;
  shieldAvailable: boolean;
  shieldRefillAt: Date | null;
  shieldConsumed: boolean;
}

/**
 * Authoritative Streak and Streak Shield calculation.
 *
 * Rules:
 * 1. Timezone-aware calendar days determine streaks.
 * 2. Same calendar day (diff = 0): streak maintained (or 1 if was 0).
 * 3. Consecutive day (diff = 1): streak + 1.
 * 4. Missed exactly one day (diff = 2):
 *    - If shield available: consume shield, forgive missed day, streak + 1, set refill timestamp.
 *    - If shield unavailable: streak reset to 1.
 * 5. Missed > 1 day (diff > 2): streak reset to 1.
 * 6. Deterministic shield refill: if shield is unavailable and now >= shieldRefillAt, shield refills.
 */
export function calculateStreakUpdate(
  input: StreakCalculationInput
): StreakCalculationOutput {
  const {
    currentStreak,
    longestStreak,
    lastCompletionAt,
    now,
    timeZone,
    shieldRefillDurationDays = 7,
  } = input;

  let shieldAvailable = input.shieldAvailable;
  let shieldRefillAt = input.shieldRefillAt ? new Date(input.shieldRefillAt) : null;
  let shieldConsumed = false;

  // Check deterministic refill condition
  if (!shieldAvailable && shieldRefillAt && now >= shieldRefillAt) {
    shieldAvailable = true;
    shieldRefillAt = null;
  }

  let newStreak = currentStreak;

  if (!lastCompletionAt) {
    newStreak = 1;
  } else {
    const lastDate = new Date(lastCompletionAt);
    const dayDiff = getCalendarDayDiff(lastDate, now, timeZone);

    if (dayDiff === 0) {
      newStreak = currentStreak === 0 ? 1 : currentStreak;
    } else if (dayDiff === 1) {
      newStreak = currentStreak + 1;
    } else if (dayDiff === 2) {
      // Missed 1 day
      if (shieldAvailable) {
        shieldAvailable = false;
        shieldRefillAt = new Date(
          now.getTime() + shieldRefillDurationDays * 24 * 60 * 60 * 1000
        );
        shieldConsumed = true;
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1;
      }
    } else if (dayDiff > 2) {
      newStreak = 1;
    }
  }

  const newLongestStreak = Math.max(longestStreak, newStreak);

  return {
    newStreak,
    newLongestStreak,
    shieldAvailable,
    shieldRefillAt,
    shieldConsumed,
  };
}
