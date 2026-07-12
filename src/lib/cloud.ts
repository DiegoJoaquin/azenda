"use client";

// Capa de acceso a Supabase (modo "cloud"). Mapea entre el esquema SQL
// (snake_case, ítems en tabla aparte) y los tipos de la app (camelCase,
// ítems anidados). El store decide cuándo llamarla según el modo.

import { supabase } from "./supabase";
import type {
  Appointment,
  AppointmentStatus,
  Business,
  Client,
  DB,
  Service,
  ServiceCategory,
  Staff,
  StaffSchedule,
  TimeBlock,
  Vertical,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------- Mapeos fila → tipo ----------

function mapBusiness(r: any): Business {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    vertical: r.vertical as Vertical,
    description: r.description ?? "",
    phone: r.phone ?? "",
    address: r.address ?? "",
    timezone: r.timezone,
    onlineBookingEnabled: r.online_booking_enabled,
    requiresApproval: r.requires_approval,
    minLeadMinutes: r.min_lead_minutes,
    maxLeadDays: r.max_lead_days,
    cancellationHours: r.cancellation_hours,
    slotGranularityMin: r.slot_granularity_min,
    planStatus: r.plan_status ?? "active",
    trialEndsAt: r.trial_ends_at ?? "2099-01-01T00:00:00",
  };
}

function mapStaff(r: any): Staff {
  return {
    id: r.id,
    name: r.name,
    title: r.title ?? "",
    color: r.color ?? "#3f5c4b",
    bookableOnline: r.bookable_online,
    active: r.active,
    sortOrder: r.sort_order ?? 0,
  };
}

function mapSchedule(r: any): StaffSchedule {
  return {
    id: r.id,
    staffId: r.staff_id,
    weekday: r.weekday,
    start: String(r.start_time).slice(0, 5),
    end: String(r.end_time).slice(0, 5),
  };
}

function mapBlock(r: any): TimeBlock {
  return {
    id: r.id,
    staffId: r.staff_id,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    reason: r.reason ?? "Bloqueado",
  };
}

function mapCategory(r: any): ServiceCategory {
  return { id: r.id, name: r.name, sortOrder: r.sort_order ?? 0 };
}

function mapService(r: any): Service {
  return {
    id: r.id,
    categoryId: r.category_id,
    name: r.name,
    description: r.description ?? "",
    durationMin: r.duration_min,
    bufferBeforeMin: r.buffer_before_min ?? 0,
    bufferAfterMin: r.buffer_after_min ?? 0,
    priceClp: r.price_clp ?? 0,
    visibleOnline: r.visible_online,
    active: r.active,
    sortOrder: r.sort_order ?? 0,
  };
}

function mapClient(r: any): Client {
  return {
    id: r.id,
    name: r.name,
    email: r.email ?? "",
    phone: r.phone ?? "",
    notes: r.notes ?? "",
    createdAt: r.created_at,
  };
}

function toUTC(localOrIso: string): string {
  return new Date(localOrIso).toISOString();
}

// ---------- Sesión y negocio del usuario ----------

export async function getSession() {
  const { data } = await supabase().auth.getSession();
  return data.session;
}

export async function fetchMyBusinessId(): Promise<string | null> {
  const { data, error } = await supabase()
    .from("memberships")
    .select("business_id")
    .limit(1);
  if (error) throw error;
  return data?.[0]?.business_id ?? null;
}

// ---------- Snapshot del panel (miembro autenticado) ----------

