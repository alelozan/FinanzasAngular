import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../models/category.model';
import { Movement } from '../../../models/movement.model';

@Component({
  selector: 'app-movement-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" [class.visible]="!!movimiento" (click)="cerrar.emit()"></div>
    <div class="sidenav" [class.open]="!!movimiento">
      <div class="sidenav-header">
        <h3>Editar Registro</h3>
        <button class="btn-close" (click)="cerrar.emit()">&times;</button>
      </div>
      <div class="sidenav-content" *ngIf="editData">
        <div class="field"><label>Fecha</label><input type="date" [(ngModel)]="editData.fecha"></div>
        <div class="field"><label>Concepto</label><input type="text" [(ngModel)]="editData.concepto"></div>
        <div class="field"><label>Importe</label><input type="number" [(ngModel)]="editData.importe"></div>
        <div class="field"><label>Descripción</label><input type="text" [(ngModel)]="editData.descripcion" placeholder="Opcional..."></div>
        <div class="field">
          <label>
            Categoría
          </label>
          <select [(ngModel)]="editData.categoria_id">
            <option [value]="null">General</option>
            <option *ngFor="let cat of categoriasDisponibles" [value]="cat.id">{{ cat.nombre }}</option>
          </select>
        </div>
        <div class="field">
          <label>Conciliación</label>
          <div class="concil-list" *ngIf="conciliacionesActuales.length > 0">
            <div class="concil-item" *ngFor="let c of conciliacionesActuales">
              <span class="concil-concepto">{{ conceptoContraparte(c) }}</span>
              <button class="concil-unlink" (click)="desconciliar(c.id)" title="Desvincular">&times;</button>
            </div>
          </div>
          <div class="concil-link-row">
            <select [(ngModel)]="movimientoAConciliarId" class="concil-select">
              <option [value]="null" disabled>Seleccionar movimiento...</option>
              <option *ngFor="let m of movimientosConciliables" [value]="m.id">{{ m.concepto }} ({{ m.importe | number:'1.2-2' }} €)</option>
            </select>
            <button class="btn-conciliar" (click)="conciliar()" [disabled]="!movimientoAConciliarId">Conciliar</button>
          </div>
        </div>
        <button class="btn-primary full" (click)="guardar()">Guardar cambios</button>
        <button class="btn-danger-outline full" (click)="eliminar()">Eliminar</button>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.2);
      backdrop-filter: blur(4px);
      display: none;
      z-index: 1000;
      transition: opacity 0.3s;
    }
    .overlay.visible { display: block; }
    .sidenav {
      position: fixed;
      top: 0;
      right: -400px;
      width: 360px;
      height: 100%;
      background: #fff;
      z-index: 1001;
      padding: 2rem;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: -8px 0 32px rgba(15,23,42,0.1);
      overflow-y: auto;
    }
    .sidenav.open { right: 0; }
    .sidenav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .sidenav-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-family: 'Space Grotesk', sans-serif;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-radius: 8px;
      transition: all 0.15s;
    }
    .btn-close:hover { background: #f1f5f9; color: #334155; }
    .field { margin-bottom: 1.2rem; }
    .field label {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.4rem;
    }
    .field input, .field select {
      width: 100%;
      padding: 0.65rem 0.8rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .field input:focus, .field select:focus {
      outline: none;
      border-color: #0ea5e9;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(14,165,233,0.25);
      transition: all 0.2s;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(14,165,233,0.35); }
    .btn-danger-outline {
      border: 1.5px solid #fecaca;
      color: #ef4444;
      background: none;
      padding: 0.75rem;
      border-radius: 10px;
      margin-top: 0.75rem;
      cursor: pointer;
      width: 100%;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .btn-danger-outline:hover { background: #fef2f2; }
    .full { width: 100%; }
    .concil-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 0.6rem;
    }
    .concil-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.45rem 0.6rem;
      background: #ede9fe;
      border-radius: 8px;
      font-size: 0.82rem;
      color: #5b21b6;
    }
    .concil-concepto {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .concil-unlink {
      background: none;
      border: none;
      color: #7c3aed;
      font-size: 1.1rem;
      cursor: pointer;
      line-height: 1;
      padding: 0 0.2rem;
    }
    .concil-unlink:hover { color: #6d28d9; }
    .concil-link-row {
      display: flex;
      gap: 0.5rem;
    }
    .concil-select {
      flex: 1;
      min-width: 0;
      padding: 0.6rem 0.7rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.85rem;
      background: #fff;
      outline: none;
    }
    .concil-select:focus { border-color: #8b5cf6; }
    .btn-conciliar {
      background: #8b5cf6;
      color: white;
      border: none;
      padding: 0.6rem 0.9rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .btn-conciliar:hover:not(:disabled) { background: #7c3aed; }
    .btn-conciliar:disabled { opacity: 0.5; cursor: not-allowed; }
    .global-badge {
      font-size: 0.55rem;
      background: #ede9fe;
      color: #7c3aed;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
      margin-left: 0.3rem;
    }
  `]
})
export class MovementEditorComponent implements OnChanges {
  @Input() movimiento: Movement | null = null;
  @Input() categoriasPorCuenta: Map<number, Category[]> = new Map();
  @Input() movimientos: Movement[] = [];
  @Output() guardado = new EventEmitter<any>();
  @Output() eliminado = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();
  @Output() conciliarMovimiento = new EventEmitter<{ gastoId: string; ingresoId: string }>();
  @Output() desconciliarMovimiento = new EventEmitter<{ conciliacionId: string }>();

  editData: any = null;
  categoriasDisponibles: Category[] = [];
  movimientoAConciliarId: string | null = null;

  ngOnChanges() {
    if (this.movimiento) {
      this.editData = { ...this.movimiento };
      this.movimientoAConciliarId = null;
      this.filtrarCategorias();
    }
  }

  filtrarCategorias() {
    if (!this.editData) return;
    const esIngreso = (this.editData.importe ?? 0) > 0;
    const tipo = esIngreso ? 'ingreso' : 'gasto';
    const cuentaId = this.editData.cuenta_id;
    const fuente = (cuentaId != null ? this.categoriasPorCuenta.get(cuentaId) : null) || [];
    this.categoriasDisponibles = fuente.filter(c => !c.tipo || c.tipo === tipo);
  }

  get conciliacionesActuales(): any[] {
    return this.editData?.conciliaciones || [];
  }

  get movimientosConciliables(): Movement[] {
    if (!this.editData) return [];
    const esGasto = (this.editData.importe ?? 0) < 0;
    const cuentaId = this.editData.cuenta_id;
    const excluidos = new Set<string>([this.editData.id]);
    for (const c of this.conciliacionesActuales) {
      excluidos.add(c.gasto_id);
      excluidos.add(c.ingreso_id);
    }
    return this.movimientos.filter(m =>
      m.id && !excluidos.has(m.id) &&
      m.cuenta_id === cuentaId &&
      (esGasto ? (m.importe ?? 0) > 0 : (m.importe ?? 0) < 0)
    );
  }

  conceptoContraparte(c: any): string {
    const id = c.gasto_id === this.editData?.id ? c.ingreso_id : c.gasto_id;
    const m = this.movimientos.find(x => x.id === id);
    return m ? `${m.concepto} (${(m.importe ?? 0).toFixed(2)} €)` : '';
  }

  conciliar() {
    if (!this.editData?.id || !this.movimientoAConciliarId) return;
    const esGasto = (this.editData.importe ?? 0) < 0;
    const gastoId = esGasto ? this.editData.id : this.movimientoAConciliarId;
    const ingresoId = esGasto ? this.movimientoAConciliarId : this.editData.id;
    this.conciliarMovimiento.emit({ gastoId, ingresoId });
    this.movimientoAConciliarId = null;
  }

  desconciliar(conciliacionId: string) {
    if (conciliacionId) this.desconciliarMovimiento.emit({ conciliacionId });
  }

  guardar() {
    if (this.editData) this.guardado.emit(this.editData);
  }

  eliminar() {
    if (this.editData && confirm('¿Eliminar registro?')) {
      this.eliminado.emit(this.editData.id);
    }
  }
}
