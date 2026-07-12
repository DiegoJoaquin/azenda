// "Empujón" a la cola justo después de una reserva online, para que la
// confirmación salga al momento sin esperar al cron. Es seguro sin
// autenticación: solo procesa pendientes ya encolados por los triggers,
// es idempotente y no expone información.

import { NextResponse } from "next/server";
import { processOutbox } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await processOutbox({ limit: 5, enqueueReminders: false });
  return NextResponse.json({ ok: true, sent: result.sent ?? 0 });
}