export async function fetchAdminSnapshot(businessId: string): Promise<DB> {
  const sb = supabase();
  const [biz, staff, schedules, blocks, categories, services, staffSvcs, clients, appts, items] =
    await Promise.all([
      sb.from("businesses").select("*").eq("id", businessId).single(),
      sb.from("staff").select("*").eq("business_id", businessId),
      sb.from("staff_schedules").select("*").eq("business_id", businessId),
      sb.from("time_blocks").select("*").eq("business_id", businessId),
      sb.from("service_categories").select("*").eq("business_id", businessId),
      sb.from("services").select("*").eq("business_id", businessId),
      sb.from("staff_services").select("*"),
      sb.from("clients").select("*").eq("business_id", businessId),
      sb.from("appointments").select("*").eq("business_id", businessId),
      sb.from("appointment_items").select("*").eq("business_id", businessId),
    ]);

  for (const r of [biz, staff, schedules, blocks, categories, services, staffSvcs, clients, appts, items]) {
    if (r.error) throw r.error;
  }

  const itemsByAppt = new Map<string, any[]>();
  for (const it of items.data!) {
    const list = itemsByAppt.get(it.appointment_id) ?? [];
    list.push(it);
    itemsByAppt.set(it.appointment_id, list);
  }

  const appointments: Appointment[] = appts.data!.map((a: any) => ({
    id: a.id,
    clientId: a.client_id,
    status: a.status as AppointmentStatus,
    origin: a.origin,
    startsAt: a.starts_at,
    endsAt: a.ends_at,
    totalClp: a.total_clp ?? 0,
    clientNote: a.client_note ?? undefined,
    createdAt: a.created_at,
    items: (itemsByAppt.get(a.id) ?? [])
      .sort((x, y) => String(x.starts_at).localeCompare(String(y.starts_at)))
      .map((it: any) => ({
        serviceId: it.service_id,
        staffId: it.staff_id,
        startsAt: it.starts_at,
        durationMin: it.duration_min,
        priceClp: it.price_clp ?? 0,
      })),
  }));

  const staffIds = new Set(staff.data!.map((s: any) => s.id));

  return {
    business: mapBusiness(biz.data),
    staff: staff.data!.map(mapStaff),
    schedules: schedules.data!.map(mapSchedule),
    blocks: blocks.data!.map(mapBlock),
    categories: categories.data!.map(mapCategory),
    services: services.data!.map(mapService),
    staffServices: staffSvcs
      .data!.filter((ss: any) => staffIds.has(ss.staff_id))
      .map((ss: any) => ({ staffId: ss.staff_id, serviceId: ss.service_id })),
    clients: clients.data!.map(mapClient),
    appointments,
  };
}

// ---------- Snapshot público (mini-sitio de reservas, anónimo) ----------

export async function fetchPublicSnapshot(slug: string): Promise<DB | null> {
  const sb = supabase();
  const { data: bizRow, error } = await sb
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!bizRow) return null;

  const business = mapBusiness(bizRow);
  const from = new Date();
  const to = new Date(Date.now() + business.maxLeadDays * 86_400_000);

  const [staff, schedules, categories, services, staffSvcs, busy] =
    await Promise.all([
      sb.from("staff").select("*").eq("business_id", business.id),
      sb.from("staff_schedules").select("*").eq("business_id", business.id),
      sb.from("service_categories").select("*").eq("business_id", business.id),
      sb.from("services").select("*").eq("business_id", business.id),
      sb.from("staff_services").select("*"),
      sb.rpc("get_busy_intervals", {
        p_business_id: business.id,
        p_from: from.toISOString(),
        p_to: to.toISOString(),
      }),
    ]);
  for (const r of [staff, schedules, categories, services, staffSvcs, busy]) {
    if (r.error) throw r.error;
  }

  const staffIds = new Set(staff.data!.map((s: any) => s.id));

  // Los intervalos ocupados (citas con buffers + bloqueos, sin datos de
  // clientes) entran como "blocks": el motor los resta igual.
  const blocks: TimeBlock[] = busy.data!.map((b: any, i: number) => ({
    id: `busy-${i}`,
    staffId: b.staff_id,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    reason: "ocupado",
  }));

  return {
    business,
    staff: staff.data!.map(mapStaff),
    schedules: schedules.data!.map(mapSchedule),
    blocks,
    categories: categories.data!.map(mapCategory),
    services: services.data!.map(mapService),
    staffServices: staffSvcs
      .data!.filter((ss: any) => staffIds.has(ss.staff_id))
      .map((ss: any) => ({ staffId: ss.staff_id, serviceId: ss.service_id })),
    clients: [],
    appointments: [],
  };
}

// ---------- Reserva pública (RPC transaccional anti-sobrecupo) ----------

export async function rpcBookAppointment(args: {
  businessId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNote: string;
  items: { serviceId: string; staffId: string; startsAt: string }[];
}): Promise<string> {
  const { data, error } = await supabase().rpc("book_appointment", {
    p_business_id: args.businessId,
    p_client_name: args.clientName,
    p_client_email: args.clientEmail,
    p_client_phone: args.clientPhone,
    p_client_note: args.clientNote,
    p_items: args.items.map((it) => ({
      service_id: it.serviceId,
      staff_id: it.staffId,
      starts_at: toUTC(it.startsAt),
    })),
  });
  if (error) {
    // Códigos de negocio que lanza la función SQL blindada
    for (const code of [
      "SLOT_TAKEN",
      "BOOKING_LIMIT",
      "BOOKING_RATE",
      "BOOKING_PAUSED",
      "INVALID_INPUT",
      "INVALID_SERVICE",
      "INVALID_STAFF",
    ]) {
      if (error.message.includes(code)) throw new Error(code);
    }
    throw error;
  }
  return data as string;
}

