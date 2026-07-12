-- ============================================================
-- Azenda — Blindaje de seguridad
-- Ejecutar DESPUÉS de 0001 y 0002.
--
-- Corrige:
--  1) CRÍTICO: un miembro podía UPDATE businesses.plan_status='active'
--     vía API y saltarse el pago → grants por columna.
--  2) ALTO: book_appointment no validaba tenancy (servicio/profesional
--     de OTRO negocio), estado activo/visible, anticipación, turnos,
--     bloqueos, ni que el negocio esté al día → reescrita completa.
--  3) MEDIO: cuentas suspendidas/vencidas podían seguir escribiendo
--     por API → escrituras exigen negocio activo (is_active_member).
--  4) MEDIO: create_business sin límites (N negocios por usuario,
--     slugs reservados, longitudes) → validado.
--  5) BAJO: get_busy_intervals sin tope de rango → 120 días máx.
--  6) Integridad cross-tenant en appointment_items → trigger.
-- ============================================================

-- ---------- 1. Proteger columnas del modelo de cobro ----------
-- Nadie con la anon key (ni autenticado) puede tocar plan_status,
-- trial_ends_at, slug ni id: solo las columnas operativas del negocio.

revoke insert, update, delete on businesses from anon, authenticated;
grant update (
  name, description, phone, address, timezone, logo_url, accent_color,
  online_booking_enabled, requires_approval, min_lead_minutes,
  max_lead_days, cancellation_hours, slot_granularity_min
) on businesses to authenticated;

drop policy "members manage businesses" on businesses;
create policy "members update business" on businesses
  for update using (is_member(id)) with check (is_member(id));

-- ---------- 2. Escrituras solo con cuenta al día ----------

create or replace function is_active_member(b_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from memberships m
    join businesses b on b.id = m.business_id
    where m.business_id = b_id
      and m.user_id = auth.uid()
      and (
        b.plan_status = 'active'
        or (b.plan_status = 'trial' and b.trial_ends_at > now())
      )
  );
$$;

-- Reemplaza las políticas FOR ALL por lectura (miembro) + escritura
-- (miembro con cuenta activa) en todas las tablas operativas.

-- staff
drop policy "members manage staff" on staff;
create policy "members read staff" on staff
  for select using (is_member(business_id));
create policy "active write staff" on staff
  for insert with check (is_active_member(business_id));
create policy "active update staff" on staff
  for update using (is_active_member(business_id)) with check (is_active_member(business_id));
create policy "active delete staff" on staff
  for delete using (is_active_member(business_id));

-- staff_schedules
drop policy "members manage schedules" on staff_schedules;
create policy "active write schedules" on staff_schedules
  for insert with check (is_active_member(business_id));
create policy "active update schedules" on staff_schedules
  for update using (is_active_member(business_id)) with check (is_active_member(business_id));
create policy "active delete schedules" on staff_schedules
  for delete using (is_active_member(business_id));

-- schedule_overrides
drop policy "members manage overrides" on schedule_overrides;
create policy "active write overrides" on schedule_overrides
  for insert with check (is_active_member(business_id));
create policy "active update overrides" on schedule_overrides
  for update using (is_active_member(business_id)) with check (is_active_member(business_id));
create policy "active delete overrides" on schedule_overrides
  for delete using (is_active_member(business_id));

-- time_blocks
drop policy "members manage blocks" on time_blocks;
create policy "members read blocks" on time_blocks
  for select using (is_member(business_id));
create policy "active write blocks" on time_blocks
  for insert with check (is_active_member(business_id));
create policy "active update blocks" on time_blocks
  for update using (is_active_member(business_id)) with check (is_active_member(business_id));
create policy "active delete blocks" on time_blocks
  for delete using (is_active_member(business_id));

-- service_categories
drop policy "members manage categories" on service_categories;
create policy "active write categories" on service_categories
  for insert with check (is_active_member(business_id));
