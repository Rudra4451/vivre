import { NextResponse } from "next/server";
import type { HealthCheckResponse } from "@/types";

export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return NextResponse.json(
    {
      status: "ok",
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