// ---------- Onboarding ----------

export async function rpcCreateBusiness(args: {
  name: string;
  slug: string;
  vertical: Vertical;
  description: string;
  phone: string;
  address: string;
}): Promise<string> {
  const { data, error } = await supabase().rpc("create_business", {
    p_name: args.name,
    p_slug: args.slug,
    p_vertical: args.vertical,
    p_description: args.description,
    p_phone: args.phone,
    p_address: args.address,
  });
  if (error) {
    if (error.message.includes("SLUG_TAKEN")) throw new Error("SLUG_TAKEN");
    throw error;
  }
  return data as string;
}

export async function seedBusinessData(
  businessId: string,
  categories: { id: string; name: string; sortOrder: number }[],
  services: (Service & { staffIds: string[] })[],
  staff: (Staff & { weekdays: number[]; start: string; end: string })[]
) {
  const sb = supabase();

  const { error: e1 } = await sb.from("service_categories").insert(
    categories.map((c) => ({
      id: c.id,
      business_id: businessId,
      name: c.name,
      sort_order: c.sortOrder,
    }))
  );
  if (e1) throw e1;

  const { error: e2 } = await sb.from("services").insert(
    services.map((s, i) => ({
      id: s.id,
      business_id: businessId,
      category_id: s.categoryId,
      name: s.name,
      description: s.description,
      duration_min: s.durationMin,
      buffer_before_min: s.bufferBeforeMin,
      buffer_after_min: s.bufferAfterMin,
      price_clp: s.priceClp,
      visible_online: s.visibleOnline,
      active: true,
      sort_order: i,
    }))
  );
  if (e2) throw e2;

  const { error: e3 } = await sb.from("staff").insert(
    staff.map((st, i) => ({
      id: st.id,
      business_id: businessId,
      name: st.name,
      title: st.title,
      color: st.color,
      bookable_online: true,
      active: true,
      sort_order: i,
    }))
  );
  if (e3) throw e3;

  const schedRows = staff.flatMap((st) =>
    st.weekdays.map((weekday) => ({
      business_id: businessId,
      staff_id: st.id,
      weekday,
      start_time: st.start,
      end_time: st.end,
    }))
  );
  if (schedRows.length > 0) {
    const { error: e4 } = await sb.from("staff_schedules").insert(schedRows);
    if (e4) throw e4;
  }

  const ssRows = services.flatMap((s) =>
    s.staffIds.map((staffId) => ({ staff_id: staffId, service_id: s.id }))
  );
  if (ssRows.length > 0) {
    const { error: e5 } = await sb.from("staff_services").insert(ssRows);
    if (e5) throw e5;
  }
}

// ---------- Escrituras del panel (modo cloud) ----------

function logErr(op: string) {
  return (e: unknown) => console.error(`[cloud] ${op}:`, e);
}

export function cloudAddAppointment(businessId: string, appt: Appointment) {
  const sb = supabase();
  sb.from("appointments")
    .insert({
      id: appt.id,
      business_id: businessId,
      client_id: appt.clientId,
      status: appt.status,
      origin: appt.origin,
      starts_at: toUTC(appt.startsAt),
      ends_at: toUTC(appt.endsAt),
      total_clp: appt.totalClp,
      client_note: appt.clientNote ?? null,
    })
    .then(({ error }) => {
      if (error) return logErr("addAppointment")(error);
      sb.from("appointment_items")
        .insert(
          appt.items.map((it) => ({
            appointment_id: appt.id,
            business_id: businessId,
            service_id: it.serviceId,
            staff_id: it.staffId,
            starts_at: toUTC(it.startsAt),
            duration_min: it.durationMin,
            price_clp: it.priceClp,
          }))
        )
        .then(({ error: e2 }) => e2 && logErr("addAppointmentItems")(e2));
    });
}

export function cloudSetAppointmentStatus(id: string, status: AppointmentStatus) {
  supabase()
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .then(({ error }) => error && logErr("setStatus")(error));
}

