-- Fix: Reemplazar consultas directas a auth.users por auth.email()
-- Ejecutar en el SQL Editor de Supabase

-- 1. Eliminar políticas antiguas que usan auth.users
DROP POLICY IF EXISTS "Usuarios ven invitaciones recibidas por email" ON cuentas_compartidas;
DROP POLICY IF EXISTS "Invitado puede actualizar su invitación" ON cuentas_compartidas;

-- 2. Recrear políticas usando auth.email() (función de Supabase que no requiere acceso a auth.users)
CREATE POLICY "Usuarios ven invitaciones recibidas por email" ON cuentas_compartidas
  FOR SELECT USING (invitado_email = auth.email());

CREATE POLICY "Invitado puede actualizar su invitación" ON cuentas_compartidas
  FOR UPDATE USING (invitado_email = auth.email());

-- 3. Actualizar la función aceptar_invitacion para usar auth.email()
CREATE OR REPLACE FUNCTION aceptar_invitacion(invitation_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE cuentas_compartidas
  SET estado = 'aceptado',
      invitado_id = auth.uid(),
      updated_at = now()
  WHERE id = invitation_id
    AND invitado_email = auth.email()
    AND estado = 'pendiente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
