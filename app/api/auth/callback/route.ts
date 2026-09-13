import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectUrl } from "@/lib/auth/redirect";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  const next = sanitizeRedirectUrl(rawNext, "/app");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ensure user profile exists for OAuth users (e.g. Google Sign In)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (!profile) {
            const rawName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Cartographer";
            const sanitizedUsername = `${rawName.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 15)}_${Math.random().toString(36).slice(2, 6)}`;

            await supabase.from("profiles").insert({
              id: user.id,
              username: sanitizedUsername,
              email: user.email,
            });
          }
        }
      } catch (profileErr) {
        console.error("Profile check error in auth callback:", profileErr);
      }

      // Route based on the type of auth flow
      if (type === "recovery") {
        // Password reset — redirect to update-password form
        return NextResponse.redirect(new URL("/update-password", requestUrl.origin));
      }

      // Default: email verification or sign-in (safely sanitized relative path)
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return to login with error query param if code exchange failed
  return NextResponse.redirect(
    new URL("/login?error=Unable+to+authenticate+session", requestUrl.origin)
  );
}
