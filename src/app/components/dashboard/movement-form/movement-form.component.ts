import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Account } from '../../../models/account.model';
import { Category } from '../../../models/category.model';
import { Movement } from '../../../models/movement.model';

@Component({
  selector: 'app-movement-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <details class="card quick-add">
      <summary>
        <span class="summary-icon">+</span>
        Nuevo Movimiento Rápido
      </summary>
      <div class="quick-add-grid">
        <div class="f-field">
          <label>Cuenta</label>
          <select [(ngModel)]="formData.cuenta_id" (ngModelChange)="onCuentaChange()">
            <option [value]="undefined" disabled>Seleccionar...</option>
            <option *ngFor="let c of cuentas" [value]="c.id">
              {{ c.nombre }}{{ c.es_compartida ? ' (compartida)' : '' }}
            </option>
          </select>
        </div>
        <div class="f-field">
          <label>Fecha</label>
          <input type="date" [(ngModel)]="formData.fecha">
        </div>
        <div class="f-field">
          <label>Tipo</label>
          <div class="toggle-wrapper">
            <button
              class="toggle-btn toggle-ingreso"
              [class.active]="esIngreso"
              (click)="setTipo(true)">
              Ingreso
            </button>
            <button
              class="toggle-btn toggle-gasto"
              [class.active]="!esIngreso"
              (click)="setTipo(false)">
              Gasto
            </button>
          </div>
        </div>
        <div class="f-field">
          <label>Concepto</label>
          <input type="text" [(ngModel)]="formData.concepto" placeholder="Descripción...">
        </div>
        <div class="f-field">
          <label>Importe (&euro;)</label>
          <input
            type="number"
            [(ngModel)]="importeAbsoluto"
            placeholder="0.00"
            min="0"
            step="0.01"
            class="importe-input"
            [class.input-ingreso]="esIngreso"
            [class.input-gasto]="!esIngreso"
          >
        </div>
        <div class="f-field">
          <label>
            Categoría
          </label>
          <select
            [(ngModel)]="formData.categoria_id"
            [disabled]="categoriasDisponibles.length === 0">
            <option [value]="null">
              {{ categoriasDisponibles.length === 0 ? 'Sin categorías disponibles' : 'General' }}
            </option>
            <option *ngFor="let cat of categoriasDisponibles" [value]="cat.id">{{ cat.nombre }}</option>
          </select>
        </div>
        <div class="f-field f-field-full">
          <label>Descripción (opcional)</label>
          <input type="text" [(ngModel)]="formData.descripcion" placeholder="Nota adicional...">
        </div>
        <button class="btn-primary" (click)="guardar()">Guardar</button>
      </div>
    </details>
  `,
  styles: [`
    .card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .quick-add summary {
      cursor: pointer;
      font-weight: 700;
      color: #0ea5e9;
      margin-bottom: 1rem;
      outline: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      list-style: none;
    }
    .quick-add summary::-webkit-details-marker { display: none; }
    .summary-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: #fff;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
    }
    .quick-add-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      align-items: flex-end;
    }
    .f-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .f-field-full { grid-column: 1 / -1; }
    .f-field label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .global-badge {
      font-size: 0.55rem;
      background: #ede9fe;
      color: #7c3aed;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .f-field input, .f-field select {
      padding: 0.6rem 0.8rem;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      font-size: 0.88rem;
      transition: border-color 0.2s;
      background: #fff;
    }
    .f-field input:focus, .f-field select:focus {
      outline: none;
      border-color: #0ea5e9;
    }
    .f-field select:disabled {
      background: #f8fafc;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .toggle-wrapper {
      display: flex;
      border-radius: 10px;
      overflow: hidden;
      border: 1.5px solid var(--border);
    }
    .toggle-btn {
      flex: 1;
      padding: 0.55rem 0.8rem;
      border: none;
      background: #fff;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      color: #94a3b8;
    }
    .toggle-btn:first-child { border-right: 1px solid var(--border); }
    .toggle-btn.toggle-ingreso.active {
      background: #d1fae5;
      color: #065f46;
    }
    .toggle-btn.toggle-gasto.active {
      background: #fee2e2;
      color: #991b1b;
    }

    .importe-input.input-ingreso { border-color: #10b981; }
    .importe-input.input-ingreso:focus { border-color: #10b981; box-shadow: 0 0 0 2px rgba(16,185,129,0.15); }
    .importe-input.input-gasto { border-color: #ef4444; }
    .importe-input.input-gasto:focus { border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,0.15); }

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
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(14,165,233,0.35);
    }
  `]
})
export class MovementFormComponent implements OnChanges {
  @Input() cuentas: Account[] = [];
  @Input() categoriasPorCuenta: Map<number, Category[]> = new Map();
  @Output() movimientoGuardado = new EventEmitter<Partial<Movement>>();

  esIngreso = true;
  importeAbsoluto: number | null = null;
  formData: Partial<Movement> = this.nuevoForm();
  categoriasDisponibles: Category[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['categoriasPorCuenta']) {
      this.filtrarCategorias();
    }
  }

  onCuentaChange() {
    this.formData.categoria_id = null;
    this.filtrarCategorias();
  }

  setTipo(ingreso: boolean) {
    if (this.esIngreso !== ingreso) {
      this.esIngreso = ingreso;
      this.formData.categoria_id = null;
      this.filtrarCategorias();
    }
  }

  private filtrarCategorias() {
    const tipo = this.esIngreso ? 'ingreso' : 'gasto';
    const cuentaId = Number(this.formData.cuenta_id);
    const fuente = this.categoriasPorCuenta.get(cuentaId) || [];
    this.categoriasDisponibles = fuente.filter(c => !c.tipo || c.tipo === tipo);
    const existeSeleccionada = this.categoriasDisponibles.some(c => c.id === this.formData.categoria_id);
    if (!existeSeleccionada) {
      this.formData.categoria_id = null;
    }
  }

  private nuevoForm(): Partial<Movement> {
    return {
      concepto: '',
      fecha: new Date().toISOString().split('T')[0],
      importe: null as any,
      descripcion: null,
      categoria_id: null,
      cuenta_id: undefined
    };
  }

  guardar() {
    if (!this.formData.cuenta_id || !this.importeAbsoluto || this.importeAbsoluto <= 0) return;
    const importeFinal = this.esIngreso ? this.importeAbsoluto : -this.importeAbsoluto;
    this.movimientoGuardado.emit({
      ...this.formData,
      importe: importeFinal
    });
    this.formData = { ...this.nuevoForm(), cuenta_id: this.formData.cuenta_id };
    this.importeAbsoluto = null;
    this.esIngreso = true;
    this.filtrarCategorias();
  }
}
