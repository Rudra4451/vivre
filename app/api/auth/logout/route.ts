import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;

  // Protect against CSRF logout from foreign origins
  if (requestOrigin && requestOrigin !== expectedOrigin) {
    return NextResponse.json(
      { error: "Cross-origin logout forbidden" },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", expectedOrigin), {
    status: 302,
  });
}