create policy "active update categories" on service_categories
  for update using (is_active_member(business_id)) with check (is_active_member(business_id));
create policy "active delete categories" on service_categories
  for delete using (is_active_member(business_id));

-- services
drop policy "members manage services" on services;
create policy "active write services" on services
  for insert with check (is_active_member(business_id));
create policy "active update services" on services
  for update using (is_active_member(business_id)) with check (is_active_member(business_id));
create policy "active delete services" on services
  for delete using (is_active_member(business_id));

-- staff_services (sin business_id: se valida vía staff)
drop policy "members manage staff_services" on staff_services;
create policy "active write staff_services" on staff_services
  for insert with check (
    exists (select 1 from staff s where s.id = staff_id and is_active_member(s.business_id))
  );
create policy "active delete staff_services" on staff_services
  for delete using (
    exists (select 1 from staff s where s.id = staff_id and is_active_member(s.business_id))
  );

-- clients
drop policy "members manage clients" on clients;
create policy "members read clients" on clients
  for select using (is_member(business_id));
create policy "active write clients" on clients
  for insert with check (is_active_member(business_id));
create policy "active update clients" on clients
  for update using (is_active_member(business_id)) with check (is_active_member(business_id));

-- appointments
drop policy "members manage appointments" on appointments;
create policy "members read appointments" on appointments
  for select using (is_member(business_id));
create policy "active write appointments" on appointments
  for insert with check (is_active_member(business_id));
create policy "active update appointments" on appointments
  for update using (is_active_member(business_id)) with check (is_active_member(business_id));

-- appointment_items
drop policy "members manage items" on appointment_items;
create policy "members read items" on appointment_items
  for select using (is_member(business_id));
create policy "active write items" on appointment_items
  for insert with check (is_active_member(business_id));
create policy "active update items" on appointment_items
  for update using (is_active_member(business_id)) with check (is_active_member(business_id));

-- ---------- 3. Integridad cross-tenant en ítems ----------
-- Impide insertar ítems cuyo servicio, profesional o cita pertenezcan
-- a otro negocio (aunque el RLS de fila pase).

create or replace function check_item_integrity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from staff where id = new.staff_id and business_id = new.business_id) then
    raise exception 'INTEGRITY_STAFF';
  end if;
  if not exists (select 1 from services where id = new.service_id and business_id = new.business_id) then
    raise exception 'INTEGRITY_SERVICE';
  end if;
  if not exists (select 1 from appointments where id = new.appointment_id and business_id = new.business_id) then
    raise exception 'INTEGRITY_APPOINTMENT';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_item_integrity on appointment_items;
create trigger trg_item_integrity
  before insert or update on appointment_items
  for each row execute function check_item_integrity();

-- ---------- 4. book_appointment blindada ----------
-- Valida: negocio activo y con reservas online habilitadas; formato y
-- largo de los datos del cliente; que cada servicio y profesional
-- pertenezcan al negocio, estén activos y visibles, y que el profesional
-- realice ese servicio; anticipación mín/máx; dentro del turno;
-- sin choque con citas NI bloqueos; anti-spam (tope por cliente y
-- tope de reservas online por negocio cada 10 minutos).

