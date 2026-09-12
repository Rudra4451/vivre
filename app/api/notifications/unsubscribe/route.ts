import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/notifications/unsubscribe-token";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Server-controlled, tokenized unsubscribe endpoint.
 * Requires a cryptographically valid HMAC-SHA256 signature token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const acceptsJson = request.headers.get("accept")?.includes("application/json");

  if (!token) {
    if (acceptsJson) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }
    return new NextResponse(renderHtmlFeedback("Missing Token", "No unsubscribe token provided.", false), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const verification = verifyUnsubscribeToken(token);

  if (!verification.valid || !verification.userId) {
    if (acceptsJson) {
      return NextResponse.json(
        { error: verification.error || "Invalid or expired token" },
        { status: 400 }
      );
    }
    return new NextResponse(
      renderHtmlFeedback(
        "Invalid Link",
        verification.error || "This unsubscribe link is invalid or has expired.",
        false
      ),
      {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  try {
    const supabase = createAdminClient();
    const updatePayload: {
      notification_email_comeback?: boolean;
      notification_email_weekly_recap?: boolean;
    } = {};

    if (verification.type === "comeback") {
      updatePayload.notification_email_comeback = false;
    } else if (verification.type === "weekly_recap") {
      updatePayload.notification_email_weekly_recap = false;
    } else {
      updatePayload.notification_email_comeback = false;
      updatePayload.notification_email_weekly_recap = false;
    }

    const { error: dbError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", verification.userId);

    if (dbError) {
      console.error("[Unsubscribe DB Error]", dbError);
      if (acceptsJson) {
        return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
      }
      return new NextResponse(
        renderHtmlFeedback("Error", "Could not update your notification preferences. Please try again later.", false),
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const typeDescription =
      verification.type === "comeback"
        ? "Streak and Comeback Reminders"
        : verification.type === "weekly_recap"
        ? "Weekly Celestial Recaps"
        : "All Transactional Email Notifications";

    if (acceptsJson) {
      return NextResponse.json({
        success: true,
        message: `Successfully unsubscribed from ${typeDescription}`,
        type: verification.type,
      });
    }

    return new NextResponse(
      renderHtmlFeedback(
        "Unsubscribed",
        `You have been unsubscribed from ${typeDescription}. You can update your preferences anytime from your Vivre account settings.`,
        true
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[Unsubscribe Handler Error]", message);
    if (acceptsJson) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    return new NextResponse(
      renderHtmlFeedback("Error", "An unexpected error occurred. Please try again.", false),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

function renderHtmlFeedback(title: string, message: string, success: boolean): string {
  const accentColor = success ? "#38bdf8" : "#f87171";
  const icon = success ? "✓" : "✕";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vivre • ${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, #0f172a 0%, #05070f 100%);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      margin: 20px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }
    .badge {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: ${accentColor}20;
      border: 2px solid ${accentColor};
      color: ${accentColor};
      font-size: 24px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 12px 0;
      letter-spacing: -0.01em;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 28px 0;
    }
    a.btn {
      display: inline-block;
      background: #38bdf8;
      color: #0f172a;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 9999px;
      transition: opacity 0.2s ease;
    }
    a.btn:hover {
      opacity: 0.9;
    }
    .brand {
      color: #38bdf8;
      font-size: 11px;
      letter-spacing: 0.25em;
      font-weight: 800;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">V I V R E</div>
    <div class="badge">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/app" class="btn">Return to Vivre</a>
  </div>
</body>
</html>`;
}
