-- Migración: Metas de ahorro por cuenta (porcentaje del ingreso mensual)
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS metas_ahorro (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id bigint NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  porcentaje numeric NOT NULL DEFAULT 0,
  fecha_inicio date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metas_ahorro_cuenta ON metas_ahorro(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_metas_ahorro_user ON metas_ahorro(user_id);

ALTER TABLE metas_ahorro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios gestionan sus metas de ahorro" ON metas_ahorro;
CREATE POLICY "Usuarios gestionan sus metas de ahorro" ON metas_ahorro
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
