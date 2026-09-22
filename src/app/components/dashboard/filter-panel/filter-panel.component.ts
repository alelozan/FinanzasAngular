import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../models/category.model';

export interface FilterValues {
  concepto: string;
  descripcion: string;
  categoriasIncluir: string[];
  categoriasExcluir: string[];
  tipo: string;
  minPrecio: number | null;
  maxPrecio: number | null;
  fechaMin: string;
  fechaMax: string;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card filters-panel">
      <div class="filters-header">
        <h3>Filtros de Búsqueda</h3>
        <button class="btn-clear" (click)="limpiar()">Limpiar</button>
      </div>
      <div class="filters-grid">
        <div class="f-field">
          <label>Concepto</label>
          <input type="text" [value]="filtros.concepto" (input)="onConcepto($event)" placeholder="Buscar...">
        </div>

        <div class="f-field">
          <label>Descripción</label>
          <input type="text" [value]="filtros.descripcion" (input)="onDescripcion($event)" placeholder="Buscar...">
        </div>

        <div class="f-field f-field-categorias">
          <label>
            Categorías
            <span *ngIf="filtroCategoriaDesdeGrafico" class="chart-filter-badge">
              Desde gráfico
            </span>
          </label>
          <div class="cat-filters">
            <details class="cat-dropdown">
              <summary>
                Incluir
                <span class="cat-count" *ngIf="filtros.categoriasIncluir.length">{{ filtros.categoriasIncluir.length }}</span>
              </summary>
              <div class="cat-list">
                <label class="cat-check">
                  <input type="checkbox" [checked]="incluye('__sin_categoria__')" (change)="toggleIncluirCat('__sin_categoria__')">
                  Sin categoría
                </label>
                <label class="cat-check" *ngFor="let cat of categorias">
                  <input type="checkbox" [checked]="incluye(cat.id!)" (change)="toggleIncluirCat(cat.id!)">
                  <span class="cat-dot" [style.background]="cat.color || '#0ea5e9'"></span>
                  {{ cat.nombre }}
                </label>
              </div>
            </details>

            <details class="cat-dropdown">
              <summary>
                Excluir
                <span class="cat-count" *ngIf="filtros.categoriasExcluir.length">{{ filtros.categoriasExcluir.length }}</span>
              </summary>
              <div class="cat-list">
                <label class="cat-check">
                  <input type="checkbox" [checked]="excluye('__sin_categoria__')" (change)="toggleExcluirCat('__sin_categoria__')">
                  Sin categoría
                </label>
                <label class="cat-check" *ngFor="let cat of categorias">
                  <input type="checkbox" [checked]="excluye(cat.id!)" (change)="toggleExcluirCat(cat.id!)">
                  <span class="cat-dot" [style.background]="cat.color || '#0ea5e9'"></span>
                  {{ cat.nombre }}
                </label>
              </div>
            </details>
          </div>
        </div>

        <div class="f-field">
          <label>Tipo</label>
          <select [value]="filtros.tipo" (change)="onTipo($event)">
            <option value="">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
        </div>
        <div class="f-field">
          <label>Importe Mín</label>
          <input type="number" [value]="filtros.minPrecio" (input)="onMinPrecio($event)" placeholder="0.00">
        </div>
        <div class="f-field">
          <label>Importe Máx</label>
          <input type="number" [value]="filtros.maxPrecio" (input)="onMaxPrecio($event)" placeholder="0.00">
        </div>
        <div class="f-field">
          <label>Fecha mínima</label>
          <input type="date" [value]="filtros.fechaMin" (change)="onFechaMin($event)">
        </div>
        <div class="f-field">
          <label>Fecha máxima</label>
          <input type="date" [value]="filtros.fechaMax" (change)="onFechaMax($event)">
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
    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .filters-header h3 {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .btn-clear {
      background: none;
      border: none;
      color: #0ea5e9;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      padding: 0.3rem 0.6rem;
      border-radius: 8px;
      transition: all 0.15s;
    }
    .btn-clear:hover { background: #f0f9ff; }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
    }
    .f-field { display: flex; flex-direction: column; gap: 0.35rem; }
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
    .f-field-categorias { grid-column: 1 / -1; }
    .cat-filters {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .cat-dropdown {
      flex: 1;
      min-width: 220px;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      background: #fff;
      overflow: hidden;
    }
    .cat-dropdown summary {
      cursor: pointer;
      padding: 0.6rem 0.8rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
    }
    .cat-dropdown summary::-webkit-details-marker { display: none; }
    .cat-dropdown summary::after { content: '\\25BE'; color: #94a3b8; font-size: 0.7rem; }
    .cat-dropdown[open] summary::after { transform: rotate(180deg); }
    .cat-count {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.05rem 0.45rem;
      border-radius: 10px;
    }
    .cat-list {
      border-top: 1px solid #f1f5f9;
      max-height: 200px;
      overflow-y: auto;
      padding: 0.4rem;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .cat-check {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.5rem;
      border-radius: 6px;
      font-size: 0.82rem;
      color: #334155;
      cursor: pointer;
      transition: background 0.12s;
    }
    .cat-check:hover { background: #f8fafc; }
    .cat-check input { accent-color: #0ea5e9; cursor: pointer; }
    .cat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .chart-filter-badge {
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
export class FilterPanelComponent {
  @Input() filtros: FilterValues = {
    concepto: '',
    descripcion: '',
    categoriasIncluir: [],
    categoriasExcluir: [],
    tipo: '',
    minPrecio: null,
    maxPrecio: null,
    fechaMin: '',
    fechaMax: ''
  };
  @Input() categorias: Category[] = [];
  @Input() filtroCategoriaDesdeGrafico: string | null = null;
  @Output() filtrosChange = new EventEmitter<FilterValues>();
  @Output() limpiarFiltrosEvt = new EventEmitter<void>();

  incluye(id: string): boolean {
    return this.filtros.categoriasIncluir.includes(id);
  }

  excluye(id: string): boolean {
    return this.filtros.categoriasExcluir.includes(id);
  }

  toggleIncluirCat(id: string) {
    const arr = this.filtros.categoriasIncluir;
    this.emitir({ categoriasIncluir: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] });
  }

  toggleExcluirCat(id: string) {
    const arr = this.filtros.categoriasExcluir;
    this.emitir({ categoriasExcluir: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] });
  }

  onConcepto(e: Event) {
    this.emitir({ concepto: (e.target as HTMLInputElement).value });
  }

  onDescripcion(e: Event) {
    this.emitir({ descripcion: (e.target as HTMLInputElement).value });
  }

  onTipo(e: Event) {
    this.emitir({ tipo: (e.target as HTMLSelectElement).value });
  }

  onMinPrecio(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.emitir({ minPrecio: v === '' ? null : Number(v) });
  }

  onMaxPrecio(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.emitir({ maxPrecio: v === '' ? null : Number(v) });
  }

  onFechaMin(e: Event) {
    this.emitir({ fechaMin: (e.target as HTMLInputElement).value });
  }

  onFechaMax(e: Event) {
    this.emitir({ fechaMax: (e.target as HTMLInputElement).value });
  }

  private emitir(cambios: Partial<FilterValues>) {
    this.filtrosChange.emit({ ...this.filtros, ...cambios });
  }

  limpiar() {
    this.limpiarFiltrosEvt.emit();
  }
}
