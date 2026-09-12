import { describe, it, expect, vi, beforeEach } from "vitest";
import { completeTask } from "@/lib/game/actions";
import { resetLocalFallbackStore } from "@/lib/rate-limit";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Progression Engine: Concurrency & Idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLocalFallbackStore();
  });

  it("Acceptance requirement: Two simultaneous completion requests with the same idempotency key must result in exactly one reward", async () => {
    const userId = crypto.randomUUID();
    const taskId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();
    const completionId = crypto.randomUUID();

    // Authoritative ledger & profile progression state
    let completionLedgerCount = 0;
    let totalXpAwarded = 0;
    let initialUserXp = 0;
    let initialStreak = 2;

    const mockRpc = vi.fn().mockImplementation(async (fnName, params) => {
      expect(fnName).toBe("complete_task_v1");
      expect(params.p_task_id).toBe(taskId);
      expect(params.p_idempotency_key).toBe(idempotencyKey);

      // Simulate PostgreSQL transaction serialization (FOR UPDATE lock on profiles table)
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));

      if (completionLedgerCount > 0) {
        // Idempotent duplicate: already completed with this key
        return {
          data: {
            success: true,
            is_duplicate: true,
            completion_id: completionId,
            task_id: taskId,
            category: "Discipline",
            xp_awarded: 12, // Original award recorded in ledger
            bonus_roll: "base",
            level: 1,
            current_xp: initialUserXp, // Unchanged: NO second award
            xp_to_next: 75,
            leveled_up: false,
            levels_gained: 0,
            current_streak: initialStreak, // Unchanged: NO second streak increment
            longest_streak: initialStreak,
            streak_shield_available: true,
            streak_shield_refill_at: null,
            shield_consumed: false,
            attribute: { name: "Discipline", value: 12 },
            completed_at: "2026-09-13T03:00:00.000Z",
          },
          error: null,
        };
      }

      // First transaction wins: awards XP, advances streak, inserts ledger row
      completionLedgerCount += 1;
      const awardedXp = 12; // Discipline base XP
      totalXpAwarded += awardedXp;
      initialUserXp += awardedXp;
      initialStreak += 1;

      return {
        data: {
          success: true,
          is_duplicate: false,
          completion_id: completionId,
          task_id: taskId,
          category: "Discipline",
          base_xp: 12,
          multiplier: 1.0,
          bonus_roll: "base",
          xp_awarded: awardedXp,
          is_capped: false,
          daily_category_completions: 1,
          level: 1,
          current_xp: initialUserXp,
          xp_to_next: 75,
          leveled_up: false,
          levels_gained: 0,
          current_streak: initialStreak,
          longest_streak: initialStreak,
          streak_shield_available: true,
          streak_shield_refill_at: null,
          shield_consumed: false,
          attribute: { name: "Discipline", value: awardedXp },
          completed_at: "2026-09-13T03:00:00.000Z",
        },
        error: null,
      };
    });

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
      },
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    // Fire TWO simultaneous completion requests with the identical idempotency key
    const [response1, response2] = await Promise.all([
      completeTask({ taskId, idempotencyKey }),
      completeTask({ taskId, idempotencyKey }),
    ]);

    // Both requests succeed gracefully (no crashes, no deadlocks)
    expect(response1.success).toBe(true);
    expect(response2.success).toBe(true);

    // Exactly one response is the fresh transaction, and the other is marked duplicate
    const results = [response1.data!, response2.data!];
    const freshCount = results.filter((r) => !r.is_duplicate).length;
    const duplicateCount = results.filter((r) => r.is_duplicate).length;

    expect(freshCount).toBe(1);
    expect(duplicateCount).toBe(1);

    // Exactly one ledger row created in the database
    expect(completionLedgerCount).toBe(1);

    // Exactly one reward granted (12 XP awarded in total)
    expect(totalXpAwarded).toBe(12);

    // User's final authoritative XP matches exactly 1 reward
    expect(response1.data!.current_xp).toBe(12);
    expect(response2.data!.current_xp).toBe(12);

    // Streak incremented exactly once (from 2 to 3)
    expect(response1.data!.current_streak).toBe(3);
    expect(response2.data!.current_streak).toBe(3);
  });
});
