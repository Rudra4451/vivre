import { NextRequest, NextResponse } from "next/server";
import {
  processComebackNotifications,
  processWeeklyRecapNotifications,
} from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron GET Route Handler for Transactional Email Notifications.
 * 
 * SECURITY SPECIFICATION:
 * - Requires "Authorization: Bearer <CRON_SECRET>"
 * - Rejects unauthorized calls with 401 Unauthorized without exposing any secret details
 * - Never returns or leaks CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron Auth Error] CRON_SECRET is not configured on the server");
    return NextResponse.json(
      { error: "Server authentication configuration error" },
      { status: 500 }
    );
  }

  // Strictly enforce "Bearer <CRON_SECRET>"
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid authorization token" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const notificationType = searchParams.get("type") || "all";

  try {
    const results: Record<string, unknown> = {};

    if (notificationType === "comeback" || notificationType === "all") {
      const comebackResult = await processComebackNotifications();
      results.comeback = comebackResult;
    }

    if (notificationType === "weekly_recap" || notificationType === "all") {
      const weeklyRecapResult = await processWeeklyRecapNotifications();
      results.weekly_recap = weeklyRecapResult;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal notification error";
    console.error("[Cron Execution Failure]", message);
    return NextResponse.json(
      { error: "Internal notification processing failed" },
      { status: 500 }
    );
  }
}
