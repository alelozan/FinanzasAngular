import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Movement } from '../../../models/movement.model';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-movements-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <table>
      <thead>
        <tr>
          <th class="col-expand"></th>
          <th>Fecha</th>
          <th>Cuenta</th>
          <th>Concepto</th>
          <th>Categoría</th>
          <th class="text-right">Importe</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <ng-container *ngFor="let m of paginados; trackBy: trackById">
          <tr class="row-animate"
            [class.row-expanded]="expandedId === m.id"
            [style.border-left]="'4px solid ' + (m.cuentas?.color || 'transparent')"
            [style.background]="hexToRgba(m.cuentas?.color || '#f8fafc', 0.04)">
            <td class="col-expand">
              <button
                class="btn-expand"
                [class.active]="expandedId === m.id"
                (click)="toggleExpand(m)"
                [title]="expandedId === m.id ? 'Colapsar' : 'Expandir'">
                <span class="expand-icon" [class.rotated]="expandedId === m.id">&#9654;</span>
              </button>
            </td>
            <td>{{ m.fecha | date:'dd/MM/yyyy' }}</td>
            <td>
              <span class="badge-account" [style.background]="hexToRgba(m.cuentas?.color || '#94a3b8', 0.12)" [style.color]="m.cuentas?.color || '#475569'">
                {{ m.cuentas?.nombre }}
              </span>
            </td>
            <td class="concepto-cell">
              {{ m.concepto }}
              <span *ngIf="m.conciliado" class="concil-badge" title="Conciliado">&#128279;</span>
            </td>
            <td>
              <ng-container *ngIf="editandoMovimientoId !== (m.id ?? null); else editCategoria">
                <span
                  class="badge badge-categoria"
                  [style.background]="hexToRgba(m.categorias?.color || '#0ea5e9', 0.12)"
                  [style.color]="m.categorias?.color || '#0284c7'"
                  [style.border-color]="hexToRgba(m.categorias?.color || '#0ea5e9', 0.3)"
                  (click)="editarCategoria(m)">
                  {{ m.categorias?.nombre || 'Sin categoría' }}
                </span>
              </ng-container>
              <ng-template #editCategoria>
                <div class="cat-edit-container">
                  <input
                    type="text"
                    [(ngModel)]="catSearchText"
                    placeholder="Buscar..."
                    class="cat-search-input"
                    (keydown.escape)="cancelarEdicion()"
                  >
                  <select
                    #catSelect
                    (change)="onCategoriaChange(catSelect.value)"
                    (blur)="cancelarEdicion()"
                    size="5"
                    class="cat-select-list"
                  >
                    <option value="">Sin categoría</option>
                    <option *ngFor="let cat of categoriasFiltradas(m)" [value]="cat.id">
                      {{ cat.nombre }}
                    </option>
                  </select>
                </div>
              </ng-template>
            </td>
            <td class="text-right" [ngClass]="m.importe > 0 ? 'text-success' : 'text-danger'">
              <strong>{{ m.importe | number:'1.2-2' }}&euro;</strong>
            </td>
            <td><button (click)="editar.emit(m)" class="btn-icon">&#9998;</button></td>
          </tr>

          <tr *ngIf="expandedId === m.id" class="row-expanded-panel">
            <td colspan="7">
              <div class="expanded-content">
                <div class="desc-section">
                  <label class="desc-label">Descripción</label>
                  <div class="desc-row">
                    <input
                      type="text"
                      [(ngModel)]="editDescripcion"
                      placeholder="Añadir descripción..."
                      class="desc-input"
                      (keydown.enter)="guardarDescripcion(m)"
                    >
                    <button
                      class="btn-save-desc"
                      (click)="guardarDescripcion(m)"
                      [disabled]="editDescripcion === (m.descripcion || '')"
                      title="Guardar descripción">
                      &#10003;
                    </button>
                  </div>
                </div>
                <div class="concil-section" *ngIf="m.conciliaciones && m.conciliaciones.length > 0">
                  <label class="desc-label">Conciliaciones</label>
                  <div class="concil-tags">
                    <span class="concil-tag" *ngFor="let c of m.conciliaciones">
                      {{ c.contraparte_concepto || 'Movimiento' }}
                      <b>{{ c.contraparte_importe | number:'1.2-2' }} €</b>
                    </span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </ng-container>

        <tr *ngIf="movimientos.length === 0">
          <td colspan="7" class="empty-msg">No hay movimientos para mostrar</td>
        </tr>
      </tbody>
    </table>

    <div class="pagination-footer" *ngIf="movimientos.length > 0">
      <div class="page-size">
        <label>Mostrar</label>
        <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()" class="page-size-select">
          <option [ngValue]="25">25</option>
          <option [ngValue]="50">50</option>
          <option [ngValue]="100">100</option>
        </select>
      </div>

      <div class="page-info">{{ inicio }}–{{ fin }} de {{ movimientos.length }}</div>

      <div class="page-controls">
        <button (click)="irAPagina(1)" [disabled]="currentPage === 1" title="Primera página">&#171;</button>
        <button (click)="paginaAnterior()" [disabled]="currentPage === 1" title="Anterior">&#8249;</button>
        <span class="page-current">Pág. {{ currentPage }} / {{ totalPages }}</span>
        <button (click)="paginaSiguiente()" [disabled]="currentPage === totalPages" title="Siguiente">&#8250;</button>
        <button (click)="irAPagina(totalPages)" [disabled]="currentPage === totalPages" title="Última página">&#187;</button>
      </div>
    </div>
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; }
    th {
      padding: 0.8rem 1rem;
      text-align: left;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 2px solid #f1f5f9;
    }
    td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f8fafc;
      text-align: left;
      font-size: 0.88rem;
      color: #334155;
    }
    .col-expand { width: 36px; padding: 0.4rem 0.5rem; }
    .row-animate { animation: fadeIn 0.2s ease-out; transition: border-left 0.2s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .row-expanded td { background: #f8fafc; border-bottom-color: #e2e8f0; }
    .concepto-cell { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .concil-badge {
      display: inline-block;
      margin-left: 0.3rem;
      font-size: 0.72rem;
      color: #7c3aed;
      vertical-align: middle;
    }
    .badge-account {
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.72rem;
    }
    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .badge-categoria { cursor: pointer; transition: all 0.15s; }
    .badge-categoria:hover { opacity: 0.8; }
    .cat-edit-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 160px;
    }
    .cat-search-input {
      padding: 0.3rem 0.5rem;
      border-radius: 6px;
      border: 1.5px solid #0ea5e9;
      font-size: 0.78rem;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .cat-select-list {
      padding: 0.2rem;
      border-radius: 8px;
      border: 1.5px solid #0ea5e9;
      font-size: 0.78rem;
      background: white;
      cursor: pointer;
      outline: none;
    }
    .cat-select-list option { padding: 0.3rem 0.5rem; }
    .cat-select-list option:checked { background: #e0f2fe; }
    .text-right { text-align: right; }
    .text-success { color: #10b981; }
    .text-danger { color: #ef4444; }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.3rem;
      border-radius: 6px;
      transition: background 0.15s;
      color: #94a3b8;
    }
    .btn-icon:hover { background: #f1f5f9; color: #0ea5e9; }
    .empty-msg { text-align: center; color: #94a3b8; padding: 2rem; font-size: 0.9rem; }

    .btn-expand {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      color: #94a3b8;
    }
    .btn-expand:hover { background: #e2e8f0; color: #64748b; }
    .btn-expand.active { color: #0ea5e9; }
    .expand-icon {
      font-size: 0.55rem;
      display: inline-block;
      transition: transform 0.2s ease;
    }
    .expand-icon.rotated { transform: rotate(90deg); }

    .row-expanded-panel td {
      padding: 0;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    .expanded-content {
      padding: 0.8rem 1rem 1rem 2.5rem;
      animation: slideDown 0.2s ease-out;
    }
    @keyframes slideDown {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 200px; }
    }
    .desc-section { max-width: 500px; }
    .concil-section { max-width: 500px; margin-top: 0.9rem; }
    .concil-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .concil-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.6rem;
      background: #ede9fe;
      color: #5b21b6;
      border-radius: 6px;
      font-size: 0.75rem;
    }
    .concil-tag b { font-weight: 700; }
    .desc-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.3rem;
      display: block;
    }
    .desc-row { display: flex; gap: 0.4rem; align-items: center; }
    .desc-input {
      flex: 1;
      padding: 0.5rem 0.7rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .desc-input:focus { border-color: #0ea5e9; }
    .btn-save-desc {
      background: #10b981;
      color: white;
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .btn-save-desc:hover:not(:disabled) { background: #059669; }
    .btn-save-desc:disabled { opacity: 0.4; cursor: not-allowed; }

    .pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 0 0;
      flex-wrap: wrap;
    }
    .page-size {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.78rem;
      color: #64748b;
    }
    .page-size-select {
      padding: 0.35rem 0.5rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.8rem;
      background: #fff;
      outline: none;
    }
    .page-size-select:focus { border-color: #0ea5e9; }
    .page-info {
      font-size: 0.78rem;
      color: #64748b;
    }
    .page-controls {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .page-controls button {
      background: #fff;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.35rem 0.6rem;
      cursor: pointer;
      font-size: 0.85rem;
      color: #334155;
      transition: all 0.15s;
      min-width: 32px;
    }
    .page-controls button:hover:not(:disabled) {
      border-color: #0ea5e9;
      color: #0ea5e9;
    }
    .page-controls button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .page-current {
      font-size: 0.78rem;
      font-weight: 600;
      color: #334155;
      padding: 0 0.4rem;
    }
  `]
})
export class MovementsTableComponent implements OnChanges {
  @Input() movimientos: Movement[] = [];
  @Input() categoriasPorCuenta: Map<number, Category[]> = new Map();
  @Output() editar = new EventEmitter<Movement>();
  @Output() onCambiarCategoriaMovimiento = new EventEmitter<{ movimientoId: string; nuevaCategoriaId: string }>();
  @Output() onActualizarDescripcion = new EventEmitter<{ movimientoId: string; descripcion: string }>();

  editandoMovimientoId: string | null = null;
  catSearchText = '';
  expandedId: string | null = null;
  editDescripcion = '';

  pageSize = 25;
  currentPage = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.movimientos.length / this.pageSize));
  }

  get paginados(): Movement[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.movimientos.slice(start, start + this.pageSize);
  }

  get inicio(): number {
    return this.movimientos.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get fin(): number {
    return Math.min(this.currentPage * this.pageSize, this.movimientos.length);
  }

  ngOnChanges() {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
  }

  paginaAnterior() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  paginaSiguiente() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  irAPagina(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  hexToRgba(hex: string, alpha: number): string {
    if (!hex || hex.length < 7) return `rgba(148,163,184,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  trackById(index: number, item: Movement): string {
    return item.id || String(index);
  }

  toggleExpand(m: Movement) {
    if (this.expandedId === m.id) {
      this.expandedId = null;
      this.editDescripcion = '';
    } else {
      this.expandedId = m.id || null;
      this.editDescripcion = m.descripcion || '';
    }
  }

  guardarDescripcion(m: Movement) {
    if (!m.id) return;
    this.onActualizarDescripcion.emit({
      movimientoId: m.id,
      descripcion: this.editDescripcion.trim()
    });
  }

  categoriasFiltradas(m: Movement): Category[] {
    const esIngreso = (m.importe ?? 0) > 0;
    const tipo = esIngreso ? 'ingreso' : 'gasto';
    const fuente = (m.cuenta_id != null ? this.categoriasPorCuenta.get(m.cuenta_id) : null) || [];
    let cats = fuente.filter(c => !c.tipo || c.tipo === tipo);
    if (this.catSearchText.trim()) {
      const search = this.catSearchText.toLowerCase();
      cats = cats.filter(c => c.nombre.toLowerCase().includes(search));
    }
    return cats;
  }

  editarCategoria(m: Movement) {
    this.editandoMovimientoId = m.id ?? null;
    this.catSearchText = '';
  }

  onCategoriaChange(nuevaCategoriaId: string) {
    const movimientoId = this.editandoMovimientoId;
    this.editandoMovimientoId = null;
    this.catSearchText = '';
    if (movimientoId == null) return;
    this.onCambiarCategoriaMovimiento.emit({
      movimientoId: String(movimientoId),
      nuevaCategoriaId,
    });
  }

  cancelarEdicion() {
    setTimeout(() => {
      this.editandoMovimientoId = null;
      this.catSearchText = '';
    });
  }
}
