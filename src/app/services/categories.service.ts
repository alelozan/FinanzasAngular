import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  constructor(private authService: AuthService) {}

  async getAll(): Promise<Category[]> {
    const user = await this.authService.getCurrentUser();
    const { data } = await this.authService.getSupabaseClient()
      .from('categorias').select('*').eq('user_id', user?.id).order('nombre');
    return data || [];
  }

  async getForUser(userId: string): Promise<Category[]> {
    if (!userId) return [];
    const { data } = await this.authService.getSupabaseClient()
      .from('categorias').select('*').eq('user_id', userId).order('nombre');
    return data || [];
  }

  async create(nombre: string, tipo?: string, color?: string) {
    const user = await this.authService.getCurrentUser();
    const existe = await this.existeNombre(nombre, user?.id);
    if (existe) throw new Error('Ya existe una categoría con ese nombre');
    const payload: any = { nombre, user_id: user?.id };
    if (tipo) payload.tipo = tipo;
    if (color) payload.color = color;
    const { error } = await this.authService.getSupabaseClient()
      .from('categorias').insert(payload);
    if (error) throw error;
  }

  async update(id: string, nombre: string, tipo?: string, color?: string) {
    const user = await this.authService.getCurrentUser();
    const existe = await this.existeNombre(nombre, user?.id, id);
    if (existe) throw new Error('Ya existe una categoría con ese nombre');
    const payload: any = { nombre };
    if (tipo) payload.tipo = tipo;
    if (color) payload.color = color;
    const { error } = await this.authService.getSupabaseClient()
      .from('categorias').update(payload).eq('id', id);
    if (error) throw error;
  }

  private async existeNombre(nombre: string, userId?: string, excludeId?: string): Promise<boolean> {
    if (!userId) return false;
    let query = this.authService.getSupabaseClient()
      .from('categorias')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .ilike('nombre', nombre);
    if (excludeId) query = query.neq('id', excludeId);
    const { count } = await query;
    return (count ?? 0) > 0;
  }

  async delete(id: string) {
    const { error } = await this.authService.getSupabaseClient()
      .from('categorias').delete().eq('id', id);
    if (error) throw error;
  }
}
