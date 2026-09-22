-- Migración: Acceso de invitados a cuentas compartidas (RLS)
-- Ejecutar en el SQL Editor de Supabase

-- 1. Los invitados pueden ver las cuentas que les han compartido
DROP POLICY IF EXISTS "Invitados ven cuentas compartidas" ON cuentas;
CREATE POLICY "Invitados ven cuentas compartidas" ON cuentas
  FOR SELECT USING (
    id IN (
      SELECT cuenta_id FROM cuentas_compartidas
      WHERE invitado_id = auth.uid() AND estado = 'aceptado'
    )
  );

-- 2. Los invitados pueden ver los movimientos de las cuentas compartidas
DROP POLICY IF EXISTS "Invitados ven movimientos de cuentas compartidas" ON movimientos;
CREATE POLICY "Invitados ven movimientos de cuentas compartidas" ON movimientos
  FOR SELECT USING (
    cuenta_id IN (
      SELECT cuenta_id FROM cuentas_compartidas
      WHERE invitado_id = auth.uid() AND estado = 'aceptado'
    )
  );

-- 3. (Robustez) Los invitados ven sus invitaciones aceptadas por su user_id
DROP POLICY IF EXISTS "Invitados ven sus invitaciones aceptadas" ON cuentas_compartidas;
CREATE POLICY "Invitados ven sus invitaciones aceptadas" ON cuentas_compartidas
  FOR SELECT USING (invitado_id = auth.uid());
