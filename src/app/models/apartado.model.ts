export interface Apartado {
  id?: string;
  cuenta_id: number;
  user_id?: string;
  nombre: string;
  color?: string;
  importe: number;
  orden?: number;
  created_at?: string;
}

export interface ApartadoCategoria {
  id?: string;
  cuenta_id: number;
  categoria_id: string;
  apartado_id: string;
  user_id?: string;
  created_at?: string;
}
