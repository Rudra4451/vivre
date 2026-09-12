"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { AuthActionResult } from "@/types";

const resetSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
});

export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const validation = resetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid email",
    };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(validation.data.email, {
    redirectTo: `${appUrl}/api/auth/callback?type=recovery`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Always return success to prevent email enumeration
  return { success: true };
}
