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
