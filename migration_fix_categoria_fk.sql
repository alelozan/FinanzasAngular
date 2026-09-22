-- Migración: Permitir usar categorías globales en movimientos de cuentas compartidas
-- Ejecutar en el SQL Editor de Supabase
--
-- El movimiento puede apuntar a una categoría del usuario (categorias) o a una
-- categoría global (categorias_globales). Se elimina la FK para permitir ambas.

ALTER TABLE movimientos DROP CONSTRAINT IF EXISTS movimientos_categoria_id_fkey;
