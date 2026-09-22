-- Migración: Añadir columna 'descripcion' a la tabla movimientos
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE movimientos
ADD COLUMN descripcion text DEFAULT NULL;

-- Índice opcional para búsquedas por descripción
CREATE INDEX IF NOT EXISTS idx_movimientos_descripcion
ON movimientos USING gin (descripcion gin_trgm_ops)
WHERE descripcion IS NOT NULL;

-- Si no tienes la extensión pg_trgm, ejecuta primero:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
