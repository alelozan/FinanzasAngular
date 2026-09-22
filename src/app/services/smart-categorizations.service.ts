import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { SmartCategorization } from '../models/smart-categorization.model';

@Injectable({ providedIn: 'root' })
export class SmartCategorizationsService {
  constructor(private authService: AuthService) {}

  async getByCuenta(cuentaId: number): Promise<SmartCategorization[]> {
    const user = await this.authService.getCurrentUser();
    const { data } = await this.authService.getSupabaseClient()
      .from('categorizaciones_inteligentes')
      .select('*')
      .eq('user_id', user?.id)
      .eq('cuenta_id', Number(cuentaId))
      .order('created_at', { ascending: true });
    return data || [];
  }

  async create(rule: Partial<SmartCategorization>) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('categorizaciones_inteligentes')
      .insert([{ ...rule, user_id: user?.id }]);
    if (error) throw error;
  }

  async update(id: string, payload: Partial<SmartCategorization>) {
    const { error } = await this.authService.getSupabaseClient()
      .from('categorizaciones_inteligentes')
      .update(payload)
      .eq('id', id);
    if (error) throw error;
  }

  async delete(id: string) {
    const { error } = await this.authService.getSupabaseClient()
      .from('categorizaciones_inteligentes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
