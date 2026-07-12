-- ============================================================
-- Azenda — Correcciones de auditoría de producción
-- Ejecutar DESPUÉS de 0001, 0002 y 0003.
--
--  A) RBAC aplicado: el rol "staff" ya no puede modificar la
--     configuración del negocio (antes cualquier miembro podía).
--  B) Lecturas públicas acotadas: los horarios/servicios de un
--     negocio solo son públicos si ese negocio está publicable
--     (reservas online activas y cuenta al día).
--  C) Cola de notificaciones (outbox): los correos se encolan por
--     trigger y los envía un worker asíncrono — nunca en el hilo
--     de la reserva.
-- ============================================================

-- ---------- A) RBAC: configuración solo para owner/admin ----------

create or replace function is_admin_member(b_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where business_id = b_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

drop policy "members update business" on businesses;
create policy "admins update business" on businesses
  for update using (is_admin_member(id)) with check (is_admin_member(id));

revoke all on function is_admin_member(uuid) from public;
grant execute on function is_admin_member(uuid) to authenticated;

-- ---------- B) Lecturas públicas solo de negocios publicables ----------

create or replace function is_public_business(b_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from businesses b
    where b.id = b_id
      and b.online_booking_enabled
      and (b.plan_status = 'active'
           or (b.plan_status = 'trial' and b.trial_ends_at > now()))
  );
$$;

revoke all on function is_public_business(uuid) from public;
grant execute on function is_public_business(uuid) to anon, authenticated;

drop policy "public read staff" on staff;
create policy "public read staff" on staff
  for select using (
    (bookable_online and active and is_public_business(business_id))
    or is_member(business_id)
  );

drop policy "public read schedules" on staff_schedules;
create policy "public read schedules" on staff_schedules
  for select using (is_public_business(business_id) or is_member(business_id));

drop policy "public read overrides" on schedule_overrides;
create policy "public read overrides" on schedule_overrides
  for select using (is_public_business(business_id) or is_member(business_id));

drop policy "public read categories" on service_categories;
create policy "public read categories" on service_categories
  for select using (is_public_business(business_id) or is_member(business_id));

drop policy "public read services" on services;
create policy "public read services" on services
  for select using (
    (visible_online and active and is_public_business(business_id))
    or is_member(business_id)
  );

drop policy "public read staff_services" on staff_services;
create policy "public read staff_services" on staff_services
  for select using (
    exists (
      select 1 from staff s
      where s.id = staff_id
        and (is_public_business(s.business_id) or is_member(s.business_id))
    )
  );

-- ---------- C) Cola de notificaciones (outbox asíncrona) ----------

create table notification_outbox (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  appointment_id uuid not null references appointments(id) on delete cascade,
  type           text not null check (type in ('confirmation', 'reminder', 'cancellation')),
  recipient      text not null,
  status         text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts       int not null default 0,
  last_error     text,
  created_at     timestamptz not null default now(),
  sent_at        timestamptz
);

create unique index uq_outbox_appt_type on notification_outbox (appointment_id, type);
create index idx_outbox_pending on notification_outbox (status, created_at) where status = 'pending';

-- Solo el service_role (worker del servidor) toca esta tabla.
alter table notification_outbox enable row level security;
revoke all on notification_outbox from anon, authenticated;

-- Encolar confirmación al crear una cita (si el cliente tiene correo)
create or replace function enqueue_confirmation() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
begin
  select email into v_email from clients where id = new.client_id;
  if v_email is not null and position('@' in v_email) > 1 then
    insert into notification_outbox (business_id, appointment_id, type, recipient)
    values (new.business_id, new.id, 'confirmation', v_email)
    on conflict (appointment_id, type) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enqueue_confirmation on appointments;
create trigger trg_enqueue_confirmation
  after insert on appointments
  for each row execute function enqueue_confirmation();

-- Encolar aviso al cancelar
create or replace function enqueue_cancellation() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_email text;
begin
  if new.status = 'cancelada' and old.status is distinct from 'cancelada' then
    select email into v_email from clients where id = new.client_id;
    if v_email is not null and position('@' in v_email) > 1 then
      insert into notification_outbox (business_id, appointment_id, type, recipient)
      values (new.business_id, new.id, 'cancellation', v_email)
      on conflict (appointment_id, type) do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enqueue_cancellation on appointments;
create trigger trg_enqueue_cancellation
  after update of status on appointments
  for each row execute function enqueue_cancellation();
