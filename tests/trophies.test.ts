import { describe, it, expect } from "vitest";
import {
  TROPHY_DEFINITIONS,
  evaluateTrophies,
  getTrophySummary,
} from "@/lib/game/trophies";
import type { UserProfile, Attribute, UserTrophy } from "@/types";

describe("Trophy System & Celestial Reliquary", () => {
  it("defines a consistent, unique catalog of celestial trophies", () => {
    expect(TROPHY_DEFINITIONS.length).toBe(10);
    const ids = new Set(TROPHY_DEFINITIONS.map((t) => t.id));
    expect(ids.size).toBe(10);

    for (const trophy of TROPHY_DEFINITIONS) {
      expect(trophy.targetValue).toBeGreaterThan(0);
      expect(["astral", "lunar", "solar", "celestial"]).toContain(trophy.tier);
      expect(["progression", "streak", "mastery", "exploration"]).toContain(trophy.category);
    }
  });

  it("evaluates a novice explorer with zero completions", () => {
    const results = evaluateTrophies({
      profile: null,
      attributes: [],
      totalCompletionsCount: 0,
      inventoryCount: 0,
      completedChallengesCount: 0,
    });

    expect(results.length).toBe(10);
    const unlocked = results.filter((r) => r.isUnlocked);
    expect(unlocked.length).toBe(0);

    const summary = getTrophySummary(results);
    expect(summary.totalCount).toBe(10);
    expect(summary.unlockedCount).toBe(0);
    expect(summary.percentUnlocked).toBe(0);
  });

  it("accurately unlocks progression and streak milestones for seasoned pilot", () => {
    const mockProfile = {
      id: "mock-user-1",
      level: 5,
      current_xp: 450,
      current_streak: 7,
      longest_streak: 10,
    } as unknown as UserProfile;

    const mockAttributes = [
      { name: "Body", value: 30 },
      { name: "Mind", value: 40 },
      { name: "Discipline", value: 50 },
      { name: "Craft", value: 25 },
      { name: "Spirit", value: 28 },
    ] as Attribute[];

    const results = evaluateTrophies({
      profile: mockProfile,
      attributes: mockAttributes,
      totalCompletionsCount: 12,
      inventoryCount: 2,
      completedChallengesCount: 1,
    });

    const unlockedIds = results.filter((r) => r.isUnlocked).map((r) => r.id);

    // Expect unlocked:
    // first_starlight (12 >= 1)
    // streak_three (7 >= 3)
    // streak_seven (7 >= 7)
    // directives_ten (12 >= 10)
    // level_five (5 >= 5)
    // aspect_harmony (5 attributes >= 25)
    // bazaar_patron (2 >= 1)
    // zenith_voyager (1 >= 1)
    expect(unlockedIds).toContain("first_starlight");
    expect(unlockedIds).toContain("streak_three");
    expect(unlockedIds).toContain("streak_seven");
    expect(unlockedIds).toContain("directives_ten");
    expect(unlockedIds).toContain("level_five");
    expect(unlockedIds).toContain("aspect_harmony");
    expect(unlockedIds).toContain("bazaar_patron");
    expect(unlockedIds).toContain("zenith_voyager");

    // Expect locked:
    // level_ten (5 < 10)
    // directives_twenty_five (12 < 25)
    expect(unlockedIds).not.toContain("level_ten");
    expect(unlockedIds).not.toContain("directives_twenty_five");

    const summary = getTrophySummary(results);
    expect(summary.unlockedCount).toBe(8);
    expect(summary.percentUnlocked).toBe(80);
    expect(summary.celestialUnlocked).toBe(1); // aspect_harmony is celestial
  });

  it("preserves persisted unlocked state from database history", () => {
    const persisted: UserTrophy[] = [
      {
        id: "trophy-row-1",
        user_id: "mock-user-1",
        trophy_id: "directives_twenty_five",
        unlocked_at: "2026-09-01T12:00:00Z",
      },
    ];

    const results = evaluateTrophies({
      profile: null,
      attributes: [],
      totalCompletionsCount: 5, // less than target of 25
      inventoryCount: 0,
      completedChallengesCount: 0,
      persistedTrophies: persisted,
    });

    const d25 = results.find((r) => r.id === "directives_twenty_five");
    expect(d25).toBeDefined();
    expect(d25?.isUnlocked).toBe(true);
    expect(d25?.unlockedAt).toBe("2026-09-01T12:00:00Z");
    expect(d25?.progressPercent).toBe(100);
  });

  it("calculates accurate aspect harmony requirement only when all 5 are >= 25", () => {
    const unbalanced = [
      { name: "Body", value: 30 },
      { name: "Mind", value: 40 },
      { name: "Discipline", value: 50 },
      { name: "Craft", value: 25 },
      { name: "Spirit", value: 20 }, // 20 < 25
    ] as Attribute[];

    const results = evaluateTrophies({
      attributes: unbalanced,
      totalCompletionsCount: 0,
      inventoryCount: 0,
      completedChallengesCount: 0,
    });

    const harmony = results.find((r) => r.id === "aspect_harmony");
    expect(harmony?.isUnlocked).toBe(false);
    expect(harmony?.currentValue).toBe(4);
    expect(harmony?.progressPercent).toBe(80); // 4/5 * 100
  });
});
