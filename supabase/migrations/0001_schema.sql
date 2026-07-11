-- ============================================================
-- Azenda — Esquema núcleo multi-tenant
-- Patrón: una sola base, business_id en cada tabla + RLS.
-- Aplicar en Supabase: SQL Editor o `supabase db push`.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type business_vertical as enum (
  'peluqueria', 'barberia', 'spa_estetica', 'clinica_salud',
  'psicologia', 'fitness', 'generico'
);

create type appointment_status as enum (
  'pendiente',    -- requiere aprobación del negocio
  'confirmada',
  'atendida',     -- cliente llegó / en curso
  'completada',   -- finalizada y cobrada
  'cancelada',
  'no_show'
);

create type appointment_origin as enum ('online', 'manual');

create type member_role as enum ('owner', 'admin', 'staff');

-- ---------- Tenancy ----------
create table businesses (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  name          text not null,
  vertical      business_vertical not null default 'generico',
  description   text,
  phone         text,
  address       text,
  timezone      text not null default 'America/Santiago',
  logo_url      text,
  accent_color  text,                          -- hex opcional, hereda el del sistema
  -- Políticas de reserva online
  online_booking_enabled  boolean not null default true,
  requires_approval       boolean not null default false,
  -- Modelo de acceso: prueba de 7 días → activación manual tras pago
  -- por transferencia (plan_status se cambia a mano en el Table Editor).
  plan_status             text not null default 'trial'
                          check (plan_status in ('trial', 'active', 'suspended')),
  trial_ends_at           timestamptz not null default (now() + interval '7 days'),
  min_lead_minutes        int not null default 60,      -- anticipación mínima
  max_lead_days           int not null default 60,      -- ventana máxima
  cancellation_hours      int not null default 24,      -- límite para cancelar
  slot_granularity_min    int not null default 15,      -- grilla de slots
  created_at    timestamptz not null default now()
);

create table memberships (
  user_id     uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  role        member_role not null default 'staff',
  primary key (user_id, business_id)
);

-- ---------- Recursos del negocio ----------
create table staff (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id     uuid references auth.users(id),   -- opcional: staff con acceso
  name        text not null,
  title       text,                             -- "Estilista senior"
  photo_url   text,
  color       text,                             -- color en el calendario
  bookable_online boolean not null default true,
  active      boolean not null default true,
  sort_order  int not null default 0
);

-- Turnos recurrentes por día de semana (0=domingo … 6=sábado)
create table staff_schedules (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  staff_id    uuid not null references staff(id) on delete cascade,
  weekday     int not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  check (start_time < end_time)
);

-- Excepciones puntuales: vacaciones, día extra, cambio de horario
create table schedule_overrides (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  staff_id    uuid not null references staff(id) on delete cascade,
  date        date not null,
  is_off      boolean not null default true,    -- true: no trabaja ese día
  start_time  time,                             -- si trabaja en horario especial
  end_time    time
);

-- Bloqueos manuales dentro del día (almuerzo, trámite)
create table time_blocks (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  staff_id    uuid not null references staff(id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  check (starts_at < ends_at)
);

create table service_categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0
);

create table services (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  category_id   uuid references service_categories(id) on delete set null,
  name          text not null,
  description   text,
  duration_min  int not null check (duration_min > 0),
  buffer_before_min int not null default 0,
  buffer_after_min  int not null default 0,
  price_clp     int not null default 0,         -- entero: CLP sin decimales
  deposit_pct   int not null default 0 check (deposit_pct between 0 and 100),
  visible_online boolean not null default true,
  active        boolean not null default true,
  sort_order    int not null default 0
);

