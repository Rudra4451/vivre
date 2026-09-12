import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Isolated Server-Only Admin Supabase Client.
 * 
 * SECURITY RULE:
 * This module uses SUPABASE_SECRET_KEY with elevated privileges to bypass
 * Row Level Security (RLS) for administrative and background operations.
 * 
 * It is guarded with 'server-only' to guarantee it is strictly impossible
 * to import into Client Components or bundle into browser assets.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!secretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY environment variable. Admin client requires service-role / secret key."
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
