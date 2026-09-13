import { z } from "zod";

export const completeTaskInputSchema = z.object({
  taskId: z.string().uuid({ message: "Invalid task ID format" }),
  idempotencyKey: z
    .string()
    .uuid({ message: "Invalid idempotency key format" })
    .default(() => crypto.randomUUID()),
});

export type CompleteTaskInput = z.input<typeof completeTaskInputSchema>;

export const reverseCompletionInputSchema = z.object({
  completionId: z.string().uuid({ message: "Invalid completion ID format" }),
});

export type ReverseCompletionInput = z.input<typeof reverseCompletionInputSchema>;

export const createTaskInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .refine(
      (val) => !/[<>]/.test(val),
      "Task title cannot contain HTML or script tags"
    ),
  category: z.enum(["Body", "Mind", "Discipline", "Craft", "Spirit"]),
  isRecurring: z.boolean().default(false),
});

export type CreateTaskInput = z.input<typeof createTaskInputSchema>;

export const updateSoundSettingsInputSchema = z.object({
  soundEnabled: z.boolean().optional(),
  calmMode: z.boolean().optional(),
});

export type UpdateSoundSettingsInput = z.input<typeof updateSoundSettingsInputSchema>;

export const purchaseItemInputSchema = z.object({
  itemId: z.string().uuid({ message: "Invalid item ID format" }),
  idempotencyKey: z
    .string()
    .uuid({ message: "Invalid idempotency key format" })
    .default(() => crypto.randomUUID()),
});

export type PurchaseItemInput = z.input<typeof purchaseItemInputSchema>;

export const equipItemInputSchema = z.object({
  inventoryId: z.string().uuid({ message: "Invalid inventory ID format" }),
});

export type EquipItemInput = z.input<typeof equipItemInputSchema>;

export const claimChallengeInputSchema = z.object({
  challengeId: z.string().uuid({ message: "Invalid challenge ID format" }),
});

export type ClaimChallengeInput = z.input<typeof claimChallengeInputSchema>;

export const updateNotificationPreferencesSchema = z.object({
  notification_email_comeback: z.boolean().optional(),
  notification_email_weekly_recap: z.boolean().optional(),
  email: z.string().email("Invalid email format").optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

