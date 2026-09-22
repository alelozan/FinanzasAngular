import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Conciliacion } from '../models/conciliacion.model';

@Injectable({ providedIn: 'root' })
export class ConciliacionesService {
  constructor(private authService: AuthService) {}

  async getAll(): Promise<Conciliacion[]> {
    const user = await this.authService.getCurrentUser();
    const { data } = await this.authService.getSupabaseClient()
      .from('conciliaciones').select('*').eq('user_id', user?.id);
    return data || [];
  }

  async create(gastoId: string, ingresoId: string) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('conciliaciones')
      .insert({ gasto_id: gastoId, ingreso_id: ingresoId, user_id: user?.id });
    if (error) throw error;
  }

  async delete(id: string) {
    const { error } = await this.authService.getSupabaseClient()
      .from('conciliaciones').delete().eq('id', id);
    if (error) throw error;
  }
}
