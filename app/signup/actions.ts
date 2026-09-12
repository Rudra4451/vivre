"use server";

import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth";
import type { AuthActionResult } from "@/types";

export async function signupAction(formData: FormData): Promise<AuthActionResult> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawUsername = formData.get("username");

  const validation = signupSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
    username: rawUsername,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid registration details",
    };
  }

  const supabase = await createClient();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      data: {
        username: validation.data.username,
      },
      emailRedirectTo: `${appUrl}/api/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
