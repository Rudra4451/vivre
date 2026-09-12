import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 proxy — runs on every matched request before rendering.
 *
 * Responsibilities:
 * 1. Refresh Supabase auth cookies (session keep-alive)
 * 2. Redirect unauthenticated users away from /app routes
 * 3. Redirect authenticated users away from /login and /signup
 *
 * IMPORTANT: This is NOT the only authorization layer.
 * Every Server Action authenticates independently via requireAuth().
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Protected routes: redirect to login if not authenticated
  if (pathname.startsWith("/app")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Auth pages: redirect to /app if already authenticated
  if (pathname === "/login" || pathname === "/signup") {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
