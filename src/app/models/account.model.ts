export interface Account {
  id?: number;
  nombre: string;
  tipo?: string;
  color?: string;
  saldo_inicial?: number;
  user_id?: string;
  created_at?: string;
  es_compartida?: boolean;
  propietario_email?: string;
}