create or replace function book_appointment(
  p_business_id uuid,
  p_client_name text,
  p_client_email text,
  p_client_phone text,
  p_client_note text,
  p_items jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_biz businesses%rowtype;
  v_client_id uuid;
  v_appt_id uuid;
  v_item jsonb;
  v_service services%rowtype;
  v_staff staff%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_local_start timestamp;
  v_local_end timestamp;
  v_min timestamptz := null;
  v_max timestamptz := null;
  v_total int := 0;
begin
  select * into v_biz from businesses where id = p_business_id;
  if v_biz.id is null then
    raise exception 'NOT_FOUND';
  end if;
  if not v_biz.online_booking_enabled
     or not (v_biz.plan_status = 'active'
             or (v_biz.plan_status = 'trial' and v_biz.trial_ends_at > now())) then
    raise exception 'BOOKING_PAUSED';
  end if;

  -- Validación de datos del cliente
  if p_client_name is null or length(btrim(p_client_name)) < 2 or length(p_client_name) > 80 then
    raise exception 'INVALID_INPUT';
  end if;
  if p_client_email is null or p_client_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or length(p_client_email) > 120 then
    raise exception 'INVALID_INPUT';
  end if;
  if length(coalesce(p_client_phone, '')) > 30 or length(coalesce(p_client_note, '')) > 500 then
    raise exception 'INVALID_INPUT';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 6 then
    raise exception 'INVALID_INPUT';
  end if;

  -- Anti-spam por negocio: máx 20 reservas online cada 10 minutos
  if (select count(*) from appointments
      where business_id = p_business_id and origin = 'online'
        and created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'BOOKING_RATE';
  end if;

  -- Cliente: buscar por email (normalizado) o crear
  select id into v_client_id from clients
  where business_id = p_business_id and lower(email) = lower(btrim(p_client_email));
  if v_client_id is null then
    insert into clients (business_id, name, email, phone)
    values (p_business_id, btrim(p_client_name), lower(btrim(p_client_email)), btrim(p_client_phone))
    returning id into v_client_id;
  end if;

  -- Anti-spam por cliente: máx 3 citas futuras activas en este negocio
  if (select count(*) from appointments
      where business_id = p_business_id and client_id = v_client_id
        and status in ('pendiente', 'confirmada') and starts_at > now()) >= 3 then
    raise exception 'BOOKING_LIMIT';
  end if;

  -- Lock por profesional para serializar reservas concurrentes
  for v_item in select * from jsonb_array_elements(p_items) loop
    perform pg_advisory_xact_lock(hashtext((v_item->>'staff_id')));
  end loop;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_service from services
    where id = (v_item->>'service_id')::uuid;
    select * into v_staff from staff
    where id = (v_item->>'staff_id')::uuid;

    -- Tenancy y estado: el servicio y el profesional deben ser de ESTE
    -- negocio, estar activos y ofrecerse online, y estar vinculados.
    if v_service.id is null or v_service.business_id <> p_business_id
       or not v_service.active or not v_service.visible_online then
      raise exception 'INVALID_SERVICE';
    end if;
    if v_staff.id is null or v_staff.business_id <> p_business_id
       or not v_staff.active or not v_staff.bookable_online then
      raise exception 'INVALID_STAFF';
    end if;
    if not exists (select 1 from staff_services
                   where staff_id = v_staff.id and service_id = v_service.id) then
      raise exception 'INVALID_STAFF';
    end if;

    v_start := (v_item->>'starts_at')::timestamptz;
    v_end := v_start + (v_service.duration_min || ' minutes')::interval;

    -- Políticas de anticipación del negocio
    if v_start < now() + (v_biz.min_lead_minutes || ' minutes')::interval then
      raise exception 'SLOT_TAKEN';
    end if;
    if v_start > now() + (v_biz.max_lead_days || ' days')::interval then
      raise exception 'INVALID_INPUT';
    end if;

    -- Dentro de un turno del profesional (en la zona horaria del negocio)
    v_local_start := v_start at time zone v_biz.timezone;
    v_local_end := v_end at time zone v_biz.timezone;
    if not exists (
      select 1 from staff_schedules ss
      where ss.staff_id = v_staff.id
        and ss.weekday = extract(dow from v_local_start)::int
        and v_local_start::time >= ss.start_time
        and v_local_end::time <= ss.end_time
    ) then
      raise exception 'SLOT_TAKEN';
    end if;

    -- Sin choque con citas activas (con buffers)
    if exists (
      select 1 from appointment_items ai
      join appointments a on a.id = ai.appointment_id
      join services s on s.id = ai.service_id
      where ai.staff_id = v_staff.id
        and a.status in ('pendiente', 'confirmada', 'atendida')
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

    -- Sin choque con bloqueos manuales
    if exists (
      select 1 from time_blocks tb
      where tb.staff_id = v_staff.id
        and tstzrange(tb.starts_at, tb.ends_at) && tstzrange(v_start, v_end)
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
    case when v_biz.requires_approval then 'pendiente'::appointment_status else 'confirmada' end,
    'online', v_min, v_max, v_total, nullif(btrim(coalesce(p_client_note, '')), '')
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

-- ---------- 5. create_business con límites ----------

create or replace function create_business(
  p_name text,
  p_slug text,
  p_vertical business_vertical,
  p_description text,
  p_phone text,
  p_address text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  -- Un negocio por cuenta (por ahora)
  if (select count(*) from memberships where user_id = auth.uid()) >= 1 then
    raise exception 'ALREADY_HAS_BUSINESS';
  end if;
  if p_name is null or length(btrim(p_name)) < 2 or length(p_name) > 80
     or length(coalesce(p_description, '')) > 500
     or length(coalesce(p_phone, '')) > 30
     or length(coalesce(p_address, '')) > 160 then
    raise exception 'INVALID_INPUT';
  end if;
  -- Slugs reservados por la plataforma
  if p_slug in ('app', 'demo', 'login', 'registro', 'onboarding', 'api',
                'admin', 'www', 'ayuda', 'soporte', 'precios', 'terminos',
                'privacidad', 'aura-estudio') then
    raise exception 'SLUG_TAKEN';
  end if;
  if exists (select 1 from businesses where slug = p_slug) then
    raise exception 'SLUG_TAKEN';
  end if;

  insert into businesses (name, slug, vertical, description, phone, address)
  values (btrim(p_name), p_slug, p_vertical, coalesce(p_description, ''), coalesce(p_phone, ''), coalesce(p_address, ''))
  returning id into v_id;

  insert into memberships (user_id, business_id, role)
  values (auth.uid(), v_id, 'owner');

  return v_id;
end;
$$;

-- ---------- 6. get_busy_intervals con tope de rango ----------

create or replace function get_busy_intervals(
  p_business_id uuid,
  p_from timestamptz,
  p_to timestamptz
) returns table (staff_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select
    ai.staff_id,
    ai.starts_at - (coalesce(s.buffer_before_min, 0) || ' minutes')::interval,
    ai.starts_at
      + ((ai.duration_min + coalesce(s.buffer_after_min, 0)) || ' minutes')::interval
  from appointment_items ai
  join appointments a on a.id = ai.appointment_id
  left join services s on s.id = ai.service_id
  where ai.business_id = p_business_id
    and p_to <= p_from + interval '120 days'
    and a.status in ('pendiente', 'confirmada', 'atendida')
    and ai.starts_at < p_to
    and ai.starts_at > p_from - interval '1 day'
  union all
  select tb.staff_id, tb.starts_at, tb.ends_at
  from time_blocks tb
  where tb.business_id = p_business_id
    and p_to <= p_from + interval '120 days'
    and tb.starts_at < p_to
    and tb.ends_at > p_from;
$$;

-- ---------- 7. Permisos explícitos de las funciones ----------

revoke all on function book_appointment(uuid, text, text, text, text, jsonb) from public;
grant execute on function book_appointment(uuid, text, text, text, text, jsonb) to anon, authenticated;

revoke all on function create_business(text, text, business_vertical, text, text, text) from public;
grant execute on function create_business(text, text, business_vertical, text, text, text) to authenticated;

revoke all on function get_busy_intervals(uuid, timestamptz, timestamptz) from public;
grant execute on function get_busy_intervals(uuid, timestamptz, timestamptz) to anon, authenticated;

revoke all on function is_member(uuid) from public;
grant execute on function is_member(uuid) to anon, authenticated;

revoke all on function is_active_member(uuid) from public;
grant execute on function is_active_member(uuid) to anon, authenticated;
