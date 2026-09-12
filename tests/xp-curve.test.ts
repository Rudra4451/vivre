import { describe, it, expect } from "vitest";
import {
  calculateXpToNext,
  applyXpGain,
  CATEGORY_BASE_XP,
  getCategoryBaseXp,
} from "@/lib/game/progression";

describe("Progression Engine: XP Curve & Mathematical Rules", () => {
  describe("XP curve levels 1, 10, 11, 25, 50, 51, 100", () => {
    it("calculates level 1: 50 + (1 * 25) = 75", () => {
      const xp = calculateXpToNext(1);
      expect(xp).toBe(75);
      expect(Number.isInteger(xp)).toBe(true);
    });

    it("calculates level 10: 50 + (10 * 25) = 300", () => {
      const xp = calculateXpToNext(10);
      expect(xp).toBe(300);
      expect(Number.isInteger(xp)).toBe(true);
    });

    it("calculates level 11: round(50 * 11^1.5) = 1824", () => {
      const expected = Math.round(50 * Math.pow(11, 1.5));
      const xp = calculateXpToNext(11);
      expect(xp).toBe(expected);
      expect(xp).toBe(1824);
      expect(Number.isInteger(xp)).toBe(true);
    });

    it("calculates level 25: round(50 * 25^1.5) = 6250", () => {
      const expected = Math.round(50 * Math.pow(25, 1.5));
      const xp = calculateXpToNext(25);
      expect(xp).toBe(expected);
      expect(xp).toBe(6250);
      expect(Number.isInteger(xp)).toBe(true);
    });

    it("calculates level 50: round(50 * 50^1.5) = 17678", () => {
      const expected = Math.round(50 * Math.pow(50, 1.5));
      const xp = calculateXpToNext(50);
      expect(xp).toBe(expected);
      expect(xp).toBe(17678);
      expect(Number.isInteger(xp)).toBe(true);
    });

    it("calculates level 51: round(50 * 51^1.5 * 0.6) = 10926", () => {
      const expected = Math.round(50 * Math.pow(51, 1.5) * 0.6);
      const xp = calculateXpToNext(51);
      expect(xp).toBe(expected);
      expect(xp).toBe(10926);
      expect(Number.isInteger(xp)).toBe(true);
    });

    it("calculates level 100: round(50 * 100^1.5 * 0.6) = 30000", () => {
      const expected = Math.round(50 * Math.pow(100, 1.5) * 0.6);
      const xp = calculateXpToNext(100);
      expect(xp).toBe(expected);
      expect(xp).toBe(30000);
      expect(Number.isInteger(xp)).toBe(true);
    });

    it("strictly uses integer XP at all levels", () => {
      for (let lvl = 1; lvl <= 120; lvl++) {
        const xp = calculateXpToNext(lvl);
        expect(Number.isInteger(xp)).toBe(true);
        expect(xp).toBeGreaterThan(0);
      }
    });
  });

  describe("Category Base XP Configuration", () => {
    it("contains authoritative base XP values", () => {
      expect(CATEGORY_BASE_XP.Body).toBe(10);
      expect(CATEGORY_BASE_XP.Mind).toBe(10);
      expect(CATEGORY_BASE_XP.Discipline).toBe(12);
      expect(CATEGORY_BASE_XP.Craft).toBe(12);
      expect(CATEGORY_BASE_XP.Spirit).toBe(10);
    });

    it("normalizes category case safely", () => {
      expect(getCategoryBaseXp("body")).toEqual({ category: "Body", baseXp: 10 });
      expect(getCategoryBaseXp("DISCIPLINE")).toEqual({ category: "Discipline", baseXp: 12 });
      expect(getCategoryBaseXp("  craft  ")).toEqual({ category: "Craft", baseXp: 12 });
    });

    it("rejects unknown categories", () => {
      expect(() => getCategoryBaseXp("UnknownCategory")).toThrow(/Invalid task category/);
    });
  });

  describe("Multiple Level-Up Overflow", () => {
    it("handles a single level up boundary cleanly", () => {
      // Level 1 requires 75 XP. Current XP = 50, gain = 30 -> Total 80 -> Level 2 with 5 XP
      const res = applyXpGain(1, 50, 30);
      expect(res.newLevel).toBe(2);
      expect(res.newXp).toBe(5);
      expect(res.levelsGained).toBe(1);
      expect(res.leveledUp).toBe(true);
      expect(res.xpToNext).toBe(calculateXpToNext(2)); // 50 + 2*25 = 100
    });

    it("handles massive XP injection traversing multiple levels", () => {
      // Level 1 requires 75 XP.
      // Level 2 requires 100 XP.
      // Level 3 requires 125 XP.
      // Level 4 requires 150 XP.
      // Total needed for Level 1 -> 5 is 75 + 100 + 125 + 150 = 450 XP.
      // Giving 500 XP at Level 1 (with 0 initial XP):
      // Level 1: 500 - 75 = 425
      // Level 2: 425 - 100 = 325
      // Level 3: 325 - 125 = 200
      // Level 4: 200 - 150 = 50 remaining at Level 5
      const res = applyXpGain(1, 0, 500);
      expect(res.newLevel).toBe(5);
      expect(res.newXp).toBe(50);
      expect(res.levelsGained).toBe(4);
      expect(res.leveledUp).toBe(true);
      expect(res.xpToNext).toBe(calculateXpToNext(5)); // 50 + 5*25 = 175
    });

    it("handles no level up when XP is insufficient", () => {
      const res = applyXpGain(1, 10, 20);
      expect(res.newLevel).toBe(1);
      expect(res.newXp).toBe(30);
      expect(res.levelsGained).toBe(0);
      expect(res.leveledUp).toBe(false);
      expect(res.xpToNext).toBe(75);
    });
  });
});
