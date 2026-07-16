-- ============================================================
-- Buuki — Enviar solo el recordatorio (no el correo de confirmación)
-- Ejecutar DESPUÉS de 0001–0006.
--
-- Decisión de producto: el cliente ya ve la confirmación en pantalla al
-- reservar (con "agregar al calendario"), así que el correo de confirmación
-- es redundante. Se conserva SOLO el recordatorio del día antes (el que
-- reduce inasistencias) para ahorrar volumen de correos.
-- El aviso de cancelación se mantiene (evento raro y útil para el cliente).
-- ============================================================

drop trigger if exists trg_enqueue_confirmation on appointments;
drop function if exists enqueue_confirmation();
