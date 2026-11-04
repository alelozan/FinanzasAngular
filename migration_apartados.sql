-- Migración: Apartados de presupuesto por cuenta + vínculo categoría→apartado
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS apartados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id bigint NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  color text DEFAULT '#0ea5e9',
  importe numeric NOT NULL DEFAULT 0,
  orden int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_apartados_cuenta ON apartados(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_apartados_user ON apartados(user_id);

CREATE TABLE IF NOT EXISTS apartado_categoria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id bigint NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  categoria_id uuid NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  apartado_id uuid NOT NULL REFERENCES apartados(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (cuenta_id, categoria_id)
);

CREATE INDEX IF NOT EXISTS idx_apartado_categoria_cuenta ON apartado_categoria(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_apartado_categoria_apartado ON apartado_categoria(apartado_id);

ALTER TABLE apartados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios gestionan sus apartados" ON apartados;
CREATE POLICY "Usuarios gestionan sus apartados" ON apartados
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE apartado_categoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios gestionan sus vinculos apartado-categoria" ON apartado_categoria;
CREATE POLICY "Usuarios gestionan sus vinculos apartado-categoria" ON apartado_categoria
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
