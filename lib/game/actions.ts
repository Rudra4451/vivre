"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type {
  CompleteTaskResult,
  AuthoritativeProgressionState,
  ReverseCompletionResult,
  AuthoritativeReversalState,
  CreateTaskResult,
  Task,
} from "@/types";

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

export const reverseCompletionInputSchema = z.object({
  completionId: z.string().uuid({ message: "Invalid completion ID format" }),
});

export type ReverseCompletionInput = z.input<typeof reverseCompletionInputSchema>;

/**
 * Server Action: reverseCompletion
 *
 * Reverses a task completion within the 5-second UI window via a compensating
 * database transaction (inserting into completion_reversals).
 */
export async function reverseCompletion(
  input: ReverseCompletionInput
): Promise<ReverseCompletionResult> {
  const validation = reverseCompletionInputSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid reversal input",
    };
  }

  const { completionId } = validation.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Authentication required to reverse completions",
    };
  }

  const { data, error } = await supabase.rpc("reverse_completion_v1", {
    p_completion_id: completionId,
  });

  if (error) {
    const lower = (error.message || "").toLowerCase();
    if (lower.includes("already been reversed")) {
      return { success: false, error: "This completion was already reversed." };
    }
    if (lower.includes("expired") || lower.includes("reversal window")) {
      return { success: false, error: "The 5-second undo window for this quest has expired." };
    }
    if (lower.includes("unauthorized") || lower.includes("does not belong")) {
      return { success: false, error: "You are not authorized to reverse this completion." };
    }
    if (lower.includes("not found")) {
      return { success: false, error: "Completion record not found." };
    }

    console.error("[Progression Engine] Reversal error:", error);
    return { success: false, error: "Unable to reverse completion at this time." };
  }

  return {
    success: true,
    data: data as unknown as AuthoritativeReversalState,
  };
}

export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  category: z.enum(["Body", "Mind", "Discipline", "Craft", "Spirit"]),
  isRecurring: z.boolean().default(false),
});

export type CreateTaskInput = z.input<typeof createTaskInputSchema>;

/**
 * Server Action: createTaskAction
 *
 * Creates a new task for the authenticated pilot.
 */
export async function createTaskAction(
  input: CreateTaskInput
): Promise<CreateTaskResult> {
  const validation = createTaskInputSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid task data",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Authentication required to create tasks",
    };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: validation.data.title,
      category: validation.data.category,
      is_recurring: validation.data.isRecurring,
    })
    .select()
    .single();

  if (error) {
    console.error("[Tasks] Creation error:", error);
    return { success: false, error: "Failed to create task" };
  }

  return {
    success: true,
    task: data as Task,
  };
}

export const updateSoundSettingsInputSchema = z.object({
  soundEnabled: z.boolean().optional(),
  calmMode: z.boolean().optional(),
});

export type UpdateSoundSettingsInput = z.input<typeof updateSoundSettingsInputSchema>;

/**
 * Server Action: updateSoundSettingsAction
 *
 * Persists sound_enabled and calm_mode preferences directly to the user's profile in Supabase.
 */
export async function updateSoundSettingsAction(
  input: UpdateSoundSettingsInput
): Promise<{ success: boolean; error?: string }> {
  const validation = updateSoundSettingsInputSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: "Invalid sound settings" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Unauthenticated caller (e.g. guest or showcase demonstration) — safe no-op
    return { success: true };
  }

  const updates: {
    sound_enabled?: boolean;
    calm_mode?: boolean;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (validation.data.soundEnabled !== undefined) {
    updates.sound_enabled = validation.data.soundEnabled;
  }
  if (validation.data.calmMode !== undefined) {
    updates.calm_mode = validation.data.calmMode;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    console.error("[Settings] Sound settings update error:", error);
    return { success: false, error: "Failed to persist sound settings" };
  }

  return { success: true };
}

