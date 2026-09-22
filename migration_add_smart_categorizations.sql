-- Migración: Categorizaciones inteligentes por cuenta
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS categorizaciones_inteligentes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id bigint NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  categoria_id uuid,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categorizaciones_cuenta ON categorizaciones_inteligentes(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_categorizaciones_user ON categorizaciones_inteligentes(user_id);

ALTER TABLE categorizaciones_inteligentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios gestionan sus categorizaciones" ON categorizaciones_inteligentes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
