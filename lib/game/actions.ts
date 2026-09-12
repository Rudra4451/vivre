"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CompleteTaskResult, AuthoritativeProgressionState } from "@/types";

export const completeTaskInputSchema = z.object({
  taskId: z.string().uuid({ message: "Invalid task ID format" }),
  idempotencyKey: z
    .string()
    .uuid({ message: "Invalid idempotency key format" })
    .default(() => crypto.randomUUID()),
});

export type CompleteTaskInput = z.input<typeof completeTaskInputSchema>;

/**
 * Server Action: completeTask
 *
 * Responsibilities:
 * 1. Authenticate caller (rejects unauthenticated requests).
 * 2. Validate input schema using Zod.
 * 3. Enforce distributed rate limiting (20 req/min/user).
 * 4. Execute atomic progression RPC `complete_task_v1` using the authenticated client.
 * 5. Sanitize and map database errors into safe user-facing errors (never leaking SQL).
 * 6. Return authoritative progression state.
 */
export async function completeTask(
  input: CompleteTaskInput
): Promise<CompleteTaskResult> {
  // 1. Validate Input
  const validation = completeTaskInputSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid task completion input",
    };
  }

  const { taskId, idempotencyKey } = validation.data;

  // 2. Authenticate Caller via SSR Server Client (Never service-role)
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Authentication required to complete tasks",
    };
  }

  // 3. Distributed Rate Limiting (20 req/min/user)
  const rateLimit = await checkRateLimit(user.id, "completion");
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many completion requests. Please slow down.",
    };
  }

  // 4. Call Database Function Authoritatively
  const { data, error } = await supabase.rpc("complete_task_v1", {
    p_task_id: taskId,
    p_idempotency_key: idempotencyKey,
  });

  // 5. Map Errors into Safe User-Facing Messages (Never leak internal SQL)
  if (error) {
    const errorMsg = error.message || "";
    const lower = errorMsg.toLowerCase();

    if (lower.includes("task not found") || error.code === "P0002") {
      return { success: false, error: "Task not found" };
    }
    if (lower.includes("unauthorized") || lower.includes("does not belong") || error.code === "42501") {
      return {
        success: false,
        error: "You are not authorized to complete this task",
      };
    }
    if (lower.includes("archived")) {
      return {
        success: false,
        error: "Archived tasks cannot be completed",
      };
    }
    if (lower.includes("invalid task category")) {
      return {
        success: false,
        error: "Invalid task category configuration",
      };
    }

    // Default safe fallback
    console.error("[Progression Engine] Error executing complete_task_v1:", error);
    return {
      success: false,
      error: "Unable to complete task. Please try again later.",
    };
  }

  if (!data) {
    return {
      success: false,
      error: "No response received from progression engine",
    };
  }

  // 6. Authoritative State Return
  return {
    success: true,
    data: data as unknown as AuthoritativeProgressionState,
  };
}
