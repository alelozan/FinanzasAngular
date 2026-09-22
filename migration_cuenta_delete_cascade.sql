-- Migración: Al eliminar una cuenta, eliminar también sus movimientos
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE movimientos DROP CONSTRAINT IF EXISTS movimientos_cuenta_id_fkey;
ALTER TABLE movimientos ADD CONSTRAINT movimientos_cuenta_id_fkey
  FOREIGN KEY (cuenta_id) REFERENCES cuentas(id) ON DELETE CASCADE;
