-- Migración completa: Cuentas compartidas (visibilidad + categorías)
-- Ejecutar en el SQL Editor de Supabase

-- 0. Columna propietario_email en cuentas_compartidas (por si no existe)
ALTER TABLE cuentas_compartidas
ADD COLUMN IF NOT EXISTS propietario_email text;

-- Backfill opcional de invitaciones ya existentes
UPDATE cuentas_compartidas cc
SET propietario_email = (SELECT email FROM auth.users WHERE id = cc.propietario_id)
WHERE cc.propietario_email IS NULL;

-- 1. Categorías: los invitados ven las categorías del propietario de cuentas compartidas
DROP POLICY IF EXISTS "Invitados ven categorias de cuentas compartidas" ON categorias;
CREATE POLICY "Invitados ven categorias de cuentas compartidas" ON categorias
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT propietario_id FROM cuentas_compartidas
      WHERE invitado_id = auth.uid() AND estado = 'aceptado'
    )
  );

-- 2. Cuentas: los invitados ven las cuentas compartidas
DROP POLICY IF EXISTS "Invitados ven cuentas compartidas" ON cuentas;
CREATE POLICY "Invitados ven cuentas compartidas" ON cuentas
  FOR SELECT USING (
    id IN (
      SELECT cuenta_id FROM cuentas_compartidas
      WHERE invitado_id = auth.uid() AND estado = 'aceptado'
    )
  );

-- 3. Movimientos: los invitados ven los movimientos de las cuentas compartidas
DROP POLICY IF EXISTS "Invitados ven movimientos de cuentas compartidas" ON movimientos;
CREATE POLICY "Invitados ven movimientos de cuentas compartidas" ON movimientos
  FOR SELECT USING (
    cuenta_id IN (
      SELECT cuenta_id FROM cuentas_compartidas
      WHERE invitado_id = auth.uid() AND estado = 'aceptado'
    )
  );

-- 4. cuentas_compartidas: los invitados ven sus invitaciones aceptadas por user_id
DROP POLICY IF EXISTS "Invitados ven sus invitaciones aceptadas" ON cuentas_compartidas;
CREATE POLICY "Invitados ven sus invitaciones aceptadas" ON cuentas_compartidas
  FOR SELECT USING (invitado_id = auth.uid());

-- 5. Función segura que devuelve las cuentas compartidas del usuario (evita problemas de RLS)
CREATE OR REPLACE FUNCTION get_cuentas_compartidas()
RETURNS TABLE (
  id bigint,
  nombre text,
  tipo text,
  color text,
  user_id uuid,
  created_at timestamptz,
  propietario_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.nombre, c.tipo, c.color, c.user_id, c.created_at, cc.propietario_email
  FROM cuentas c
  INNER JOIN cuentas_compartidas cc ON cc.cuenta_id = c.id
  WHERE cc.invitado_id = auth.uid() AND cc.estado = 'aceptado';
$$;

GRANT EXECUTE ON FUNCTION get_cuentas_compartidas() TO authenticated;
