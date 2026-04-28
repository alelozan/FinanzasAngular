import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Registro de nuevo usuario
  async signUp(email: string, pass: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email: email,
      password: pass,
    });
    if (error) throw error;
    return data;
  }

  // Iniciar sesión
  async signIn(email: string, pass: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email,
      password: pass,
    });
    if (error) throw error;
    return data;
  }

  // Obtener usuario actual
  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // En auth.service.ts
getSupabaseClient() {
  return this.supabase;
}

// Dentro de tu AuthService
async getCuentas() {
  const { data, error } = await this.supabase
    .from('cuentas')
    .select('*')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data;
}

async crearCuenta(nombre: string, tipo: string) {
  const user = await this.getCurrentUser();
  const { data, error } = await this.supabase
    .from('cuentas')
    .insert([{ nombre, tipo, user_id: user?.id }]);
  if (error) throw error;
  return data;
}
}