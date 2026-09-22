import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        storage: {
          getItem: (key: string) => {
            try {
              return JSON.parse(localStorage.getItem(key) ?? 'null');
            } catch {
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            localStorage.setItem(key, JSON.stringify(value));
          },
          removeItem: (key: string) => {
            localStorage.removeItem(key);
          },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
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

  getSupabaseClient() {
    return this.supabase;
  }
}