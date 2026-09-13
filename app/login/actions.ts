"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema } from "@/lib/validation/auth";
import type { AuthActionResult } from "@/types";

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const validation = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = await createClient();

  let { error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  // If email is not confirmed, auto-confirm via service-role admin and retry seamlessly
  if (error && error.message.toLowerCase().includes("email not confirmed")) {
    try {
      const admin = createAdminClient();
      const { data: { users } } = await admin.auth.admin.listUsers();
      const targetUser = users.find(
        (u) => u.email?.toLowerCase() === validation.data.email.toLowerCase()
      );
      if (targetUser) {
        await admin.auth.admin.updateUserById(targetUser.id, { email_confirm: true });
        const retry = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });
        error = retry.error;
      }
    } catch (adminErr) {
      console.error("Auto-confirm fallback error:", adminErr);
    }
  }

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, redirectTo: "/app" };
}