export function cloudInsertClient(businessId: string, c: Client) {
  supabase()
    .from("clients")
    .insert({
      id: c.id,
      business_id: businessId,
      name: c.name,
      email: c.email || null,
      phone: c.phone,
      notes: c.notes,
    })
    .then(({ error }) => error && logErr("insertClient")(error));
}

export function cloudUpdateClientNotes(id: string, notes: string) {
  supabase()
    .from("clients")
    .update({ notes })
    .eq("id", id)
    .then(({ error }) => error && logErr("updateClientNotes")(error));
}

export function cloudUpdateBusiness(id: string, patch: Partial<Business>) {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.requiresApproval !== undefined) row.requires_approval = patch.requiresApproval;
  if (patch.minLeadMinutes !== undefined) row.min_lead_minutes = patch.minLeadMinutes;
  if (patch.maxLeadDays !== undefined) row.max_lead_days = patch.maxLeadDays;
  if (patch.cancellationHours !== undefined) row.cancellation_hours = patch.cancellationHours;
  if (patch.slotGranularityMin !== undefined) row.slot_granularity_min = patch.slotGranularityMin;
  if (patch.onlineBookingEnabled !== undefined) row.online_booking_enabled = patch.onlineBookingEnabled;
  supabase()
    .from("businesses")
    .update(row)
    .eq("id", id)
    .then(({ error }) => error && logErr("updateBusiness")(error));
}

export function cloudAddStaff(
  businessId: string,
  staff: Staff,
  schedules: { weekday: number; start: string; end: string }[],
  serviceIds: string[]
) {
  const sb = supabase();
  sb.from("staff")
    .insert({
      id: staff.id,
      business_id: businessId,
      name: staff.name,
      title: staff.title,
      color: staff.color,
      bookable_online: staff.bookableOnline,
      active: staff.active,
      sort_order: staff.sortOrder,
    })
    .then(({ error }) => {
      if (error) return logErr("addStaff")(error);
      if (schedules.length > 0) {
        sb.from("staff_schedules")
          .insert(
            schedules.map((s) => ({
              business_id: businessId,
              staff_id: staff.id,
              weekday: s.weekday,
              start_time: s.start,
              end_time: s.end,
            }))
          )
          .then(({ error: e }) => e && logErr("addStaffSchedules")(e));
      }
      if (serviceIds.length > 0) {
        sb.from("staff_services")
          .insert(serviceIds.map((sid) => ({ staff_id: staff.id, service_id: sid })))
          .then(({ error: e }) => e && logErr("addStaffServices")(e));
      }
    });
}

export function cloudSetStaffActive(id: string, active: boolean) {
  supabase()
    .from("staff")
    .update({ active })
    .eq("id", id)
    .then(({ error }) => error && logErr("setStaffActive")(error));
}

export function cloudAddTimeBlock(businessId: string, b: TimeBlock) {
  supabase()
    .from("time_blocks")
    .insert({
      id: b.id,
      business_id: businessId,
      staff_id: b.staffId,
      starts_at: toUTC(b.startsAt),
      ends_at: toUTC(b.endsAt),
      reason: b.reason,
    })
    .then(({ error }) => error && logErr("addTimeBlock")(error));
}

export function cloudRemoveTimeBlock(id: string) {
  supabase()
    .from("time_blocks")
    .delete()
    .eq("id", id)
    .then(({ error }) => error && logErr("removeTimeBlock")(error));
}

export function cloudAddService(
  businessId: string,
  s: Service,
  staffIds: string[]
) {
  const sb = supabase();
  sb.from("services")
    .insert({
      id: s.id,
      business_id: businessId,
      category_id: s.categoryId,
      name: s.name,
      description: s.description,
      duration_min: s.durationMin,
      buffer_before_min: s.bufferBeforeMin,
      buffer_after_min: s.bufferAfterMin,
      price_clp: s.priceClp,
      visible_online: s.visibleOnline,
      active: s.active,
      sort_order: s.sortOrder,
    })
    .then(({ error }) => {
      if (error) return logErr("addService")(error);
      if (staffIds.length > 0) {
        sb.from("staff_services")
          .insert(staffIds.map((sid) => ({ staff_id: sid, service_id: s.id })))
          .then(({ error: e }) => e && logErr("addServiceStaff")(e));
      }
    });
}

export function cloudSetServiceActive(
  id: string,
  active: boolean,
  visibleOnline: boolean
) {
  supabase()
    .from("services")
    .update({ active, visible_online: visibleOnline })
    .eq("id", id)
    .then(({ error }) => error && logErr("setServiceActive")(error));
}
