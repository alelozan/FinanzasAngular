import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { Movement } from '../../../models/movement.model';
import { Account } from '../../../models/account.model';
import { Apartado, ApartadoCategoria } from '../../../models/apartado.model';
import { MetaAhorro } from '../../../models/meta-ahorro.model';

Chart.register(...registerables);

interface ResumenApartado {
  apartado: Apartado;
  gastoReal: number;
  progreso: number;
}

interface ResumenMeta {
  meta: MetaAhorro;
  aporte: number;
  acumulado: number;
}

interface ResumenCuenta {
  cuentaId: number;
  nombre: string;
  color: string;
  ingresos: number;
  totalApartados: number;
  totalAporteAhorro: number;
  disponible: number;
  sinApartado: number;
  apartados: ResumenApartado[];
  metas: ResumenMeta[];
}

@Component({
  selector: 'app-budget-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card budget-card">
      <div class="budget-header">
        <h3>Presupuesto Mensual</h3>
        <div class="budget-header-actions">
          <input type="month" [(ngModel)]="mes" (ngModelChange)="recalcular()" class="mes-input">
          <button class="config-btn" (click)="configurar.emit()" title="Configurar presupuesto">&#9881; Configurar</button>
          <button class="toggle-btn" (click)="toggle()" [title]="colapsado ? 'Mostrar presupuesto' : 'Ocultar presupuesto'">
            <span class="chevron" [class.collapsed]="colapsado">&#9662;</span>
            {{ colapsado ? 'Mostrar' : 'Ocultar' }}
          </button>
        </div>
      </div>

      <div class="budget-body" *ngIf="!colapsado">
      <div class="budget-totals">
        <div class="tot-item">
          <span class="tot-label">Ingresos</span>
          <span class="tot-value positive">{{ totalIngresos | number:'1.2-2' }}&euro;</span>
        </div>
        <div class="tot-item">
          <span class="tot-label">Asignado</span>
          <span class="tot-value">{{ totalAsignado | number:'1.2-2' }}&euro;</span>
        </div>
        <div class="tot-item">
          <span class="tot-label">Disponible</span>
          <span class="tot-value" [class.negative]="totalDisponible < 0">{{ totalDisponible | number:'1.2-2' }}&euro;</span>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-box">
          <h4>Gasto real por apartado</h4>
          <canvas #gastoChart></canvas>
          <div class="chart-empty" *ngIf="gastoVacio">Sin gastos este mes</div>
        </div>
        <div class="chart-box">
          <h4>Reparto del ingreso</h4>
          <canvas #planChart></canvas>
          <div class="chart-empty" *ngIf="planVacio">Sin reparto definido</div>
        </div>
      </div>

      <div class="cuenta-sections">
        <div *ngFor="let r of resumenes" class="cuenta-section">
          <div class="cuenta-title">
            <span class="cuenta-dot" [style.background]="r.color"></span>
            <span class="cuenta-nombre">{{ r.nombre }}</span>
            <span class="cuenta-ingresos">Ingresos {{ r.ingresos | number:'1.2-2' }}&euro;</span>
          </div>

          <div class="apartado-list">
            <div *ngFor="let a of r.apartados" class="apartado-row">
              <span class="apartado-dot" [style.background]="a.apartado.color"></span>
              <span class="apartado-nombre">{{ a.apartado.nombre }}</span>
              <div class="progreso">
                <div class="progreso-bar" [style.width.%]="a.progreso" [style.background]="a.apartado.color"></div>
              </div>
              <span class="apartado-gasto">{{ a.gastoReal | number:'1.2-2' }}&euro;</span>
              <input
                type="number"
                class="apartado-importe"
                [ngModel]="a.apartado.importe"
                (change)="onImporteChange(a.apartado, $event)"
                step="0.01"
                title="Importe mensual del apartado">
            </div>
            <div *ngIf="r.sinApartado > 0" class="apartado-row sin">
              <span class="apartado-dot" style="background:#94a3b8"></span>
              <span class="apartado-nombre">Sin apartado</span>
              <div class="progreso"></div>
              <span class="apartado-gasto">{{ r.sinApartado | number:'1.2-2' }}&euro;</span>
              <span class="apartado-importe-placeholder"></span>
            </div>
            <div *ngIf="r.apartados.length === 0" class="empty">Sin apartados</div>
          </div>

          <div class="meta-list">
            <div *ngFor="let mt of r.metas" class="meta-row">
              <span class="meta-nombre">{{ mt.meta.nombre }}</span>
              <input
                type="number"
                class="meta-pct"
                [ngModel]="mt.meta.porcentaje"
                (change)="onPctChange(mt.meta, $event)"
                step="0.1"
                min="0"
                max="100"
                title="Porcentaje del ingreso mensual">
              <span class="meta-pct-sign">%</span>
              <span class="meta-aporte">{{ mt.aporte | number:'1.2-2' }}&euro;</span>
              <span class="meta-acumulado" title="Acumulado desde el inicio">acum. {{ mt.acumulado | number:'1.2-2' }}&euro;</span>
            </div>
            <div *ngIf="r.metas.length === 0" class="empty">Sin metas de ahorro</div>
          </div>

          <div class="disponible-row">
            Disponible:
            <span [class.negative]="r.disponible < 0">{{ r.disponible | number:'1.2-2' }}&euro;</span>
          </div>
        </div>
        <div *ngIf="resumenes.length === 0" class="empty">Selecciona al menos una cuenta</div>
      </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .budget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .budget-header h3 {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .mes-input {
      padding: 0.4rem 0.6rem;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-size: 0.8rem;
      outline: none;
      background: #fff;
    }
    .mes-input:focus { border-color: #0ea5e9; }
    .budget-header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: #f1f5f9;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      padding: 0.4rem 0.7rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .toggle-btn:hover { background: #e0f2fe; color: #0ea5e9; border-color: #bae6fd; }
    .config-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      border: none;
      border-radius: 8px;
      padding: 0.4rem 0.7rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(14,165,233,0.25);
    }
    .config-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(14,165,233,0.35); }
    .chevron {
      display: inline-block;
      transition: transform 0.2s;
      font-size: 0.7rem;
      line-height: 1;
    }
    .chevron.collapsed { transform: rotate(-90deg); }

    .budget-totals {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.8rem;
      margin-bottom: 1.2rem;
    }
    .tot-item {
      background: #f8fafb;
      border-radius: 10px;
      padding: 0.7rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      border: 1px solid var(--border);
    }
    .tot-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .tot-value {
      font-size: 1.15rem;
      font-weight: 800;
      font-family: 'Space Grotesk', sans-serif;
      color: #334155;
    }
    .tot-value.positive { color: #10b981; }
    .tot-value.negative { color: #ef4444; }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1.2rem;
    }
    .chart-box {
      background: #f8fafb;
      border-radius: 10px;
      padding: 0.8rem;
      border: 1px solid var(--border);
      position: relative;
    }
    .chart-box h4 {
      margin: 0 0 0.6rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748b;
    }
    .chart-box canvas { max-height: 200px; width: 100% !important; }
    .chart-empty {
      color: #94a3b8;
      font-size: 0.75rem;
      text-align: center;
      padding: 0.5rem;
    }

    .cuenta-sections { display: flex; flex-direction: column; gap: 1rem; }
    .cuenta-section {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.9rem 1rem;
    }
    .cuenta-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.7rem;
    }
    .cuenta-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .cuenta-nombre { font-weight: 700; font-size: 0.85rem; color: #334155; }
    .cuenta-ingresos { margin-left: auto; font-size: 0.75rem; color: #10b981; font-weight: 700; }

    .apartado-list { display: flex; flex-direction: column; gap: 0.35rem; }
    .apartado-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: #334155;
    }
    .apartado-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .apartado-nombre { flex: 0 0 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .progreso {
      flex: 1;
      height: 8px;
      background: #eef2f6;
      border-radius: 6px;
      overflow: hidden;
      min-width: 40px;
    }
    .progreso-bar { height: 100%; border-radius: 6px; transition: width 0.3s; }
    .apartado-gasto { width: 70px; text-align: right; font-variant-numeric: tabular-nums; color: #64748b; }
    .apartado-importe {
      width: 76px;
      padding: 0.25rem 0.4rem;
      border: 1.5px solid var(--border);
      border-radius: 6px;
      font-size: 0.78rem;
      text-align: right;
      outline: none;
      background: #fff;
    }
    .apartado-importe:focus { border-color: #0ea5e9; }
    .apartado-importe-placeholder { width: 76px; }
    .apartado-row.sin { color: #94a3b8; }

    .meta-list {
      margin-top: 0.7rem;
      padding-top: 0.7rem;
      border-top: 1px dashed var(--border);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .meta-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #334155; }
    .meta-nombre { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .meta-pct {
      width: 60px;
      padding: 0.25rem 0.4rem;
      border: 1.5px solid var(--border);
      border-radius: 6px;
      font-size: 0.78rem;
      text-align: right;
      outline: none;
      background: #fff;
    }
    .meta-pct:focus { border-color: #8b5cf6; }
    .meta-pct-sign { color: #64748b; font-weight: 700; }
    .meta-aporte { width: 80px; text-align: right; font-variant-numeric: tabular-nums; color: #8b5cf6; font-weight: 700; }
    .meta-acumulado { color: #94a3b8; font-size: 0.72rem; }

    .disponible-row {
      margin-top: 0.7rem;
      padding-top: 0.6rem;
      border-top: 1px solid var(--border);
      font-size: 0.8rem;
      color: #64748b;
      text-align: right;
    }
    .disponible-row span { font-weight: 800; color: #10b981; }
    .disponible-row span.negative { color: #ef4444; }

    .empty { color: #94a3b8; font-size: 0.78rem; padding: 0.4rem 0; }
  `]
})
export class BudgetViewComponent implements AfterViewInit, OnChanges {
  @ViewChild('gastoChart') gastoCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('planChart') planCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() cuentas: Account[] = [];
  @Input() cuentasSeleccionadas: number[] = [];
  @Input() movimientos: Movement[] = [];
  @Input() apartados: Apartado[] = [];
  @Input() apartadoCategorias: ApartadoCategoria[] = [];
  @Input() metas: MetaAhorro[] = [];

  @Output() apartadoImporteChange = new EventEmitter<{ id: string; importe: number }>();
  @Output() metaPorcentajeChange = new EventEmitter<{ id: string; porcentaje: number }>();
  @Output() configurar = new EventEmitter<void>();

  mes = new Date().toISOString().slice(0, 7);
  colapsado = true;
  resumenes: ResumenCuenta[] = [];
  totalIngresos = 0;
  totalAsignado = 0;
  totalDisponible = 0;
  gastoVacio = false;
  planVacio = false;

  private gastoChart: Chart | null = null;
  private planChart: Chart | null = null;
  private inicializado = false;

  ngAfterViewInit() {
    this.inicializado = true;
    this.renderCharts();
  }

  toggle() {
    this.colapsado = !this.colapsado;
    if (!this.colapsado) {
      setTimeout(() => this.renderCharts(), 0);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['movimientos'] || changes['apartados'] || changes['apartadoCategorias'] ||
      changes['metas'] || changes['cuentasSeleccionadas'] || changes['cuentas']
    ) {
      this.recalcular();
    }
  }

  recalcular() {
    this.resumenes = [];
    this.totalIngresos = 0;
    this.totalAsignado = 0;
    this.totalDisponible = 0;

    const seleccionadas = this.cuentas.filter(c => this.cuentasSeleccionadas.includes(c.id!));

    for (const cuenta of seleccionadas) {
      const r = this.calcularCuenta(cuenta);
      this.resumenes.push(r);
      this.totalIngresos += r.ingresos;
      this.totalAsignado += r.totalApartados + r.totalAporteAhorro;
      this.totalDisponible += r.disponible;
    }

    this.renderCharts();
  }

  private calcularCuenta(cuenta: Account): ResumenCuenta {
    const cuentaId = cuenta.id!;
    const ingresoMes = this.ingresoPorMes(cuentaId);

    const ingresos = ingresoMes.get(this.mes) || 0;

    const apartadosCuenta = this.apartados.filter(a => a.cuenta_id === cuentaId);
    const movimientosMes = this.movimientos.filter(m => m.cuenta_id === cuentaId && (m.fecha || '').startsWith(this.mes));

    const vinculoPorCategoria = new Map<string, string>();
    for (const ac of this.apartadoCategorias) {
      if (ac.cuenta_id === cuentaId) vinculoPorCategoria.set(ac.categoria_id, ac.apartado_id);
    }

    const gastoPorApartado = new Map<string, number>();
    let sinApartado = 0;
    for (const m of movimientosMes) {
      if ((m.importe ?? 0) >= 0) continue;
      const categoriaId = m.categoria_id;
      const apartadoId = categoriaId ? vinculoPorCategoria.get(categoriaId) : null;
      const abs = Math.abs(m.importe ?? 0);
      if (apartadoId) {
        gastoPorApartado.set(apartadoId, (gastoPorApartado.get(apartadoId) || 0) + abs);
      } else {
        sinApartado += abs;
      }
    }

    const apartados: ResumenApartado[] = apartadosCuenta.map(a => {
      const gastoReal = gastoPorApartado.get(a.id!) || 0;
      const importe = Number(a.importe) || 0;
      const progreso = importe > 0 ? Math.min(100, Math.round((gastoReal / importe) * 100)) : 0;
      return { apartado: a, gastoReal, progreso };
    });

    const metasCuenta = this.metas.filter(m => m.cuenta_id === cuentaId);
    const metas: ResumenMeta[] = metasCuenta.map(meta => {
      const pct = Number(meta.porcentaje) || 0;
      const aporte = (pct / 100) * ingresos;
      const acumulado = this.acumuladoMeta(meta, ingresoMes);
      return { meta, aporte, acumulado };
    });

    const totalApartados = apartados.reduce((s, a) => s + (Number(a.apartado.importe) || 0), 0);
    const totalAporteAhorro = metas.reduce((s, m) => s + m.aporte, 0);
    const disponible = ingresos - totalApartados - totalAporteAhorro;

    return {
      cuentaId,
      nombre: cuenta.nombre,
      color: cuenta.color || '#0ea5e9',
      ingresos,
      totalApartados,
      totalAporteAhorro,
      disponible,
      sinApartado,
      apartados,
      metas
    };
  }

  private ingresoPorMes(cuentaId: number): Map<string, number> {
    const map = new Map<string, number>();
    for (const m of this.movimientos) {
      if (m.cuenta_id !== cuentaId) continue;
      if ((m.importe ?? 0) <= 0) continue;
      if (m.conciliado) continue;
      const key = (m.fecha || '').substring(0, 7);
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + (m.importe ?? 0));
    }
    return map;
  }

  private acumuladoMeta(meta: MetaAhorro, ingresoMes: Map<string, number>): number {
    const pct = (Number(meta.porcentaje) || 0) / 100;
    const inicio = (meta.fecha_inicio || '').substring(0, 7) || this.mes;
    const [iy, im] = inicio.split('-').map(Number);
    const [ey, em] = this.mes.split('-').map(Number);
    if (!iy || !im || !ey || !em) return 0;

    let total = 0;
    let cy = iy;
    let cm = im;
    while (cy < ey || (cy === ey && cm <= em)) {
      const key = `${cy}-${String(cm).padStart(2, '0')}`;
      total += pct * (ingresoMes.get(key) || 0);
      cm++;
      if (cm > 12) { cm = 1; cy++; }
    }
    return total;
  }

  onImporteChange(apartado: Apartado, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    if (apartado.id && !isNaN(value)) {
      this.apartadoImporteChange.emit({ id: apartado.id, importe: value });
    }
  }

  onPctChange(meta: MetaAhorro, event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    if (meta.id && !isNaN(value)) {
      this.metaPorcentajeChange.emit({ id: meta.id, porcentaje: value });
    }
  }

  private renderCharts() {
    if (!this.inicializado) return;

    const gasto = this.buildGastoData();
    this.gastoVacio = gasto.data.length === 0;
    this.renderDoughnut(this.gastoCanvas, this.gastoChart, gasto, (chart) => this.gastoChart = chart);

    const plan = this.buildPlanData();
    this.planVacio = plan.data.length === 0;
    this.renderDoughnut(this.planCanvas, this.planChart, plan, (chart) => this.planChart = chart);
  }

  private buildGastoData(): { labels: string[]; data: number[]; colors: string[] } {
    const map = new Map<string, { value: number; color: string }>();
    for (const r of this.resumenes) {
      for (const a of r.apartados) {
        const cur = map.get(a.apartado.nombre) || { value: 0, color: a.apartado.color || '#0ea5e9' };
        cur.value += a.gastoReal;
        map.set(a.apartado.nombre, cur);
      }
      if (r.sinApartado > 0) {
        const cur = map.get('Sin apartado') || { value: 0, color: '#94a3b8' };
        cur.value += r.sinApartado;
        map.set('Sin apartado', cur);
      }
    }
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    for (const [k, v] of map) {
      if (v.value > 0) { labels.push(k); data.push(v.value); colors.push(v.color); }
    }
    return { labels, data, colors };
  }

  private buildPlanData(): { labels: string[]; data: number[]; colors: string[] } {
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    const metaPalette = ['#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    const apartadoMap = new Map<string, { value: number; color: string }>();
    let totalDisponible = 0;
    for (const r of this.resumenes) {
      for (const a of r.apartados) {
        const cur = apartadoMap.get(a.apartado.nombre) || { value: 0, color: a.apartado.color || '#0ea5e9' };
        cur.value += Number(a.apartado.importe) || 0;
        apartadoMap.set(a.apartado.nombre, cur);
      }
      totalDisponible += r.disponible;
    }
    for (const [k, v] of apartadoMap) {
      if (v.value > 0) { labels.push(k); data.push(v.value); colors.push(v.color); }
    }

    const metaMap = new Map<string, number>();
    for (const r of this.resumenes) {
      for (const mt of r.metas) {
        metaMap.set(mt.meta.nombre, (metaMap.get(mt.meta.nombre) || 0) + mt.aporte);
      }
    }
    let mi = 0;
    for (const [k, v] of metaMap) {
      if (v > 0) { labels.push(k); data.push(v); colors.push(metaPalette[mi % metaPalette.length]); mi++; }
    }

    if (totalDisponible > 0) { labels.push('Sin asignar'); data.push(totalDisponible); colors.push('#cbd5e1'); }

    return { labels, data, colors };
  }

  private renderDoughnut(
    canvasRef: ElementRef<HTMLCanvasElement>,
    existing: Chart | null,
    payload: { labels: string[]; data: number[]; colors: string[] },
    setter: (c: Chart) => void
  ) {
    if (existing) { existing.destroy(); setter(null as any); }
    if (!canvasRef) return;
    if (payload.data.length === 0) return;

    const total = payload.data.reduce((a, b) => a + b, 0);
    const chart = new Chart(canvasRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: payload.labels,
        datasets: [{
          data: payload.data,
          backgroundColor: payload.colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 10, usePointStyle: true, pointStyleWidth: 8, font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return ` ${context.label}: ${value.toFixed(2)} € (${pct}%)`;
              }
            }
          }
        }
      }
    });
    setter(chart);
  }
}
