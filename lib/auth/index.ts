import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Retrieve the current authenticated user using the server client.
 * Safe to call in Server Components and Route Handlers.
 * Memoized per-request using React cache.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
});

/**
 * Require an authenticated user; redirects to login page if unauthenticated.
 * Use in Server Components and page-level server functions.
 */
export async function requireUser(redirectTo = "/login"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Require an authenticated user for Server Actions.
 * Throws an error instead of redirecting (suitable for action responses).
 * Every Server Action must authenticate independently — do NOT rely on proxy alone.
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: authentication required");
  }

  return user;
}
