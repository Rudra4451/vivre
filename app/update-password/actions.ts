"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { AuthActionResult } from "@/types";

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function updatePasswordAction(formData: FormData): Promise<AuthActionResult> {
  const validation = updatePasswordSchema.safeParse({
    password: formData.get("password"),
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid password",
    };
  }

  const supabase = await createClient();

  // Independently verify the user is authenticated (has a valid recovery session)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "Session expired. Please request a new password reset link.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: validation.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, redirectTo: "/app" };
}
