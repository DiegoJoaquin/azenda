// Worker principal de la cola de notificaciones.
// Lo invoca el cron de Vercel (que agrega "Authorization: Bearer CRON_SECRET"
// automáticamente cuando esa variable existe en el proyecto).

import { NextResponse } from "next/server";
import { processOutbox } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await processOutbox({ limit: 50, enqueueReminders: true });
  return NextResponse.json(result);
}
