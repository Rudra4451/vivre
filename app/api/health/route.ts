import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { HealthCheckResponse } from "@/types";

export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let overallStatus: HealthCheckResponse["status"] = "ok";

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("shop_items").select("id").limit(1);
    if (!error) {
      dbStatus = "connected";
    } else {
      overallStatus = "degraded";
    }
  } catch {
    overallStatus = "error";
  }

  return NextResponse.json(
    {
      status: overallStatus,
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      database: dbStatus,
    },
    {
      status: overallStatus === "error" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
