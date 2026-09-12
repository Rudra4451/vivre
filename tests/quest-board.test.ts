import { describe, it, expect, vi, beforeEach } from "vitest";
import { guessCategory } from "@/lib/game/category-guesser";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { completeTask, reverseCompletion } from "@/lib/game/actions";
import { getLocalDateString } from "@/lib/game/progression";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Quest Board Acceptance Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQuestBoardStore.setState({
      completingTaskIds: {},
      activeUndo: null,
      pendingSyncTaskIds: {},
      activeError: null,
      authoritativeProfile: null,
      celebration: null,
    });
  });

  describe("Deterministic Category Guessing", () => {
    it("guesses Body category from physical keywords", () => {
      expect(guessCategory("5km morning run")).toBe("Body");
      expect(guessCategory("Heavy gym workout and pushups")).toBe("Body");
      expect(guessCategory("Evening yoga and stretching")).toBe("Body");
      expect(guessCategory("30 minute cardio bike session")).toBe("Body");
      expect(guessCategory("Hydrate 2L water and healthy meal")).toBe("Body");
    });

    it("guesses Mind category from mental / study keywords", () => {
      expect(guessCategory("Read 20 pages of sci-fi novel")).toBe("Mind");
      expect(guessCategory("Study TypeScript AST compiler")).toBe("Mind");
      expect(guessCategory("Daily chess puzzle review")).toBe("Mind");
      expect(guessCategory("Listen to neuroscience podcast")).toBe("Mind");
      expect(guessCategory("Journal evening reflections")).toBe("Mind");
    });

    it("guesses Discipline category from routine / habit keywords", () => {
      expect(guessCategory("Wake up at 6am without alarm snooze")).toBe("Discipline");
      expect(guessCategory("Clean desk and organize room")).toBe("Discipline");
      expect(guessCategory("Plan weekly budget and track expenses")).toBe("Discipline");
      expect(guessCategory("Inbox zero and schedule calendar")).toBe("Discipline");
      expect(guessCategory("Pomodoro focus block: no phone")).toBe("Discipline");
    });

    it("guesses Craft category from creative / technical keywords", () => {
      expect(guessCategory("Code new quest board component")).toBe("Craft");
      expect(guessCategory("Design UI in Figma")).toBe("Craft");
      expect(guessCategory("Refactor database migrations")).toBe("Craft");
      expect(guessCategory("Practice guitar chords 15 min")).toBe("Craft");
      expect(guessCategory("Write blog post draft")).toBe("Craft");
    });

    it("guesses Spirit category from mindfulness / connection keywords", () => {
      expect(guessCategory("Morning meditation and breathwork")).toBe("Spirit");
      expect(guessCategory("Watch sunset in silence")).toBe("Spirit");
      expect(guessCategory("Write gratitude list")).toBe("Spirit");
      expect(guessCategory("Call family and connect")).toBe("Spirit");
      expect(guessCategory("Volunteer community service")).toBe("Spirit");
    });

    it("falls back deterministically to Discipline on unknown phrases", () => {
      expect(guessCategory("xyz123 random text")).toBe("Discipline");
      expect(guessCategory("")).toBe("Discipline");
    });
  });

  describe("Double-Click & Concurrent Dispatch Protection", () => {
    it("locks in-flight task completion, preventing repeat double-clicks", () => {
      const store = useQuestBoardStore.getState();
      const taskId = "task-123";

      // First click: succeeds and locks the card
      const firstClickAllowed = store.startCompleting(taskId);
      expect(firstClickAllowed).toBe(true);
      expect(useQuestBoardStore.getState().completingTaskIds[taskId]).toBe(true);

      // Second click (double-click while in-flight): rejected immediately
      const secondClickAllowed = store.startCompleting(taskId);
      expect(secondClickAllowed).toBe(false);

      // Finish completes and unlocks
      store.finishCompleting(taskId);
      expect(useQuestBoardStore.getState().completingTaskIds[taskId]).toBeUndefined();
    });
  });

  describe("Slow Network & Authoritative State Reconciliation", () => {
    it("maintains completing indicator during slow RPC without modifying local math", async () => {
      const taskId = crypto.randomUUID();
      const idempotencyKey = crypto.randomUUID();
      const userId = crypto.randomUUID();

      let rpcResolved = false;

      const mockRpc = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        rpcResolved = true;
        return {
          data: {
            success: true,
            is_duplicate: false,
            completion_id: crypto.randomUUID(),
            task_id: taskId,
            category: "Craft",
            xp_awarded: 12,
            bonus_roll: "base",
            level: 3,
            current_xp: 45,
            xp_to_next: 125,
            leveled_up: false,
            levels_gained: 0,
            current_streak: 4,
            longest_streak: 6,
            streak_shield_available: true,
            streak_shield_refill_at: null,
            shield_consumed: false,
            attribute: { name: "Craft", value: 12 },
            completed_at: new Date().toISOString(),
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

      // Start completion
      useQuestBoardStore.getState().startCompleting(taskId);
      expect(useQuestBoardStore.getState().completingTaskIds[taskId]).toBe(true);

      const promise = completeTask({ taskId, idempotencyKey });
      expect(rpcResolved).toBe(false);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(rpcResolved).toBe(true);

      // Reconcile server state
      useQuestBoardStore.getState().reconcileServerState(result.data!);
      useQuestBoardStore.getState().finishCompleting(taskId);

      const profile = useQuestBoardStore.getState().authoritativeProfile;
      expect(profile?.level).toBe(3);
      expect(profile?.currentXp).toBe(45);
      expect(profile?.currentStreak).toBe(4);
      expect(useQuestBoardStore.getState().completingTaskIds[taskId]).toBeUndefined();
    });
  });

  describe("Duplicate Server Response", () => {
    it("handles duplicate server response idempotently without duplicate XP or streak advance", async () => {
      const taskId = crypto.randomUUID();
      const idempotencyKey = crypto.randomUUID();
      const userId = crypto.randomUUID();

      const duplicatePayload = {
        success: true,
        is_duplicate: true,
        completion_id: crypto.randomUUID(),
        task_id: taskId,
        category: "Discipline",
        xp_awarded: 12,
        bonus_roll: "base",
        level: 2,
        current_xp: 24, // Original XP preserved
        xp_to_next: 100,
        leveled_up: false,
        levels_gained: 0,
        current_streak: 2, // Original streak preserved
        longest_streak: 2,
        streak_shield_available: true,
        streak_shield_refill_at: null,
        shield_consumed: false,
        attribute: { name: "Discipline", value: 12 },
        completed_at: new Date().toISOString(),
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({ data: duplicatePayload, error: null }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await completeTask({ taskId, idempotencyKey });
      expect(res.success).toBe(true);
      expect(res.data?.is_duplicate).toBe(true);
      expect(res.data?.current_xp).toBe(24);
      expect(res.data?.current_streak).toBe(2);
    });
  });

  describe("Rejected Completion & Error Handling", () => {
    it("handles rejected completion, unlocks the card, and sets retryable error message", async () => {
      const taskId = crypto.randomUUID();
      const userId = crypto.randomUUID();

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Task is archived", code: "22000" },
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      useQuestBoardStore.getState().startCompleting(taskId);

      const res = await completeTask({ taskId, idempotencyKey: crypto.randomUUID() });
      expect(res.success).toBe(false);
      expect(res.error).toBe("Archived tasks cannot be completed");

      useQuestBoardStore.getState().setActiveError(res.error!);
      useQuestBoardStore.getState().finishCompleting(taskId);

      expect(useQuestBoardStore.getState().activeError).toBe("Archived tasks cannot be completed");
      expect(useQuestBoardStore.getState().completingTaskIds[taskId]).toBeUndefined();
    });
  });

  describe("Offline → Reconnect Sync State", () => {
    it("marks task as pending sync when offline without counting XP locally", () => {
      const store = useQuestBoardStore.getState();
      const taskId = "task-offline-1";

      store.setPendingSync(taskId, true);
      expect(useQuestBoardStore.getState().pendingSyncTaskIds[taskId]).toBe(true);

      // Local authoritative profile remains unmutated
      expect(useQuestBoardStore.getState().authoritativeProfile).toBeNull();

      // Upon reconnect and sync completion:
      store.setPendingSync(taskId, false);
      expect(useQuestBoardStore.getState().pendingSyncTaskIds[taskId]).toBeUndefined();
    });
  });

  describe("Compensating Reversal Action (reverseCompletion)", () => {
    it("successfully reverses completion within the 5-second UI window", async () => {
      const completionId = crypto.randomUUID();
      const userId = crypto.randomUUID();

      const reversalPayload = {
        success: true,
        reversal_id: crypto.randomUUID(),
        completion_id: completionId,
        task_id: crypto.randomUUID(),
        category: "Mind",
        xp_reversed: 10,
        level: 1,
        current_xp: 15, // Reduced by 10 from 25
        xp_to_next: 75,
        current_streak: 3,
        longest_streak: 5,
        streak_shield_available: true,
        attribute: { name: "Mind", value: 10 },
        reversed_at: new Date().toISOString(),
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({ data: reversalPayload, error: null }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await reverseCompletion({ completionId });
      expect(res.success).toBe(true);
      expect(res.data?.xp_reversed).toBe(10);
      expect(res.data?.current_xp).toBe(15);
    });

    it("rejects reversal when the 5-second window has expired", async () => {
      const completionId = crypto.randomUUID();
      const userId = crypto.randomUUID();

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Reversal window has expired", code: "22000" },
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await reverseCompletion({ completionId });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/The 5-second undo window for this quest has expired/i);
    });
  });

  describe("Completion Near Midnight in User Timezone", () => {
    it("calculates exact calendar day rollover using user's timezone near midnight", () => {
      const userTz = "Asia/Kolkata"; // UTC+5:30

      // Case A: 23:59:50 local time (18:29:50 UTC) -> Sept 12 in Asia/Kolkata
      const beforeMidnightUtc = new Date("2026-09-12T18:29:50.000Z");
      // Case B: 00:00:10 local time (18:30:10 UTC) -> Sept 13 in Asia/Kolkata
      const afterMidnightUtc = new Date("2026-09-12T18:30:10.000Z");

      const dayBefore = getLocalDateString(beforeMidnightUtc, userTz);
      const dayAfter = getLocalDateString(afterMidnightUtc, userTz);

      expect(dayBefore).toBe("2026-09-12");
      expect(dayAfter).toBe("2026-09-13");
      expect(dayBefore).not.toBe(dayAfter);

      // Demonstrates that even though UTC date is 2026-09-12 for both,
      // the user's timezone correctly registers the rollover into the next day!
      expect(beforeMidnightUtc.toISOString().split("T")[0]).toBe("2026-09-12");
      expect(afterMidnightUtc.toISOString().split("T")[0]).toBe("2026-09-12");
    });
  });
});
