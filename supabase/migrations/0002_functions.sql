-- ============================================================
-- Azenda — Funciones de apoyo para registro y reservas públicas
-- Ejecutar DESPUÉS de 0001_schema.sql.
-- ============================================================

-- Crea el negocio del usuario recién registrado y su membresía de dueño.
-- Necesaria porque un usuario sin membresía no pasa el RLS para insertar
-- en businesses (huevo y gallina).
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
  if exists (select 1 from businesses where slug = p_slug) then
    raise exception 'SLUG_TAKEN';
  end if;
  insert into businesses (name, slug, vertical, description, phone, address)
  values (p_name, p_slug, p_vertical, p_description, p_phone, p_address)
  returning id into v_id;

  insert into memberships (user_id, business_id, role)
  values (auth.uid(), v_id, 'owner');

  return v_id;
end;
$$;

-- Intervalos ocupados de un negocio (citas activas con buffers + bloqueos),
-- SIN datos de clientes: es lo único que el mini-sitio público necesita
-- para calcular disponibilidad sin exponer la agenda.
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
    and a.status in ('pendiente', 'confirmada', 'atendida')
    and ai.starts_at < p_to
    and ai.starts_at > p_from - interval '1 day'
  union all
  select tb.staff_id, tb.starts_at, tb.ends_at
  from time_blocks tb
  where tb.business_id = p_business_id
    and tb.starts_at < p_to
    and tb.ends_at > p_from;
$$;

grant execute on function create_business to authenticated;
grant execute on function get_busy_intervals to anon, authenticated;
grant execute on function book_appointment to anon, authenticated;
