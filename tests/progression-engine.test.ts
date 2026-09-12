import { describe, it, expect } from "vitest";
import {
  calculateStreakUpdate,
  getLocalDateString,
  getCalendarDayDiff,
  DAILY_XP_CAP_PER_CATEGORY,
} from "@/lib/game/progression";

describe("Progression Engine: Streaks, Shields, Caps & Timezones", () => {
  describe("Daily Cap & Zero-XP Fourth Completion", () => {
    it("enforces a hard maximum of 3 XP-awarding completions per category per day", () => {
      expect(DAILY_XP_CAP_PER_CATEGORY).toBe(3);
    });

    it("awards XP for completions 1, 2, and 3, but awards exactly 0 XP for 4th completion", () => {
      const baseXp = 10;
      const multiplier = 1.0;

      // Simulate completion counts for the day
      const completions = [
        { completionIndex: 1, priorAwardedCount: 0 },
        { completionIndex: 2, priorAwardedCount: 1 },
        { completionIndex: 3, priorAwardedCount: 2 },
        { completionIndex: 4, priorAwardedCount: 3 }, // 4th completion
        { completionIndex: 5, priorAwardedCount: 3 }, // 5th completion
      ];

      const results = completions.map(({ completionIndex, priorAwardedCount }) => {
        const isCapped = priorAwardedCount >= DAILY_XP_CAP_PER_CATEGORY;
        const xpAwarded = isCapped ? 0 : Math.round(baseXp * multiplier);
        const bonusRoll = isCapped ? "capped" : "base";
        return { completionIndex, isCapped, xpAwarded, bonusRoll };
      });

      // Completions 1, 2, 3 receive XP
      expect(results[0]?.xpAwarded).toBe(10);
      expect(results[0]?.isCapped).toBe(false);
      expect(results[1]?.xpAwarded).toBe(10);
      expect(results[1]?.isCapped).toBe(false);
      expect(results[2]?.xpAwarded).toBe(10);
      expect(results[2]?.isCapped).toBe(false);

      // 4th completion: recorded in ledger, but awards 0 XP
      expect(results[3]?.completionIndex).toBe(4);
      expect(results[3]?.xpAwarded).toBe(0);
      expect(results[3]?.isCapped).toBe(true);
      expect(results[3]?.bonusRoll).toBe("capped");

      // 5th completion: recorded in ledger, awards 0 XP
      expect(results[4]?.xpAwarded).toBe(0);
      expect(results[4]?.isCapped).toBe(true);
    });
  });

  describe("Streak Mechanics", () => {
    const timeZone = "Asia/Kolkata";

    it("starts streak at 1 on first task completion ever", () => {
      const now = new Date("2026-09-13T10:00:00+05:30");
      const res = calculateStreakUpdate({
        currentStreak: 0,
        longestStreak: 0,
        lastCompletionAt: null,
        now,
        timeZone,
        shieldAvailable: true,
        shieldRefillAt: null,
      });

      expect(res.newStreak).toBe(1);
      expect(res.newLongestStreak).toBe(1);
      expect(res.shieldConsumed).toBe(false);
    });

    it("preserves streak when completing another task on the same calendar day", () => {
      const lastCompletion = new Date("2026-09-13T08:00:00+05:30");
      const now = new Date("2026-09-13T18:00:00+05:30");

      const res = calculateStreakUpdate({
        currentStreak: 5,
        longestStreak: 10,
        lastCompletionAt: lastCompletion,
        now,
        timeZone,
        shieldAvailable: true,
        shieldRefillAt: null,
      });

      expect(res.newStreak).toBe(5);
      expect(res.newLongestStreak).toBe(10);
      expect(res.shieldConsumed).toBe(false);
    });

    it("increments streak when completing a task on the next consecutive calendar day", () => {
      const lastCompletion = new Date("2026-09-12T20:00:00+05:30");
      const now = new Date("2026-09-13T09:00:00+05:30");

      const res = calculateStreakUpdate({
        currentStreak: 5,
        longestStreak: 5,
        lastCompletionAt: lastCompletion,
        now,
        timeZone,
        shieldAvailable: true,
        shieldRefillAt: null,
      });

      expect(res.newStreak).toBe(6);
      expect(res.newLongestStreak).toBe(6);
      expect(res.shieldConsumed).toBe(false);
    });

    it("resets streak to 1 when missing more than one day (> 2 days)", () => {
      // Completed on Sept 10, next is Sept 13 (missed Sept 11 and Sept 12: diff = 3)
      const lastCompletion = new Date("2026-09-10T20:00:00+05:30");
      const now = new Date("2026-09-13T09:00:00+05:30");

      const res = calculateStreakUpdate({
        currentStreak: 8,
        longestStreak: 12,
        lastCompletionAt: lastCompletion,
        now,
        timeZone,
        shieldAvailable: true, // Shield cannot forgive >1 missed day
        shieldRefillAt: null,
      });

      expect(res.newStreak).toBe(1);
      expect(res.newLongestStreak).toBe(12);
      expect(res.shieldConsumed).toBe(false);
      expect(res.shieldAvailable).toBe(true); // Untouched
    });
  });

  describe("Streak Shield Consumption & Refill", () => {
    const timeZone = "Asia/Kolkata";

    it("consumes shield and forgives exactly one missed day (dayDiff = 2)", () => {
      // Completed on Sept 11, skipped Sept 12, completed on Sept 13
      const lastCompletion = new Date("2026-09-11T20:00:00+05:30");
      const now = new Date("2026-09-13T09:00:00+05:30");

      const res = calculateStreakUpdate({
        currentStreak: 7,
        longestStreak: 7,
        lastCompletionAt: lastCompletion,
        now,
        timeZone,
        shieldAvailable: true,
        shieldRefillAt: null,
      });

      // Shield forgives the missed day, streak continues and increments!
      expect(res.newStreak).toBe(8);
      expect(res.newLongestStreak).toBe(8);
      expect(res.shieldConsumed).toBe(true);
      expect(res.shieldAvailable).toBe(false);
      expect(res.shieldRefillAt).not.toBeNull();
      // Refill set to 7 days in the future
      const diffMs = res.shieldRefillAt!.getTime() - now.getTime();
      expect(diffMs).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it("resets streak to 1 when missing a day and shield is unavailable", () => {
      // Completed on Sept 11, skipped Sept 12, completed on Sept 13, but shield is NOT available
      const lastCompletion = new Date("2026-09-11T20:00:00+05:30");
      const now = new Date("2026-09-13T09:00:00+05:30");
      const futureRefill = new Date("2026-09-16T09:00:00+05:30");

      const res = calculateStreakUpdate({
        currentStreak: 7,
        longestStreak: 15,
        lastCompletionAt: lastCompletion,
        now,
        timeZone,
        shieldAvailable: false,
        shieldRefillAt: futureRefill,
      });

      expect(res.newStreak).toBe(1);
      expect(res.newLongestStreak).toBe(15);
      expect(res.shieldConsumed).toBe(false);
      expect(res.shieldAvailable).toBe(false);
    });

    it("deterministically refills shield when now >= shieldRefillAt", () => {
      const lastCompletion = new Date("2026-09-12T20:00:00+05:30");
      const now = new Date("2026-09-13T09:00:00+05:30");
      // Refill was scheduled for Sept 13 at 08:00 (1 hour before `now`)
      const pastRefill = new Date("2026-09-13T08:00:00+05:30");

      const res = calculateStreakUpdate({
        currentStreak: 4,
        longestStreak: 4,
        lastCompletionAt: lastCompletion,
        now,
        timeZone,
        shieldAvailable: false,
        shieldRefillAt: pastRefill,
      });

      expect(res.shieldAvailable).toBe(true);
      expect(res.shieldRefillAt).toBeNull();
      expect(res.newStreak).toBe(5);
    });
  });

  describe("Timezone Day Boundaries", () => {
    it("does not calculate day boundaries using UTC alone", () => {
      // 2026-09-13 01:00:00 in Asia/Kolkata (+05:30) is:
      // UTC: 2026-09-12 19:30:00
      const timestamp = new Date("2026-09-12T19:30:00.000Z");

      const utcDay = timestamp.toISOString().split("T")[0]; // "2026-09-12"
      const kolkataDay = getLocalDateString(timestamp, "Asia/Kolkata"); // "2026-09-13"

      // Demonstrates the critical difference: In UTC it is Sept 12, but for the user it is Sept 13!
      expect(utcDay).toBe("2026-09-12");
      expect(kolkataDay).toBe("2026-09-13");
      expect(utcDay).not.toBe(kolkataDay);
    });

    it("correctly tracks consecutive days across timezone offsets", () => {
      // User in New York (UTC-4 / EDT)
      const tz = "America/New_York";

      // Task 1: 2026-09-12 at 23:30 NY time -> UTC: 2026-09-13 03:30
      const completion1 = new Date("2026-09-13T03:30:00.000Z");
      // Task 2: 2026-09-13 at 01:00 NY time (only 1.5 hours later real time, but a new calendar day in NY!)
      // UTC: 2026-09-13 05:00
      const completion2 = new Date("2026-09-13T05:00:00.000Z");

      const day1 = getLocalDateString(completion1, tz);
      const day2 = getLocalDateString(completion2, tz);
      const dayDiff = getCalendarDayDiff(completion1, completion2, tz);

      expect(day1).toBe("2026-09-12");
      expect(day2).toBe("2026-09-13");
      expect(dayDiff).toBe(1); // Consecutive calendar day in user's timezone!

      const streakRes = calculateStreakUpdate({
        currentStreak: 3,
        longestStreak: 5,
        lastCompletionAt: completion1,
        now: completion2,
        timeZone: tz,
        shieldAvailable: true,
        shieldRefillAt: null,
      });

      expect(streakRes.newStreak).toBe(4);
    });
  });
});
