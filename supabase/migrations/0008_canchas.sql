-- ============================================================
-- Buuki — Nuevo rubro: canchas de fútbol (arriendo)
-- Ejecutar DESPUÉS de 0001–0007.
--
-- El modelo no cambia: una "cancha" es un recurso reservable, igual que un
-- profesional (misma tabla staff, mismos horarios, mismas reservas). Solo se
-- agrega el valor al enum de rubros; la terminología la adapta la interfaz.
-- ============================================================

alter type business_vertical add value if not exists 'canchas';
