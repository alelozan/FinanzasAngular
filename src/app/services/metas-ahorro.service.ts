import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { MetaAhorro } from '../models/meta-ahorro.model';

@Injectable({ providedIn: 'root' })
export class MetasAhorroService {
  constructor(private authService: AuthService) {}

  async getAll(): Promise<MetaAhorro[]> {
    const user = await this.authService.getCurrentUser();
    const { data } = await this.authService.getSupabaseClient()
      .from('metas_ahorro').select('*').eq('user_id', user?.id).order('nombre');
    return data || [];
  }

  async create(payload: Partial<MetaAhorro>) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('metas_ahorro').insert({ ...payload, user_id: user?.id });
    if (error) throw error;
  }

  async update(id: string, payload: Partial<MetaAhorro>) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('metas_ahorro').update(payload).eq('id', id).eq('user_id', user?.id);
    if (error) throw error;
  }

  async delete(id: string) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('metas_ahorro').delete().eq('id', id).eq('user_id', user?.id);
    if (error) throw error;
  }
}
