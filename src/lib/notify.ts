// Worker de notificaciones (solo servidor).
// Patrón outbox: los triggers de la base encolan; este módulo procesa la
// cola y envía correos vía Resend. Nunca corre en el hilo de la reserva.
// Requiere en el entorno del servidor (Vercel):
//   SUPABASE_SERVICE_ROLE_KEY  — para leer la cola entre tenants
//   RESEND_API_KEY             — para enviar correos
//   RESEND_FROM                — remitente, ej: "Azenda <hola@tudominio.cl>"

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */

function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

interface ProcessResult {
  skipped?: string;
  enqueuedReminders?: number;
  sent?: number;
  failed?: number;
}

export async function processOutbox(opts: {
  limit: number;
  enqueueReminders: boolean;
}): Promise<ProcessResult> {
  const sb = adminClient();
  if (!sb) return { skipped: "sin SUPABASE_SERVICE_ROLE_KEY" };
  if (!process.env.RESEND_API_KEY) return { skipped: "sin RESEND_API_KEY" };

  let enqueuedReminders = 0;

  // 1. Encolar recordatorios para citas confirmadas de las próximas 20–30 h
  if (opts.enqueueReminders) {
    const from = new Date(Date.now() + 20 * 3600_000).toISOString();
    const to = new Date(Date.now() + 30 * 3600_000).toISOString();
    const { data: appts } = await sb
      .from("appointments")
      .select("id, business_id, client_id")
      .eq("status", "confirmada")
      .gte("starts_at", from)
      .lte("starts_at", to)
      .limit(200);

    for (const a of appts ?? []) {
      const { data: client } = await sb
        .from("clients")
        .select("email")
        .eq("id", a.client_id)
        .single();
      if (!client?.email || !client.email.includes("@")) continue;
      const { error } = await sb.from("notification_outbox").upsert(
        {
          business_id: a.business_id,
          appointment_id: a.id,
          type: "reminder",
          recipient: client.email,
        },
        { onConflict: "appointment_id,type", ignoreDuplicates: true }
      );
      if (!error) enqueuedReminders++;
    }
  }

  // 2. Procesar pendientes (máx. 3 intentos por ítem)
  const { data: pending } = await sb
    .from("notification_outbox")
    .select("*")
    .eq("status", "pending")
    .lt("attempts", 3)
    .order("created_at")
    .limit(opts.limit);

  let sent = 0;
  let failed = 0;

  for (const item of pending ?? []) {
    try {
      const detail = await loadDetail(sb, item.appointment_id);
      if (!detail) throw new Error("cita no encontrada");
      await sendEmail(item.type, item.recipient, detail);
      await sb
        .from("notification_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", item.id);
      sent++;
    } catch (e) {
      const attempts = item.attempts + 1;
      await sb
        .from("notification_outbox")
        .update({
          attempts,
          status: attempts >= 3 ? "failed" : "pending",
          last_error: e instanceof Error ? e.message.slice(0, 300) : "error",
        })
        .eq("id", item.id);
      failed++;
    }
  }

  return { enqueuedReminders, sent, failed };
}

interface Detail {
  clientName: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  timezone: string;
  startsAt: string;
  services: string[];
  totalClp: number;
}

async function loadDetail(
  sb: SupabaseClient,
  appointmentId: string
): Promise<Detail | null> {
  const { data: appt } = await sb
    .from("appointments")
    .select("id, business_id, client_id, starts_at, total_clp")
    .eq("id", appointmentId)
    .single();
  if (!appt) return null;

  const [{ data: biz }, { data: client }, { data: items }] = await Promise.all([
    sb.from("businesses")
      .select("name, address, phone, timezone")
      .eq("id", appt.business_id)
      .single(),
    sb.from("clients").select("name").eq("id", appt.client_id).single(),
    sb.from("appointment_items")
      .select("service_id")
      .eq("appointment_id", appt.id),
  ]);

  let services: string[] = [];
  const serviceIds = (items ?? []).map((i: any) => i.service_id);
  if (serviceIds.length > 0) {
    const { data: svcs } = await sb
      .from("services")
      .select("name")
      .in("id", serviceIds);
    services = (svcs ?? []).map((s: any) => s.name);
  }

  return {
    clientName: client?.name ?? "cliente",
    businessName: biz?.name ?? "el negocio",
    businessAddress: biz?.address ?? "",
    businessPhone: biz?.phone ?? "",
    timezone: biz?.timezone ?? "America/Santiago",
    startsAt: appt.starts_at,
    services,
    totalClp: appt.total_clp ?? 0,
  };
}

function fmtWhen(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

async function sendEmail(type: string, to: string, d: Detail) {
  const when = fmtWhen(d.startsAt, d.timezone);
  const subjects: Record<string, string> = {
    confirmation: `Reserva confirmada en ${d.businessName}`,
    reminder: `Recordatorio: tu hora en ${d.businessName} es mañana`,
    cancellation: `Tu reserva en ${d.businessName} fue cancelada`,
  };
  const intro: Record<string, string> = {
    confirmation: "Tu reserva quedó confirmada.",
    reminder: "Te recordamos tu próxima cita.",
    cancellation: "Tu reserva fue cancelada. Si no lo pediste tú, contáctanos.",
  };

  const html = `
  <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1f1d1a;">
    <p style="font-size: 20px; margin-bottom: 4px;">${d.businessName}</p>
    <p style="color: #55514a; font-family: Arial, sans-serif; font-size: 14px;">
      Hola ${escapeHtml(d.clientName)} — ${intro[type]}
    </p>
    <div style="border: 1px solid #e7e4de; border-radius: 8px; padding: 16px; font-family: Arial, sans-serif; font-size: 14px;">
      <p style="margin: 0 0 6px;"><strong style="text-transform: capitalize;">${when} hrs</strong></p>
      <p style="margin: 0 0 6px; color: #55514a;">${d.services.map(escapeHtml).join(" + ")}</p>
      ${d.businessAddress ? `<p style="margin: 0 0 6px; color: #55514a;">${escapeHtml(d.businessAddress)}</p>` : ""}
      ${type !== "cancellation" ? `<p style="margin: 0; color: #55514a;">Total: $${d.totalClp.toLocaleString("es-CL")} · pago en el local</p>` : ""}
    </div>
    ${
      d.businessPhone
        ? `<p style="font-family: Arial, sans-serif; font-size: 12px; color: #8a857c;">¿Necesitas cambiar tu hora? Escríbenos al ${escapeHtml(d.businessPhone)}.</p>`
        : ""
    }
    <p style="font-family: Arial, sans-serif; font-size: 11px; color: #8a857c;">Enviado por Azenda</p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "Azenda <onboarding@resend.dev>",
      to: [to],
      subject: subjects[type] ?? subjects.confirmation,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
