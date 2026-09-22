import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Account } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  constructor(private authService: AuthService) {}

  async getAll(): Promise<Account[]> {
    const user = await this.authService.getCurrentUser();
    const propias = await this.getOwn(user?.id);
    const compartidas = await this.getShared();
    return [...propias, ...compartidas];
  }

  private async getOwn(userId?: string): Promise<Account[]> {
    const { data } = await this.authService.getSupabaseClient()
      .from('cuentas').select('*').eq('user_id', userId).order('nombre');
    return (data || []).map(c => ({ ...c, es_compartida: false }));
  }

  private async getShared(): Promise<Account[]> {
    const { data } = await this.authService.getSupabaseClient()
      .rpc('get_cuentas_compartidas');
    return (data || []).map((r: any) => ({
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      color: r.color,
      saldo_inicial: r.saldo_inicial,
      user_id: r.user_id,
      created_at: r.created_at,
      es_compartida: true,
      propietario_email: r.propietario_email || null
    }));
  }

  async create(nombre: string, color?: string, saldoInicial?: number) {
    const user = await this.authService.getCurrentUser();
    const payload: any = { nombre, user_id: user?.id };
    if (color) payload.color = color;
    if (saldoInicial !== undefined && saldoInicial !== null) payload.saldo_inicial = saldoInicial;
    const { data, error } = await this.authService.getSupabaseClient()
      .from('cuentas').insert(payload).select();
    if (error) throw error;
    return data;
  }

  async update(id: number, payload: Partial<Account>) {
    const { data, error } = await this.authService.getSupabaseClient()
      .from('cuentas').update(payload).eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No se pudo actualizar la cuenta');
  }

  async delete(id: number) {
    const { error } = await this.authService.getSupabaseClient()
      .from('cuentas').delete().eq('id', id);
    if (error) throw error;
  }

  async compartirCuenta(cuentaId: number, email: string) {
    const user = await this.authService.getCurrentUser();
    const { error } = await this.authService.getSupabaseClient()
      .from('cuentas_compartidas')
      .insert({
        cuenta_id: cuentaId,
        propietario_id: user?.id,
        propietario_email: user?.email,
        invitado_email: email.toLowerCase().trim(),
        estado: 'pendiente'
      });
    if (error) throw error;
  }

  async getInvitacionesPendientes(): Promise<any[]> {
    const user = await this.authService.getCurrentUser();
    const { data } = await this.authService.getSupabaseClient()
      .from('cuentas_compartidas')
      .select('*, cuentas(nombre)')
      .eq('invitado_email', user?.email)
      .eq('estado', 'pendiente');
    return data || [];
  }

  async aceptarInvitacion(invitacionId: string) {
    const { error } = await this.authService.getSupabaseClient()
      .rpc('aceptar_invitacion', { invitation_id: invitacionId });
    if (error) throw error;
  }

  async rechazarInvitacion(invitacionId: string) {
    const { error } = await this.authService.getSupabaseClient()
      .from('cuentas_compartidas')
      .update({ estado: 'rechazado' })
      .eq('id', invitacionId);
    if (error) throw error;
  }
}
