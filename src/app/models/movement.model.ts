export interface Movement {
  id?: string;
  created_at?: string;
  concepto: string;
  fecha: string;
  importe: number;
  descripcion?: string | null;
  categoria_id?: string | null;
  cuenta_id?: number | null;
  user_id?: string;
  categorias?: { nombre: string; color?: string };
  cuentas?: { nombre: string; color?: string };
  conciliado?: boolean;
  conciliaciones?: {
    id?: string;
    gasto_id: string;
    ingreso_id: string;
    contraparte_id?: string;
    contraparte_concepto?: string;
    contraparte_importe?: number;
  }[];
}
