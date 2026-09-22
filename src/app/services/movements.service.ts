import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Movement } from '../models/movement.model';

@Injectable({ providedIn: 'root' })
export class MovementsService {
  constructor(private authService: AuthService) {}

  async getAll(cuentaIds?: number[] | null) {
    let query = this.authService.getSupabaseClient()
      .from('movimientos')
      .select('*, categorias(nombre, color), cuentas(nombre, color)')
      .order('fecha', { ascending: false });

    if (cuentaIds && cuentaIds.length === 1) {
      query = query.eq('cuenta_id', cuentaIds[0]);
    } else if (cuentaIds && cuentaIds.length > 1) {
      query = query.in('cuenta_id', cuentaIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Movement[];
  }

  async create(movement: Partial<Movement>) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('movimientos').insert([{ ...movement, user_id: user?.id }]);
    if (error) throw error;
  }

  async update(id: string, payload: Partial<Movement>) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('movimientos').update(payload).eq('id', id).eq('user_id', user?.id);
    if (error) throw error;
  }

  async delete(id: string) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('movimientos').delete().eq('id', id).eq('user_id', user?.id);
    if (error) throw error;
  }

  async updateDescripcion(id: string, descripcion: string) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('movimientos').update({ descripcion }).eq('id', id).eq('user_id', user?.id);
    if (error) throw error;
  }

  async clearCategory(categoriaId: string) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('movimientos')
      .update({ categoria_id: null })
      .eq('user_id', user?.id)
      .eq('categoria_id', categoriaId);
    if (error) throw error;
  }

  async updateCategoriaByConcept(cuentaId: number, concepto: string, categoriaId: string | null) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('movimientos')
      .update({ categoria_id: categoriaId })
      .eq('user_id', user?.id)
      .eq('cuenta_id', cuentaId)
      .ilike('concepto', `%${concepto}%`);
    if (error) throw error;
  }
}
