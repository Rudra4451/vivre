import { describe, it, expect, vi, beforeEach } from "vitest";
import { completeTask } from "@/lib/game/actions";
import { resetLocalFallbackStore } from "@/lib/rate-limit";

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("Next.js Server Action: completeTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLocalFallbackStore();
  });

  describe("Input Validation", () => {
    it("rejects non-UUID task IDs", async () => {
      const res = await completeTask({
        taskId: "invalid-task-string",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Invalid task ID format/i);
    });

    it("rejects non-UUID idempotency keys", async () => {
      const validTaskId = crypto.randomUUID();
      const res = await completeTask({
        taskId: validTaskId,
        idempotencyKey: "not-a-valid-uuid",
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Invalid idempotency key format/i);
    });
  });

  describe("Authentication", () => {
    it("rejects unauthenticated requests", async () => {
      const validTaskId = crypto.randomUUID();
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No session") }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await completeTask({
        taskId: validTaskId,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Authentication required to complete tasks");
    });
  });

  describe("Safe Error Mapping & Leak Prevention", () => {
    const mockUser = { id: crypto.randomUUID() };

    it("maps task ownership rejection safely without leaking SQL", async () => {
      const validTaskId = crypto.randomUUID();
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'UNAUTHORIZED: Task does not belong to user (SELECT * FROM public.tasks WHERE id = ...)',
            code: "42501",
          },
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await completeTask({
        taskId: validTaskId,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("You are not authorized to complete this task");
      expect(res.error).not.toMatch(/SELECT|public\.tasks|42501/);
    });

    it("maps archived task error safely", async () => {
      const validTaskId = crypto.randomUUID();
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: "Task is archived and cannot be modified",
            code: "22000",
          },
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await completeTask({
        taskId: validTaskId,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Archived tasks cannot be completed");
    });

    it("maps task not found error safely", async () => {
      const validTaskId = crypto.randomUUID();
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: "Task not found in table public.tasks",
            code: "P0002",
          },
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await completeTask({
        taskId: validTaskId,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Task not found");
    });

    it("never leaks raw SQL or database internal errors to the user", async () => {
      const validTaskId = crypto.randomUUID();
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: "canceling statement due to lock timeout on relation 16420 'task_completions'",
            code: "55P03",
          },
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await completeTask({
        taskId: validTaskId,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe("Unable to complete task. Please try again later.");
      expect(res.error).not.toMatch(/lock timeout|task_completions|relation 16420|55P03/);
    });
  });

  describe("Rate Limiting", () => {
    it("enforces 20 requests per minute per user limit", async () => {
      const mockUser = { id: crypto.randomUUID() };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: { success: true },
          error: null,
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const taskId = crypto.randomUUID();

      // Execute 20 successful requests
      for (let i = 0; i < 20; i++) {
        const res = await completeTask({
          taskId,
          idempotencyKey: crypto.randomUUID(),
        });
        expect(res.success).toBe(true);
      }

      // 21st request should be rejected by rate limiter
      const blockedRes = await completeTask({
        taskId,
        idempotencyKey: crypto.randomUUID(),
      });

      expect(blockedRes.success).toBe(false);
      expect(blockedRes.error).toMatch(/Too many completion requests/i);
    });
  });

  describe("Idempotency & Duplicate Request Response", () => {
    it("returns deterministic response when duplicate idempotency key is submitted", async () => {
      const mockUser = { id: crypto.randomUUID() };
      const duplicatePayload = {
        success: true,
        is_duplicate: true,
        completion_id: crypto.randomUUID(),
        task_id: crypto.randomUUID(),
        category: "Body",
        xp_awarded: 10,
        bonus_roll: "base",
        level: 2,
        current_xp: 35,
        xp_to_next: 100,
        leveled_up: false,
        levels_gained: 0,
        current_streak: 3,
        longest_streak: 5,
        streak_shield_available: true,
        streak_shield_refill_at: null,
        shield_consumed: false,
        attribute: { name: "Body", value: 10 },
        completed_at: "2026-09-13T03:00:00.000Z",
      };

      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
        },
        rpc: vi.fn().mockResolvedValue({
          data: duplicatePayload,
          error: null,
        }),
      } as unknown as Awaited<ReturnType<typeof createClient>>);

      const res = await completeTask({
        taskId: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
      });

      expect(res.success).toBe(true);
      expect(res.data?.is_duplicate).toBe(true);
      expect(res.data?.xp_awarded).toBe(10);
      expect(res.data?.current_streak).toBe(3);
    });
  });
});