-- Qué profesional realiza qué servicio
create table staff_services (
  staff_id   uuid not null references staff(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- ---------- Clientes ----------
create table clients (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  birthday    date,
  notes       text,
  record      jsonb not null default '{}',      -- ficha por rubro (clínica, técnica…)
  created_at  timestamptz not null default now(),
  unique (business_id, email)
);

-- ---------- Citas ----------
create table appointments (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete restrict,
  status      appointment_status not null default 'confirmada',
  origin      appointment_origin not null default 'manual',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  total_clp   int not null default 0,
  client_note text,
  internal_note text,
  rescheduled_from uuid references appointments(id),
  created_at  timestamptz not null default now(),
  check (starts_at < ends_at)
);

-- Ítems: una cita puede tener varios servicios, cada uno con su profesional
create table appointment_items (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  business_id    uuid not null references businesses(id) on delete cascade,
  service_id     uuid not null references services(id) on delete restrict,
  staff_id       uuid not null references staff(id) on delete restrict,
  starts_at      timestamptz not null,
  duration_min   int not null,
  price_clp      int not null default 0
);

-- ---------- Índices ----------
create index idx_appointments_business_time on appointments (business_id, starts_at);
create index idx_items_staff_time on appointment_items (staff_id, starts_at);
create index idx_clients_business on clients (business_id);
create index idx_services_business on services (business_id);
create index idx_staff_business on staff (business_id);

-- ============================================================
-- Row Level Security — aislamiento por negocio
-- ============================================================

create or replace function is_member(b_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where business_id = b_id and user_id = auth.uid()
  );
$$;

alter table businesses         enable row level security;
alter table memberships        enable row level security;
alter table staff              enable row level security;
alter table staff_schedules    enable row level security;
alter table schedule_overrides enable row level security;
alter table time_blocks        enable row level security;
alter table service_categories enable row level security;
alter table services           enable row level security;
alter table staff_services     enable row level security;
alter table clients            enable row level security;
alter table appointments       enable row level security;
alter table appointment_items  enable row level security;

-- Lectura pública de lo necesario para el mini-sitio de reservas
create policy "public read businesses" on businesses
  for select using (online_booking_enabled = true or is_member(id));
create policy "public read staff" on staff
  for select using (bookable_online = true or is_member(business_id));
create policy "public read schedules" on staff_schedules
  for select using (true);
create policy "public read overrides" on schedule_overrides
  for select using (true);
create policy "public read categories" on service_categories
  for select using (true);
create policy "public read services" on services
  for select using (visible_online = true or is_member(business_id));
create policy "public read staff_services" on staff_services
  for select using (true);

-- Escritura solo miembros del negocio
create policy "members manage businesses" on businesses
  for all using (is_member(id)) with check (is_member(id));
create policy "members manage staff" on staff
  for all using (is_member(business_id)) with check (is_member(business_id));
create policy "members manage schedules" on staff_schedules
  for all using (is_member(business_id)) with check (is_member(business_id));
create policy "members manage overrides" on schedule_overrides
  for all using (is_member(business_id)) with check (is_member(business_id));
create policy "members manage blocks" on time_blocks
  for all using (is_member(business_id)) with check (is_member(business_id));
create policy "members manage categories" on service_categories
  for all using (is_member(business_id)) with check (is_member(business_id));
create policy "members manage services" on services
  for all using (is_member(business_id)) with check (is_member(business_id));
create policy "members manage staff_services" on staff_services
  for all using (exists (select 1 from staff s where s.id = staff_id and is_member(s.business_id)))
  with check (exists (select 1 from staff s where s.id = staff_id and is_member(s.business_id)));
create policy "members manage clients" on clients
  for all using (is_member(business_id)) with check (is_member(business_id));
create policy "members manage appointments" on appointments
  for all using (is_member(business_id)) with check (is_member(business_id));
create policy "members manage items" on appointment_items
  for all using (is_member(business_id)) with check (is_member(business_id));
create policy "own memberships" on memberships
  for select using (user_id = auth.uid());

-- ============================================================
-- Reserva transaccional anti doble-booking
-- El mini-sitio público reserva SIEMPRE a través de esta función
-- (security definer), nunca insertando directo en appointments.
-- ============================================================

create or replace function book_appointment(
  p_business_id uuid,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_client_note text,
  p_items jsonb   -- [{service_id, staff_id, starts_at}]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_client_id uuid;
  v_appt_id uuid;
  v_item jsonb;
  v_service services%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_min timestamptz := null;
  v_max timestamptz := null;
  v_total int := 0;
  v_requires_approval boolean;
begin
  select requires_approval into v_requires_approval
  from businesses where id = p_business_id;

  -- Cliente: buscar por email o crear
  select id into v_client_id from clients
  where business_id = p_business_id and email = p_client_email;
  if v_client_id is null then
    insert into clients (business_id, name, email, phone)
    values (p_business_id, p_client_name, p_client_email, p_client_phone)
    returning id into v_client_id;
  end if;

  -- Lock por profesional para serializar reservas concurrentes
  for v_item in select * from jsonb_array_elements(p_items) loop
    perform pg_advisory_xact_lock(hashtext((v_item->>'staff_id')));
  end loop;

  -- Validar solapamientos con buffers
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_service from services where id = (v_item->>'service_id')::uuid;
    v_start := (v_item->>'starts_at')::timestamptz;
    v_end   := v_start + (v_service.duration_min || ' minutes')::interval;

    if exists (
      select 1 from appointment_items ai
      join appointments a on a.id = ai.appointment_id
      join services s on s.id = ai.service_id
      where ai.staff_id = (v_item->>'staff_id')::uuid
        and a.status in ('pendiente','confirmada','atendida')
        and tstzrange(
              ai.starts_at - (s.buffer_before_min || ' minutes')::interval,
              ai.starts_at + ((ai.duration_min + s.buffer_after_min) || ' minutes')::interval
            ) && tstzrange(
              v_start - (v_service.buffer_before_min || ' minutes')::interval,
              v_end + (v_service.buffer_after_min || ' minutes')::interval
            )
    ) then
      raise exception 'SLOT_TAKEN';
    end if;

    v_total := v_total + v_service.price_clp;
    v_min := least(coalesce(v_min, v_start), v_start);
    v_max := greatest(coalesce(v_max, v_end), v_end);
  end loop;

  insert into appointments (business_id, client_id, status, origin, starts_at, ends_at, total_clp, client_note)
  values (
    p_business_id, v_client_id,
    case when v_requires_approval then 'pendiente'::appointment_status else 'confirmada' end,
    'online', v_min, v_max, v_total, p_client_note
  ) returning id into v_appt_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_service from services where id = (v_item->>'service_id')::uuid;
    insert into appointment_items (appointment_id, business_id, service_id, staff_id, starts_at, duration_min, price_clp)
    values (
      v_appt_id, p_business_id,
      v_service.id, (v_item->>'staff_id')::uuid,
      (v_item->>'starts_at')::timestamptz, v_service.duration_min, v_service.price_clp
    );
  end loop;

  return v_appt_id;
end;
$$;
