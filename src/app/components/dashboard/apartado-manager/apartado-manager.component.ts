import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Account } from '../../../models/account.model';
import { Category } from '../../../models/category.model';
import { Apartado, ApartadoCategoria } from '../../../models/apartado.model';
import { MetaAhorro } from '../../../models/meta-ahorro.model';

@Component({
  selector: 'app-apartado-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="presupuesto-sidebar">
      <h3>Presupuesto</h3>

      <select [(ngModel)]="cuentaSel" class="cuenta-select" (ngModelChange)="limpiarEdiciones()">
        <option [ngValue]="null" disabled>Seleccionar cuenta...</option>
        <option *ngFor="let c of cuentas" [ngValue]="c.id">{{ c.nombre }}</option>
      </select>

      <ng-container *ngIf="cuentaSel">
        <div class="section">
          <div class="section-header">
            <h4>Apartados</h4>
            <button class="btn-add" (click)="toggleCrearApartado()" title="Nuevo apartado">+</button>
          </div>

          <div *ngIf="mostrarCrearApartado" class="form">
            <input type="text" [(ngModel)]="nuevoApartadoNombre" placeholder="Nombre..." (keydown.enter)="crearApartado()" autofocus>
            <input type="number" [(ngModel)]="nuevoApartadoImporte" placeholder="Importe €" step="0.01" class="importe-input">
            <div class="color-row">
              <span *ngFor="let c of quickColors" class="color-pill" [class.selected]="nuevoApartadoColor === c" [style.background]="c" (click)="nuevoApartadoColor = c"></span>
              <input type="color" [(ngModel)]="nuevoApartadoColor" class="color-picker-small">
            </div>
            <button class="btn-confirm" (click)="crearApartado()" [disabled]="!nuevoApartadoNombre.trim()">Crear</button>
          </div>

          <div class="item-list">
            <div *ngFor="let a of apartadosCuenta" class="item">
              <ng-container *ngIf="editandoApartadoId === a.id; else displayApartado">
                <div class="edit-row">
                  <input type="text" [(ngModel)]="editApartadoNombre" (keydown.enter)="guardarApartado(a.id)" (keydown.escape)="cancelarEdit()">
                  <input type="number" [(ngModel)]="editApartadoImporte" step="0.01" class="importe-input-sm">
                  <button class="btn-check" (click)="guardarApartado(a.id)">&#10003;</button>
                </div>
              </ng-container>
              <ng-template #displayApartado>
                <div class="item-content">
                  <span class="dot" [style.background]="a.color || '#0ea5e9'"></span>
                  <span class="nombre">{{ a.nombre }}</span>
                  <span class="importe">{{ a.importe | number:'1.2-2' }}&euro;</span>
                  <span class="acciones">
                    <button class="btn-icon" (click)="iniciarEditApartado(a)" title="Editar">&#9998;</button>
                    <button class="btn-icon del" (click)="eliminarApartado(a.id)" title="Eliminar">&times;</button>
                  </span>
                </div>
              </ng-template>
            </div>
            <div *ngIf="apartadosCuenta.length === 0" class="empty">Sin apartados</div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h4>Metas de ahorro</h4>
            <button class="btn-add" (click)="toggleCrearMeta()" title="Nueva meta">+</button>
          </div>

          <div *ngIf="mostrarCrearMeta" class="form">
            <input type="text" [(ngModel)]="nuevaMetaNombre" placeholder="Nombre..." (keydown.enter)="crearMeta()" autofocus>
            <input type="number" [(ngModel)]="nuevaMetaPorcentaje" placeholder="% mensual" step="0.1" min="0" max="100" class="importe-input">
            <button class="btn-confirm" (click)="crearMeta()" [disabled]="!nuevaMetaNombre.trim()">Crear</button>
          </div>

          <div class="item-list">
            <div *ngFor="let m of metasCuenta" class="item">
              <ng-container *ngIf="editandoMetaId === m.id; else displayMeta">
                <div class="edit-row">
                  <input type="text" [(ngModel)]="editMetaNombre" (keydown.enter)="guardarMeta(m.id)" (keydown.escape)="cancelarEdit()">
                  <input type="number" [(ngModel)]="editMetaPorcentaje" step="0.1" min="0" max="100" class="importe-input-sm">
                  <button class="btn-check" (click)="guardarMeta(m.id)">&#10003;</button>
                </div>
              </ng-container>
              <ng-template #displayMeta>
                <div class="item-content">
                  <span class="dot" style="background:#8b5cf6"></span>
                  <span class="nombre">{{ m.nombre }}</span>
                  <span class="importe">{{ m.porcentaje }}%</span>
                  <span class="acciones">
                    <button class="btn-icon" (click)="iniciarEditMeta(m)" title="Editar">&#9998;</button>
                    <button class="btn-icon del" (click)="eliminarMeta(m.id)" title="Eliminar">&times;</button>
                  </span>
                </div>
              </ng-template>
            </div>
            <div *ngIf="metasCuenta.length === 0" class="empty">Sin metas</div>
          </div>
        </div>

        <div class="section">
          <div class="section-header"><h4>Asignar categorías</h4></div>
          <div class="asignacion-list">
            <div *ngFor="let cat of categoriasCuenta" class="asignacion-row">
              <span class="dot" [style.background]="cat.color || '#64748b'"></span>
              <span class="nombre">{{ cat.nombre }}</span>
              <select
                [ngModel]="vinculoDe(cat.id)"
                (ngModelChange)="asignarCategoria(cat.id, $event)"
                class="asignacion-select">
                <option [ngValue]="null">Sin apartado</option>
                <option *ngFor="let a of apartadosCuenta" [ngValue]="a.id">{{ a.nombre }}</option>
              </select>
            </div>
            <div *ngIf="categoriasCuenta.length === 0" class="empty">Sin categorías</div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .presupuesto-sidebar { padding: 0; }
    h3 { margin: 0 0 0.8rem; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .cuenta-select {
      width: 100%;
      padding: 0.5rem 0.6rem;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-size: 0.8rem;
      margin-bottom: 1rem;
      outline: none;
      background: #fff;
    }
    .cuenta-select:focus { border-color: #0ea5e9; }

    .section { margin-bottom: 1rem; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .section-header h4 { margin: 0; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    .btn-add {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      border: none;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      font-size: 1rem;
      line-height: 1;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-add:hover { opacity: 0.9; }

    .form {
      background: #f8fafb;
      border-radius: 8px;
      padding: 0.6rem;
      margin-bottom: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      border: 1.5px solid var(--border);
    }
    .form input[type="text"], .form input[type="number"] {
      padding: 0.4rem 0.5rem;
      border: 1.5px solid var(--border);
      border-radius: 6px;
      font-size: 0.78rem;
      outline: none;
    }
    .form input:focus { border-color: #0ea5e9; }
    .importe-input { width: 100%; }
    .color-row { display: flex; gap: 0.3rem; align-items: center; }
    .color-pill {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.15s;
    }
    .color-pill.selected { border-color: #334155; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #334155; }
    .color-picker-small {
      width: 18px;
      height: 18px;
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: 50%;
      overflow: hidden;
    }
    .btn-confirm {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      border: none;
      padding: 0.4rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.78rem;
    }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

    .item-list { display: flex; flex-direction: column; gap: 0.2rem; }
    .item { font-size: 0.8rem; color: #334155; }
    .item-content {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.5rem;
      border-radius: 6px;
    }
    .item-content:hover { background: #f1f5f9; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .nombre { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .importe { font-variant-numeric: tabular-nums; color: #64748b; font-size: 0.75rem; }
    .acciones { display: flex; gap: 0.1rem; opacity: 0; transition: opacity 0.15s; }
    .item-content:hover .acciones { opacity: 1; }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      line-height: 1;
      color: #0ea5e9;
    }
    .btn-icon:hover { background: #e0f2fe; }
    .btn-icon.del { color: #ef4444; }
    .btn-icon.del:hover { background: #fef2f2; }

    .edit-row { display: flex; gap: 0.3rem; align-items: center; width: 100%; }
    .edit-row input[type="text"] {
      flex: 1;
      padding: 0.3rem 0.4rem;
      border: 1.5px solid #0ea5e9;
      border-radius: 6px;
      font-size: 0.78rem;
      outline: none;
      min-width: 0;
    }
    .edit-row input[type="number"] {
      width: 60px;
      padding: 0.3rem 0.4rem;
      border: 1.5px solid #0ea5e9;
      border-radius: 6px;
      font-size: 0.78rem;
      outline: none;
    }
    .importe-input-sm { width: 60px !important; }
    .btn-check {
      background: #10b981;
      color: white;
      border: none;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.8rem;
      line-height: 1;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .asignacion-list { display: flex; flex-direction: column; gap: 0.2rem; }
    .asignacion-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }
    .asignacion-row:hover { background: #f1f5f9; }
    .asignacion-row .nombre { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.78rem; }
    .asignacion-select {
      padding: 0.2rem 0.3rem;
      border: 1.5px solid var(--border);
      border-radius: 6px;
      font-size: 0.72rem;
      outline: none;
      background: #fff;
      max-width: 110px;
    }
    .asignacion-select:focus { border-color: #0ea5e9; }
    .empty { color: #94a3b8; font-size: 0.75rem; padding: 0.3rem 0.5rem; }
  `]
})
export class ApartadoManagerComponent implements OnChanges {
  @Input() cuentas: Account[] = [];
  @Input() apartados: Apartado[] = [];
  @Input() apartadoCategorias: ApartadoCategoria[] = [];
  @Input() metas: MetaAhorro[] = [];
  @Input() categoriasPorCuenta: Map<number, Category[]> = new Map();

  @Output() apartadoCreado = new EventEmitter<{ cuenta_id: number; nombre: string; color: string; importe: number }>();
  @Output() apartadoActualizado = new EventEmitter<{ id: string; nombre: string; color: string; importe: number }>();
  @Output() apartadoEliminado = new EventEmitter<string>();
  @Output() metaCreada = new EventEmitter<{ cuenta_id: number; nombre: string; porcentaje: number }>();
  @Output() metaActualizada = new EventEmitter<{ id: string; nombre: string; porcentaje: number }>();
  @Output() metaEliminada = new EventEmitter<string>();
  @Output() categoriaAsignada = new EventEmitter<{ cuenta_id: number; categoria_id: string; apartado_id: string | null }>();

  quickColors = ['#0ea5e9', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#64748b'];

  cuentaSel: number | null = null;

  mostrarCrearApartado = false;
  nuevoApartadoNombre = '';
  nuevoApartadoImporte = 0;
  nuevoApartadoColor = '#0ea5e9';

  mostrarCrearMeta = false;
  nuevaMetaNombre = '';
  nuevaMetaPorcentaje = 10;

  editandoApartadoId: string | null = null;
  editApartadoNombre = '';
  editApartadoImporte = 0;
  editApartadoColor = '#0ea5e9';

  editandoMetaId: string | null = null;
  editMetaNombre = '';
  editMetaPorcentaje = 10;

  get apartadosCuenta(): Apartado[] {
    return this.apartados.filter(a => a.cuenta_id === this.cuentaSel);
  }

  get metasCuenta(): MetaAhorro[] {
    return this.metas.filter(m => m.cuenta_id === this.cuentaSel);
  }

  get categoriasCuenta(): Category[] {
    return this.categoriasPorCuenta.get(this.cuentaSel as number) || [];
  }

  ngOnChanges() {
    if (this.cuentaSel == null && this.cuentas.length > 0) {
      this.cuentaSel = this.cuentas[0].id ?? null;
    } else if (this.cuentaSel != null && !this.cuentas.some(c => c.id === this.cuentaSel)) {
      this.cuentaSel = this.cuentas.length > 0 ? this.cuentas[0].id! : null;
    }
  }

  limpiarEdiciones() {
    this.cancelarEdit();
    this.mostrarCrearApartado = false;
    this.mostrarCrearMeta = false;
  }

  vinculoDe(categoriaId: string | undefined): string | null {
    if (!categoriaId) return null;
    const v = this.apartadoCategorias.find(ac => ac.cuenta_id === this.cuentaSel && ac.categoria_id === categoriaId);
    return v ? v.apartado_id : null;
  }

  asignarCategoria(categoriaId: string | undefined, apartadoId: string | null) {
    if (this.cuentaSel == null || !categoriaId) return;
    this.categoriaAsignada.emit({ cuenta_id: this.cuentaSel, categoria_id: categoriaId, apartado_id: apartadoId });
  }

  toggleCrearApartado() {
    this.mostrarCrearApartado = !this.mostrarCrearApartado;
    this.nuevoApartadoNombre = '';
    this.nuevoApartadoImporte = 0;
    this.nuevoApartadoColor = '#0ea5e9';
  }

  crearApartado() {
    if (!this.nuevoApartadoNombre.trim() || this.cuentaSel == null) return;
    this.apartadoCreado.emit({
      cuenta_id: this.cuentaSel,
      nombre: this.nuevoApartadoNombre.trim(),
      color: this.nuevoApartadoColor,
      importe: Number(this.nuevoApartadoImporte) || 0
    });
    this.mostrarCrearApartado = false;
  }

  iniciarEditApartado(a: Apartado) {
    this.editandoApartadoId = a.id!;
    this.editApartadoNombre = a.nombre;
    this.editApartadoImporte = Number(a.importe) || 0;
    this.editApartadoColor = a.color || '#0ea5e9';
  }

  guardarApartado(id: string | undefined) {
    if (!id || !this.editApartadoNombre.trim()) return;
    this.apartadoActualizado.emit({
      id,
      nombre: this.editApartadoNombre.trim(),
      color: this.editApartadoColor,
      importe: Number(this.editApartadoImporte) || 0
    });
    this.cancelarEdit();
  }

  eliminarApartado(id: string | undefined) {
    if (id && confirm('¿Eliminar apartado?')) this.apartadoEliminado.emit(id);
  }

  toggleCrearMeta() {
    this.mostrarCrearMeta = !this.mostrarCrearMeta;
    this.nuevaMetaNombre = '';
    this.nuevaMetaPorcentaje = 10;
  }

  crearMeta() {
    if (!this.nuevaMetaNombre.trim() || this.cuentaSel == null) return;
    this.metaCreada.emit({
      cuenta_id: this.cuentaSel,
      nombre: this.nuevaMetaNombre.trim(),
      porcentaje: Number(this.nuevaMetaPorcentaje) || 0
    });
    this.mostrarCrearMeta = false;
  }

  iniciarEditMeta(m: MetaAhorro) {
    this.editandoMetaId = m.id!;
    this.editMetaNombre = m.nombre;
    this.editMetaPorcentaje = Number(m.porcentaje) || 0;
  }

  guardarMeta(id: string | undefined) {
    if (!id || !this.editMetaNombre.trim()) return;
    this.metaActualizada.emit({
      id,
      nombre: this.editMetaNombre.trim(),
      porcentaje: Number(this.editMetaPorcentaje) || 0
    });
    this.cancelarEdit();
  }

  eliminarMeta(id: string | undefined) {
    if (id && confirm('¿Eliminar meta de ahorro?')) this.metaEliminada.emit(id);
  }

  cancelarEdit() {
    this.editandoApartadoId = null;
    this.editandoMetaId = null;
    this.editApartadoNombre = '';
    this.editMetaNombre = '';
  }
}
