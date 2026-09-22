import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MovementsService } from '../../services/movements.service';
import { AccountsService } from '../../services/accounts.service';
import { CategoriesService } from '../../services/categories.service';
import { ConciliacionesService } from '../../services/conciliaciones.service';
import { ToastService } from '../../services/toast.service';
import { Movement } from '../../models/movement.model';
import { Account } from '../../models/account.model';
import { Category } from '../../models/category.model';
import { Conciliacion } from '../../models/conciliacion.model';
import { FilterValues } from './filter-panel/filter-panel.component';

import { AccountSelectorComponent } from './account-selector/account-selector.component';
import { MovementFormComponent } from './movement-form/movement-form.component';
import { MovementsTableComponent } from './movements-table/movements-table.component';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { FilterPanelComponent } from './filter-panel/filter-panel.component';
import { AccountManagerComponent } from './account-manager/account-manager.component';
import { SidebarCategoriaComponent } from './sidebar-categoria/sidebar-categoria.component';

import { CsvImporterComponent } from './csv-importer/csv-importer.component';
import { MovementEditorComponent } from './movement-editor/movement-editor.component';
import { MonthlySummaryComponent } from './monthly-summary/monthly-summary.component';
import { SmartCategorizerComponent } from './smart-categorizer/smart-categorizer.component';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccountSelectorComponent,
    MovementFormComponent,
    MovementsTableComponent,
    BarChartComponent,
    PieChartComponent,
    FilterPanelComponent,
    AccountManagerComponent,
    SidebarCategoriaComponent,
    CsvImporterComponent,
    MovementEditorComponent,
    MonthlySummaryComponent,
    SmartCategorizerComponent,
    ToastComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  movimientosDB: Movement[] = [];
  movimientosFiltrados: Movement[] = [];
  categoriasDB: Category[] = [];
  categoriasPorCuenta: Map<number, Category[]> = new Map();
  categoriasFiltro: Category[] = [];
  conciliaciones: Conciliacion[] = [];
  conciliacionesSet: Set<string> = new Set();
  conciliacionesPorMovimiento: Map<string, Conciliacion[]> = new Map();
  movimientosActivos: Movement[] = [];
  cuentas: Account[] = [];
  userEmail = '';
  cuentasSeleccionadas: number[] = [];
  movimientoAEditar: Movement | null = null;
  filtros: FilterValues = { concepto: '', descripcion: '', categoriasIncluir: [], categoriasExcluir: [], tipo: '', minPrecio: null, maxPrecio: null, fechaMin: '', fechaMax: '' };
  mostrarModalPrimeraCuenta = false;
  nombrePrimeraCuenta = '';
  filtroRapido = '';
  mostrarScrollTop = false;
  mostrarModalLogout = false;
  mostrarModalInvitaciones = false;
  invitacionesPendientes: any[] = [];
  filtroCategoriaDesdeGrafico: string | null = null;

  constructor(
    private authService: AuthService,
    private movementsService: MovementsService,
    private accountsService: AccountsService,
    private categoriesService: CategoriesService,
    private conciliacionesService: ConciliacionesService,
    private toast: ToastService,
    private router: Router
  ) {}

  get saldoInicialSeleccionado(): number {
    return this.cuentas
      .filter(c => this.cuentasSeleccionadas.includes(c.id!))
      .reduce((sum, c) => sum + (Number(c.saldo_inicial) || 0), 0);
  }

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (!user) { this.router.navigate(['/login']); return; }
    this.userEmail = user.email || '';
    await this.cargarTodo();

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.mostrarScrollTop = window.scrollY > 400;
      });
    }
  }

  async cargarTodo() {
    this.cuentas = await this.accountsService.getAll();
    if (this.cuentas.length === 0) {
      this.mostrarModalPrimeraCuenta = true;
      return;
    }
    await this.cargarCategorias();
    await this.cargarConciliaciones();
    this.cuentasSeleccionadas = this.cuentas.map(c => c.id!);
    await this.cargarMovimientos();
    await this.cargarInvitaciones();
  }

  async cargarCategorias() {
    this.categoriasDB = await this.categoriesService.getAll();
    const map = new Map<number, Category[]>();
    const seen = new Map<string, Category>();
    for (const c of this.cuentas) {
      const cats = c.es_compartida
        ? await this.categoriesService.getForUser(c.user_id || '')
        : this.categoriasDB;
      map.set(c.id!, cats);
      for (const cat of cats) {
        if (cat.id && !seen.has(cat.id)) seen.set(cat.id, cat);
      }
    }
    this.categoriasPorCuenta = map;
    this.categoriasFiltro = Array.from(seen.values());
  }

  async cargarMovimientos() {
    try {
      const ids = this.cuentasSeleccionadas.length > 0 ? this.cuentasSeleccionadas : null;
      const fetched = await this.movementsService.getAll(ids);
      this.movimientosDB = this.marcarConciliaciones(fetched);
      this.aplicarFiltros();
    } catch (e: any) {
      this.movimientosDB = [];
      this.movimientosFiltrados = [];
      this.movimientosActivos = [];
      this.toast.error('Error al cargar movimientos: ' + (e?.message || ''));
    }
  }

  async cargarConciliaciones() {
    this.conciliaciones = await this.conciliacionesService.getAll();
    this.conciliacionesSet = new Set<string>();
    this.conciliacionesPorMovimiento = new Map<string, Conciliacion[]>();
    for (const c of this.conciliaciones) {
      this.conciliacionesSet.add(c.gasto_id);
      this.conciliacionesSet.add(c.ingreso_id);
      for (const id of [c.gasto_id, c.ingreso_id]) {
        if (!this.conciliacionesPorMovimiento.has(id)) this.conciliacionesPorMovimiento.set(id, []);
        this.conciliacionesPorMovimiento.get(id)!.push(c);
      }
    }
  }

  private marcarConciliaciones(list: Movement[]): Movement[] {
    const porId = new Map<string, Movement>();
    for (const m of list) {
      if (m.id) porId.set(m.id, m);
    }

    return list.map(m => {
      const conciliaciones = (this.conciliacionesPorMovimiento.get(m.id!) || []).map(c => {
        const contraparteId = c.gasto_id === m.id ? c.ingreso_id : c.gasto_id;
        const contraparte = porId.get(contraparteId);
        return {
          ...c,
          contraparte_id: contraparteId,
          contraparte_concepto: contraparte?.concepto || '',
          contraparte_importe: contraparte?.importe ?? 0
        };
      });
      return {
        ...m,
        conciliado: this.conciliacionesSet.has(m.id!),
        conciliaciones
      };
    });
  }

  async cargarInvitaciones() {
    this.invitacionesPendientes = await this.accountsService.getInvitacionesPendientes();
    if (this.invitacionesPendientes.length > 0) {
      this.mostrarModalInvitaciones = true;
    }
  }

  private aplicarFiltros() {
    const incluir = this.filtros.categoriasIncluir || [];
    const excluir = this.filtros.categoriasExcluir || [];

    this.movimientosFiltrados = this.movimientosDB.filter(m => {
      const cConcepto = m.concepto.toLowerCase().includes(this.filtros.concepto.toLowerCase());
      const cDescripcion = !this.filtros.descripcion || (m.descripcion || '').toLowerCase().includes(this.filtros.descripcion.toLowerCase());

      let cCat = true;
      if (incluir.length > 0) {
        const enLista = !!m.categoria_id && incluir.includes(m.categoria_id);
        const esSinCat = !m.categoria_id && incluir.includes('__sin_categoria__');
        cCat = enLista || esSinCat;
      }

      if (cCat && excluir.length > 0) {
        if (m.categoria_id && excluir.includes(m.categoria_id)) {
          cCat = false;
        } else if (!m.categoria_id && excluir.includes('__sin_categoria__')) {
          cCat = false;
        }
      }

      const cTipo = !this.filtros.tipo || (this.filtros.tipo === 'ingreso' ? (m.importe ?? 0) > 0 : (m.importe ?? 0) < 0);
      const cPrecioMin = !this.filtros.minPrecio || Math.abs(m.importe ?? 0) >= this.filtros.minPrecio;
      const cPrecioMax = !this.filtros.maxPrecio || Math.abs(m.importe ?? 0) <= this.filtros.maxPrecio;
      const cFechaMin = !this.filtros.fechaMin || m.fecha >= this.filtros.fechaMin;
      const cFechaMax = !this.filtros.fechaMax || m.fecha <= this.filtros.fechaMax;
      return cConcepto && cDescripcion && cCat && cTipo && cPrecioMin && cPrecioMax && cFechaMin && cFechaMax;
    });
    this.movimientosActivos = this.movimientosFiltrados.filter(m => !m.conciliado);
  }

  onCuentasSeleccionadas(ids: number[]) {
    this.cuentasSeleccionadas = ids;
    this.cargarMovimientos();
  }

  async onMovimientoGuardado(mov: Partial<Movement>) {
    await this.movementsService.create(mov);
    this.toast.success('Movimiento guardado');
    await this.cargarMovimientos();
  }

  async onCuentaCreada(event: { nombre: string; color: string; saldoInicial: number }) {
    await this.accountsService.create(event.nombre, event.color, event.saldoInicial);
    this.toast.success('Cuenta creada');
    this.cuentas = await this.accountsService.getAll();
    if (this.mostrarModalPrimeraCuenta) {
      this.mostrarModalPrimeraCuenta = false;
      this.cuentasSeleccionadas = this.cuentas.map(c => c.id!);
      await this.cargarCategorias();
      await this.cargarMovimientos();
    } else {
      this.cuentasSeleccionadas = [...this.cuentasSeleccionadas, this.cuentas[this.cuentas.length - 1].id!];
      await this.cargarCategorias();
      await this.cargarMovimientos();
    }
  }

  async onCuentaActualizada(event: { id: number; nombre: string; color: string; saldoInicial: number }) {
    try {
      await this.accountsService.update(event.id, {
        nombre: event.nombre,
        color: event.color,
        saldo_inicial: event.saldoInicial
      });
      this.toast.success('Cuenta actualizada');
      this.cuentas = await this.accountsService.getAll();
      await this.cargarCategorias();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al actualizar la cuenta');
      this.cuentas = await this.accountsService.getAll();
    }
  }

  async onCuentaEliminada(id: number) {
    try {
      await this.accountsService.delete(id);
      this.toast.info('Cuenta eliminada');
      this.cuentas = await this.accountsService.getAll();
      this.cuentasSeleccionadas = this.cuentasSeleccionadas.filter(i => i !== id);
      await this.cargarCategorias();
      await this.cargarMovimientos();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al eliminar la cuenta');
    }
  }

  async onCompartirCuenta(event: { cuentaId: number; email: string }) {
    try {
      await this.accountsService.compartirCuenta(event.cuentaId, event.email);
      this.toast.success(`Invitación enviada a ${event.email}`);
    } catch (e: any) {
      this.toast.error(e.message || 'Error al compartir cuenta');
    }
  }

  async onAceptarInvitacion(inv: any) {
    await this.accountsService.aceptarInvitacion(inv.id);
    this.toast.success('Invitación aceptada');
    this.mostrarModalInvitaciones = false;
    this.invitacionesPendientes = [];
    await this.cargarTodo();
  }

  async onRechazarInvitacion(inv: any) {
    await this.accountsService.rechazarInvitacion(inv.id);
    this.toast.info('Invitación rechazada');
    this.invitacionesPendientes = this.invitacionesPendientes.filter(i => i.id !== inv.id);
    if (this.invitacionesPendientes.length === 0) {
      this.mostrarModalInvitaciones = false;
    }
  }

  async onNuevaCategoria(event: { nombre: string; tipo: string; color: string }) {
    try {
      await this.categoriesService.create(event.nombre, event.tipo, event.color);
      this.toast.success('Categoría creada');
      await this.cargarCategorias();
      await this.cargarMovimientos();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al crear categoría');
    }
  }

  async onUpdateCategoria(event: { id: string; nombre: string; tipo: string; color: string }) {
    try {
      await this.categoriesService.update(event.id, event.nombre, event.tipo, event.color);
      this.toast.success('Categoría actualizada');
      await this.cargarCategorias();
      await this.cargarMovimientos();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al actualizar categoría');
    }
  }

  async onDeleteCategoria(id: string) {
    try {
      await this.movementsService.clearCategory(id);
      await this.categoriesService.delete(id);
      this.toast.info('Categoría eliminada');
      await this.cargarCategorias();
      await this.cargarMovimientos();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al eliminar categoría');
    }
  }

  onFiltrosChange(filtros: FilterValues) {
    this.filtros = filtros;
    if (this.filtroCategoriaDesdeGrafico) {
      const sigue = filtros.categoriasIncluir.length === 1 && filtros.categoriasIncluir[0] === this.filtroCategoriaDesdeGrafico;
      if (!sigue) {
        this.filtroCategoriaDesdeGrafico = null;
      }
    }
    this.aplicarFiltros();
  }

  onCategoriaChartClick(catId: string | null) {
    if (catId) {
      this.filtros = { ...this.filtros, categoriasIncluir: [catId], categoriasExcluir: [] };
      this.filtroCategoriaDesdeGrafico = catId;
    } else {
      this.filtros = { ...this.filtros, categoriasIncluir: [] };
      this.filtroCategoriaDesdeGrafico = null;
    }
    this.aplicarFiltros();
  }

  onMesClick(event: { fechaMin: string; fechaMax: string; label: string }) {
    this.filtros = { ...this.filtros, fechaMin: event.fechaMin, fechaMax: event.fechaMax };
    this.aplicarFiltros();
    this.toast.info(`Mostrando movimientos de ${event.label}`);
  }

  onLimpiarFiltros() {
    this.filtros = { concepto: '', descripcion: '', categoriasIncluir: [], categoriasExcluir: [], tipo: '', minPrecio: null, maxPrecio: null, fechaMin: '', fechaMax: '' };
    this.filtroRapido = '';
    this.filtroCategoriaDesdeGrafico = null;
    this.aplicarFiltros();
  }

  aplicarFiltroRapido(tipo: string) {
    const hoy = new Date();
    let fechaMin = '';
    let fechaMax = hoy.toISOString().split('T')[0];

    switch (tipo) {
      case '7d': {
        const d = new Date(hoy);
        d.setDate(d.getDate() - 7);
        fechaMin = d.toISOString().split('T')[0];
        break;
      }
      case 'semana': {
        const d = new Date(hoy);
        const dayOfWeek = d.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        d.setDate(d.getDate() - diff);
        fechaMin = d.toISOString().split('T')[0];
        break;
      }
      case 'mes': {
        fechaMin = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
      case '3m': {
        const d = new Date(hoy);
        d.setMonth(d.getMonth() - 3);
        fechaMin = d.toISOString().split('T')[0];
        break;
      }
      case 'anio': {
        fechaMin = `${hoy.getFullYear()}-01-01`;
        break;
      }
    }

    this.filtroRapido = tipo;
    this.filtros = { ...this.filtros, fechaMin, fechaMax };
    this.aplicarFiltros();
  }

  limpiarFiltroRapido() {
    this.filtroRapido = '';
    this.filtros = { ...this.filtros, fechaMin: '', fechaMax: '' };
    this.aplicarFiltros();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  solicitarLogout() {
    this.mostrarModalLogout = true;
  }

  async confirmarLogout() {
    this.mostrarModalLogout = false;
    await this.authService.getSupabaseClient().auth.signOut();
    this.router.navigate(['/login']);
  }

  onEditarMovimiento(mov: Movement) {
    this.movimientoAEditar = mov;
  }

  async onEdicionGuardada(mov: any) {
    const { id, categorias, cuentas, conciliado, conciliaciones, created_at, user_id, ...payload } = mov;
    await this.movementsService.update(id, payload);
    this.toast.success('Movimiento actualizado');
    this.movimientoAEditar = null;
    await this.cargarMovimientos();
  }

  async onMovimientoEliminado(id: string) {
    await this.movementsService.delete(id);
    this.toast.info('Movimiento eliminado');
    this.movimientoAEditar = null;
    await this.cargarMovimientos();
  }

  onCerrarEditor() {
    this.movimientoAEditar = null;
  }

  async onCambiarCategoriaMovimiento(event: { movimientoId: string; nuevaCategoriaId: string }) {
    await this.movementsService.update(event.movimientoId, {
      categoria_id: event.nuevaCategoriaId || null,
    });
    this.toast.success('Categoría actualizada');
    await this.cargarMovimientos();
  }

  async onActualizarDescripcion(event: { movimientoId: string; descripcion: string }) {
    await this.movementsService.updateDescripcion(event.movimientoId, event.descripcion);
    this.toast.success('Descripción actualizada');
    await this.cargarMovimientos();
  }

  async onConciliarMovimiento(event: { gastoId: string; ingresoId: string }) {
    try {
      await this.conciliacionesService.create(event.gastoId, event.ingresoId);
      this.toast.success('Movimientos conciliados');
      await this.recargarConciliaciones();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al conciliar');
    }
  }

  async onDesconciliarMovimiento(event: { conciliacionId: string }) {
    try {
      await this.conciliacionesService.delete(event.conciliacionId);
      this.toast.info('Conciliación eliminada');
      await this.recargarConciliaciones();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al desvincular');
    }
  }

  private async recargarConciliaciones() {
    await this.cargarConciliaciones();
    await this.cargarMovimientos();
    if (this.movimientoAEditar) {
      const actualizado = this.movimientosFiltrados.find(m => m.id === this.movimientoAEditar!.id);
      if (actualizado) this.movimientoAEditar = actualizado;
    }
  }

  async onImportacionCompleta() {
    await this.cargarMovimientos();
  }

  async logout() {
    this.mostrarModalLogout = true;
  }

  async crearPrimeraCuenta() {
    if (!this.nombrePrimeraCuenta.trim()) return;
    await this.accountsService.create(this.nombrePrimeraCuenta.trim(), undefined, 0);
    this.toast.success('Cuenta creada');
    this.cuentas = await this.accountsService.getAll();
    this.mostrarModalPrimeraCuenta = false;
    this.nombrePrimeraCuenta = '';
    this.cuentasSeleccionadas = this.cuentas.map(c => c.id!);
    await this.cargarCategorias();
    await this.cargarMovimientos();
  }
}
