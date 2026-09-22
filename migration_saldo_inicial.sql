-- Migración: Saldo inicial por cuenta
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS saldo_inicial numeric DEFAULT 0;

-- Actualizar la función de cuentas compartidas para incluir saldo_inicial
DROP FUNCTION IF EXISTS get_cuentas_compartidas();
CREATE OR REPLACE FUNCTION get_cuentas_compartidas()
RETURNS TABLE (
  id bigint,
  nombre text,
  tipo text,
  color text,
  user_id uuid,
  created_at timestamptz,
  saldo_inicial numeric,
  propietario_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.nombre, c.tipo, c.color, c.user_id, c.created_at, c.saldo_inicial, cc.propietario_email
  FROM cuentas c
  INNER JOIN cuentas_compartidas cc ON cc.cuenta_id = c.id
  WHERE cc.invitado_id = auth.uid() AND cc.estado = 'aceptado';
$$;

GRANT EXECUTE ON FUNCTION get_cuentas_compartidas() TO authenticated;
