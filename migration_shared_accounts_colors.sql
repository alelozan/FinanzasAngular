-- Migración: Colores en categorías + Cuentas compartidas + Categorías globales
-- Ejecutar en el SQL Editor de Supabase

-- 1. Añadir columna color a categorías
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS color text DEFAULT '#0ea5e9';

-- 2. Tabla de cuentas compartidas
CREATE TABLE IF NOT EXISTS cuentas_compartidas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id int8 NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  propietario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitado_email text NOT NULL,
  invitado_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'rechazado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para cuentas compartidas
CREATE INDEX IF NOT EXISTS idx_cuentas_compartidas_cuenta ON cuentas_compartidas(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_compartidas_invitado ON cuentas_compartidas(invitado_email);
CREATE INDEX IF NOT EXISTS idx_cuentas_compartidas_propietario ON cuentas_compartidas(propietario_id);

-- 3. Tabla de categorías globales (predefinidas para cuentas compartidas)
CREATE TABLE IF NOT EXISTS categorias_globales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  color text DEFAULT '#0ea5e9',
  created_at timestamptz DEFAULT now()
);

-- Insertar categorías globales predefinidas
INSERT INTO categorias_globales (nombre, tipo, color) VALUES
  ('Alimentacion', 'gasto', '#f59e0b'),
  ('Transporte', 'gasto', '#3b82f6'),
  ('Ocio', 'gasto', '#8b5cf6'),
  ('Servicios', 'gasto', '#ef4444'),
  ('Salud', 'gasto', '#10b981'),
  ('Ropa', 'gasto', '#ec4899'),
  ('Hogar', 'gasto', '#f97316'),
  ('Educacion', 'gasto', '#14b8a6'),
  ('Nomina', 'ingreso', '#22c55e'),
  ('Otros Ingresos', 'ingreso', '#06b6d4'),
  ('General', 'gasto', '#64748b')
ON CONFLICT (nombre) DO NOTHING;

-- 4. RLS policies para cuentas_compartidas
ALTER TABLE cuentas_compartidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias invitaciones enviadas" ON cuentas_compartidas
  FOR SELECT USING (propietario_id = auth.uid());

CREATE POLICY "Usuarios ven invitaciones recibidas por email" ON cuentas_compartidas
  FOR SELECT USING (invitado_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Propietario puede crear invitaciones" ON cuentas_compartidas
  FOR INSERT WITH CHECK (propietario_id = auth.uid());

CREATE POLICY "Invitado puede actualizar su invitación" ON cuentas_compartidas
  FOR UPDATE USING (invitado_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 5. RLS para categorías globales (lectura para todos)
ALTER TABLE categorias_globales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer categorías globales" ON categorias_globales
  FOR SELECT USING (true);

-- 6. Función para que invitado acepte y vincule su user_id
CREATE OR REPLACE FUNCTION aceptar_invitacion(invitation_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE cuentas_compartidas
  SET estado = 'aceptado',
      invitado_id = auth.uid(),
      updated_at = now()
  WHERE id = invitation_id
    AND invitado_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND estado = 'pendiente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Vista para que cada usuario vea las cuentas a las que tiene acceso
CREATE OR REPLACE VIEW cuentas_accesibles AS
  SELECT c.* FROM cuentas c WHERE c.user_id = auth.uid()
  UNION
  SELECT c.* FROM cuentas c
  INNER JOIN cuentas_compartidas cc ON cc.cuenta_id = c.id
  WHERE cc.invitado_id = auth.uid() AND cc.estado = 'aceptado';
