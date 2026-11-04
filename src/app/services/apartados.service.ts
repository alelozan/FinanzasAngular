import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Apartado, ApartadoCategoria } from '../models/apartado.model';

@Injectable({ providedIn: 'root' })
export class ApartadosService {
  constructor(private authService: AuthService) {}

  async getAll(): Promise<Apartado[]> {
    const user = await this.authService.getCurrentUser();
    const { data } = await this.authService.getSupabaseClient()
      .from('apartados').select('*').eq('user_id', user?.id)
      .order('orden').order('nombre');
    return data || [];
  }

  async getVinculos(): Promise<ApartadoCategoria[]> {
    const user = await this.authService.getCurrentUser();
    const { data } = await this.authService.getSupabaseClient()
      .from('apartado_categoria').select('*').eq('user_id', user?.id);
    return data || [];
  }

  async create(payload: Partial<Apartado>) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('apartados').insert({ ...payload, user_id: user?.id });
    if (error) throw error;
  }

  async update(id: string, payload: Partial<Apartado>) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('apartados').update(payload).eq('id', id).eq('user_id', user?.id);
    if (error) throw error;
  }

  async delete(id: string) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('apartados').delete().eq('id', id).eq('user_id', user?.id);
    if (error) throw error;
  }

  async asignarCategoria(cuentaId: number, categoriaId: string, apartadoId: string | null) {
    const user = await this.authService.getCurrentUser();
    const client = this.authService.getSupabaseClient();

    const { error: delErr } = await client
      .from('apartado_categoria').delete()
      .eq('user_id', user?.id)
      .eq('cuenta_id', cuentaId)
      .eq('categoria_id', categoriaId);
    if (delErr) throw delErr;

    if (!apartadoId) return;

    const { error } = await client.from('apartado_categoria').insert({
      cuenta_id: cuentaId,
      categoria_id: categoriaId,
      apartado_id: apartadoId,
      user_id: user?.id
    });
    if (error) throw error;
  }
}
