-- Migración: Añadir columna propietario_email a cuentas_compartidas
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE cuentas_compartidas
ADD COLUMN IF NOT EXISTS propietario_email text;

-- Backfill opcional de invitaciones ya existentes.
-- Requiere permisos de lectura sobre auth.users; si falla por permisos,
-- las invitaciones antiguas simplemente mostrarán "otro usuario".
UPDATE cuentas_compartidas cc
SET propietario_email = (SELECT email FROM auth.users WHERE id = cc.propietario_id)
WHERE cc.propietario_email IS NULL;
