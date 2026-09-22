-- Migración: Conciliaciones (vincular ingresos con gastos para anularlos)
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS conciliaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gasto_id uuid NOT NULL REFERENCES movimientos(id) ON DELETE CASCADE,
  ingreso_id uuid NOT NULL REFERENCES movimientos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (gasto_id, ingreso_id)
);

CREATE INDEX IF NOT EXISTS idx_conciliaciones_gasto ON conciliaciones(gasto_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_ingreso ON conciliaciones(ingreso_id);

ALTER TABLE conciliaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios gestionan sus conciliaciones" ON conciliaciones;
CREATE POLICY "Usuarios gestionan sus conciliaciones" ON conciliaciones
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
