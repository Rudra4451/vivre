"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const { data, error } = await supabase.auth.signUp({
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

  // Auto-confirm newly registered user so they are immediately active
  if (data?.user?.id) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true });
    } catch (adminErr) {
      console.error("Auto-confirm on signup error:", adminErr);
    }
  }

  // Immediately sign in user to set session cookies
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (signInError) {
    return { success: true, redirectTo: "/login?registered=true" };
  }

  return { success: true, redirectTo: "/app" };
}
