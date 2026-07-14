-- ============================================================
-- Azenda — Logo del negocio visible en la página pública
-- Ejecutar DESPUÉS de 0001–0005.
--
-- La migración 0005 restringió el SELECT anónimo de businesses a columnas
-- específicas (sin logo_url). El mini-sitio de reservas necesita mostrar el
-- logo, así que se agrega logo_url a las columnas legibles por anon.
-- (Los grants de columna son aditivos.)
-- ============================================================

grant select (logo_url) on businesses to anon;
