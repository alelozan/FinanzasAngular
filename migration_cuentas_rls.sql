-- Migración: Permitir al propietario gestionar (CRUD) sus cuentas
-- Ejecutar en el SQL Editor de Supabase

-- Añade/asegura que el propietario pueda leer, crear, actualizar y eliminar sus cuentas
DROP POLICY IF EXISTS "Propietario gestiona sus cuentas" ON cuentas;
CREATE POLICY "Propietario gestiona sus cuentas" ON cuentas
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
