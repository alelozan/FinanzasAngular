import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Account } from '../../../models/account.model';
import { Category } from '../../../models/category.model';
import { SmartCategorization } from '../../../models/smart-categorization.model';
import { SmartCategorizationsService } from '../../../services/smart-categorizations.service';
import { MovementsService } from '../../../services/movements.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-smart-categorizer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card smart-cat">
      <div class="smart-header" (click)="abierto = !abierto">
        <div class="smart-header-left">
          <span class="smart-icon">&#9881;</span>
          <span class="smart-title">Categorización Inteligente</span>
        </div>
        <span class="smart-chevron" [class.rotated]="abierto">&#9660;</span>
      </div>

      <div class="smart-body" *ngIf="abierto">
        <p class="smart-desc">
          Asigna automáticamente una categoría a los movimientos cuyo concepto contenga un nombre.
          Las reglas se aplican al importar un CSV en la cuenta correspondiente.
        </p>

        <div class="f-field">
          <label>Cuenta</label>
          <select [(ngModel)]="cuentaSeleccionada" (change)="onCuentaChange()" class="smart-select">
            <option [value]="null" disabled>Seleccionar cuenta...</option>
            <option *ngFor="let c of cuentas" [ngValue]="c.id">
              {{ c.nombre }}{{ c.es_compartida ? ' (compartida)' : '' }}
            </option>
          </select>
        </div>

        <div class="rules-section" *ngIf="cuentaSeleccionada">
          <div class="crear-regla">
            <div class="crear-row">
              <input
                type="text"
                [(ngModel)]="nuevoNombre"
                placeholder="Nombre (ej: Mercadona)"
                class="smart-input"
                (keydown.enter)="crear()"
              >
              <select [(ngModel)]="nuevaCategoriaId" class="smart-select">
                <option [value]="null" disabled>Seleccionar categoría...</option>
                <option *ngFor="let cat of categoriasDisponibles" [value]="cat.id">{{ cat.nombre }}</option>
              </select>
            </div>
            <button
              class="btn-primary"
              (click)="crear()"
              [disabled]="!nuevoNombre.trim() || !nuevaCategoriaId || procesando">
              {{ procesando ? 'Procesando...' : 'Añadir regla' }}
            </button>
          </div>

          <div class="rules-list" *ngIf="reglas.length > 0">
            <div *ngFor="let r of reglas" class="rule-item">
              <ng-container *ngIf="editandoId === r.id; else displayRule">
                <div class="edit-row">
                  <input
                    type="text"
                    [(ngModel)]="editNombre"
                    class="smart-input"
                    (keydown.enter)="guardarEdit(r.id)"
                    (keydown.escape)="cancelarEdit()"
                    autofocus
                  >
                  <select [(ngModel)]="editCategoriaId" class="smart-select">
                    <option *ngFor="let cat of categoriasDisponibles" [value]="cat.id">{{ cat.nombre }}</option>
                  </select>
                  <button class="btn-check" (click)="guardarEdit(r.id)" title="Guardar">&#10003;</button>
                  <button class="btn-cancel" (click)="cancelarEdit()" title="Cancelar">&#10005;</button>
                </div>
              </ng-container>
              <ng-template #displayRule>
                <span class="rule-nombre">{{ r.nombre }}</span>
                <span class="rule-arrow">&#8594;</span>
                <span
                  class="rule-categoria"
                  [style.color]="categoriaColor(r.categoria_id)"
                  [style.background]="hexToRgba(categoriaColor(r.categoria_id), 0.12)">
                  {{ categoriaNombre(r.categoria_id) }}
                </span>
                <div class="rule-actions">
                  <button class="btn-icon btn-edit" (click)="iniciarEdit(r)" title="Editar">&#9998;</button>
                  <button class="btn-icon btn-delete" (click)="eliminar(r)" title="Eliminar"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
              </ng-template>
            </div>
          </div>

          <div *ngIf="reglas.length === 0" class="empty-msg">
            Sin reglas para esta cuenta. Añade una para categorizar automáticamente.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .smart-cat {
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .smart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      cursor: pointer;
      transition: background 0.15s;
    }
    .smart-header:hover { background: #f8fafc; }
    .smart-header-left { display: flex; align-items: center; gap: 0.6rem; }
    .smart-icon { font-size: 1.1rem; }
    .smart-title {
      font-weight: 700;
      font-size: 0.9rem;
      color: #334155;
    }
    .smart-chevron {
      font-size: 0.6rem;
      color: #94a3b8;
      transition: transform 0.2s;
    }
    .smart-chevron.rotated { transform: rotate(180deg); }
    .smart-body {
      padding: 0 1.5rem 1.5rem;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .smart-desc {
      color: #64748b;
      font-size: 0.82rem;
      margin: 0 0 1rem;
      line-height: 1.5;
    }
    .f-field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
    .f-field label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .smart-input, .smart-select {
      padding: 0.6rem 0.8rem;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      font-size: 0.88rem;
      transition: border-color 0.2s;
      background: #fff;
    }
    .smart-input:focus, .smart-select:focus {
      outline: none;
      border-color: #0ea5e9;
    }
    .crear-regla { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
    .crear-row { display: flex; gap: 0.5rem; }
    .crear-row .smart-input { flex: 1; }
    .crear-row .smart-select { flex: 1; }
    .btn-primary {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      border: none;
      padding: 0.65rem 1.2rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.88rem;
      box-shadow: 0 4px 12px rgba(14,165,233,0.25);
      transition: all 0.2s;
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(14,165,233,0.35);
    }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .rules-list { display: flex; flex-direction: column; gap: 0.4rem; }
    .rule-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.6rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      font-size: 0.84rem;
    }
    .rule-nombre {
      font-weight: 600;
      color: #334155;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 160px;
    }
    .rule-arrow { color: #94a3b8; flex-shrink: 0; }
    .rule-categoria {
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.75rem;
      white-space: nowrap;
    }
    .rule-actions {
      margin-left: auto;
      display: flex;
      gap: 0.1rem;
      opacity: 0;
      transition: opacity 0.15s;
      flex-shrink: 0;
    }
    .rule-item:hover .rule-actions { opacity: 1; }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0.2rem 0.35rem;
      border-radius: 6px;
      line-height: 1;
      transition: all 0.15s;
    }
    .btn-edit { color: #0ea5e9; }
    .btn-edit:hover { background: #e0f2fe; }
    .btn-delete { color: #ef4444; }
    .btn-delete:hover { background: #fef2f2; }
    .btn-check {
      background: #10b981;
      color: white;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.85rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .btn-check:hover { opacity: 0.9; }
    .btn-cancel {
      background: none;
      border: 1.5px solid #e2e8f0;
      color: #64748b;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .btn-cancel:hover { background: #f1f5f9; }
    .edit-row { display: flex; gap: 0.4rem; width: 100%; align-items: center; }
    .edit-row .smart-input { flex: 1; min-width: 0; }
    .edit-row .smart-select { flex: 1; min-width: 0; }
    .empty-msg {
      color: #94a3b8;
      font-size: 0.8rem;
      padding: 0.5rem;
      text-align: center;
      border: 1.5px dashed #e2e8f0;
      border-radius: 10px;
    }
  `]
})
export class SmartCategorizerComponent implements OnChanges {
  @Input() cuentas: Account[] = [];
  @Input() categoriasPorCuenta: Map<number, Category[]> = new Map();
  @Output() actualizado = new EventEmitter<void>();

  abierto = false;
  cuentaSeleccionada: number | null = null;
  reglas: SmartCategorization[] = [];
  procesando = false;

  nuevoNombre = '';
  nuevaCategoriaId: string | null = null;

  editandoId: string | null = null;
  editNombre = '';
  editCategoriaId: string | null = null;

  constructor(
    private smartService: SmartCategorizationsService,
    private movementsService: MovementsService,
    private toast: ToastService
  ) {}

  get categoriasDisponibles(): Category[] {
    if (this.cuentaSeleccionada == null) return [];
    return this.categoriasPorCuenta.get(Number(this.cuentaSeleccionada)) || [];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cuentas'] && this.cuentaSeleccionada == null && this.cuentas.length > 0) {
      this.cuentaSeleccionada = this.cuentas[0].id ?? null;
      this.cargarReglas();
    }
  }

  onCuentaChange() {
    this.cancelarEdit();
    this.nuevoNombre = '';
    this.nuevaCategoriaId = null;
    this.cargarReglas();
  }

  async cargarReglas() {
    if (!this.cuentaSeleccionada) {
      this.reglas = [];
      return;
    }
    this.reglas = await this.smartService.getByCuenta(this.cuentaSeleccionada);
  }

  async crear() {
    if (!this.cuentaSeleccionada || !this.nuevoNombre.trim() || !this.nuevaCategoriaId) return;
    this.procesando = true;
    try {
      const nombre = this.nuevoNombre.trim();
      const categoriaId = this.nuevaCategoriaId;
      await this.smartService.create({
        cuenta_id: Number(this.cuentaSeleccionada),
        nombre,
        categoria_id: categoriaId
      });
      await this.aplicarReglaAMovimientos(this.cuentaSeleccionada, nombre, categoriaId);
      this.toast.success('Regla creada');
      this.nuevoNombre = '';
      this.nuevaCategoriaId = null;
      await this.cargarReglas();
      this.actualizado.emit();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al crear regla');
    } finally {
      this.procesando = false;
    }
  }

  iniciarEdit(r: SmartCategorization) {
    this.editandoId = r.id ?? null;
    this.editNombre = r.nombre;
    this.editCategoriaId = r.categoria_id ?? null;
  }

  async guardarEdit(id: string | undefined) {
    if (!id || !this.editNombre.trim() || !this.editCategoriaId) return;
    this.procesando = true;
    try {
      const nombre = this.editNombre.trim();
      const categoriaId = this.editCategoriaId;
      await this.smartService.update(id, {
        nombre,
        categoria_id: categoriaId
      });
      await this.aplicarReglaAMovimientos(this.cuentaSeleccionada, nombre, categoriaId);
      this.toast.success('Regla actualizada');
      this.cancelarEdit();
      await this.cargarReglas();
      this.actualizado.emit();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al actualizar regla');
    } finally {
      this.procesando = false;
    }
  }

  cancelarEdit() {
    this.editandoId = null;
    this.editNombre = '';
    this.editCategoriaId = null;
  }

  async eliminar(r: SmartCategorization) {
    if (!r.id || !confirm('¿Eliminar regla?')) return;
    try {
      await this.smartService.delete(r.id);
      this.toast.info('Regla eliminada');
      await this.cargarReglas();
    } catch (e: any) {
      this.toast.error(e.message || 'Error al eliminar regla');
    }
  }

  private async aplicarReglaAMovimientos(cuentaId: number | null, nombre: string, categoriaId: string | null) {
    if (!cuentaId || !categoriaId) return;
    await this.movementsService.updateCategoriaByConcept(Number(cuentaId), nombre, categoriaId);
  }

  categoriaNombre(id: string | null | undefined): string {
    if (!id) return 'Sin categoría';
    return this.categoriasDisponibles.find(c => c.id === id)?.nombre || 'Sin categoría';
  }

  categoriaColor(id: string | null | undefined): string {
    return this.categoriasDisponibles.find(c => c.id === id)?.color || '#0ea5e9';
  }

  hexToRgba(hex: string, alpha: number): string {
    if (!hex || hex.length < 7) return `rgba(14,165,233,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
