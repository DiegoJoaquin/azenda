// Health check para monitoreo de uptime (UptimeRobot, BetterStack, etc.)

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "buuki",
    time: new Date().toISOString(),
  });
}
