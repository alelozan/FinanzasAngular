import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="categorias-sidebar">
      <div class="header">
        <h3>Categorías</h3>
        <button class="btn-add" (click)="toggleCrear()" title="Nueva categoría">+</button>
      </div>

      <div *ngIf="mostrarCrear" class="crear-form">
        <input
          type="text"
          [(ngModel)]="nuevoNombre"
          placeholder="Nombre..."
          (keydown.enter)="confirmarCrear()"
          class="crear-input"
          autofocus
        >
        <div class="crear-tipo-row">
          <button
            class="tipo-btn tipo-ingreso"
            [class.active]="nuevoTipo === 'ingreso'"
            (click)="nuevoTipo = 'ingreso'">
            Ingreso
          </button>
          <button
            class="tipo-btn tipo-gasto"
            [class.active]="nuevoTipo === 'gasto'"
            (click)="nuevoTipo = 'gasto'">
            Gasto
          </button>
        </div>
        <div class="color-row">
          <span
            *ngFor="let c of quickColors"
            class="color-pill"
            [class.selected]="nuevoColor === c"
            [style.background]="c"
            (click)="nuevoColor = c">
          </span>
          <input type="color" [(ngModel)]="nuevoColor" class="color-picker-small" title="Color personalizado">
        </div>
        <button class="btn-confirm" (click)="confirmarCrear()" [disabled]="!nuevoNombre.trim()">Crear</button>
      </div>

      <details class="grupo" open>
        <summary class="grupo-header grupo-ingresos">
          <span class="grupo-dot dot-ingreso"></span>
          Ingresos
          <span class="grupo-count">{{ catsIngresos.length }}</span>
        </summary>
        <div class="categoria-list">
          <div *ngFor="let cat of catsIngresos" class="categoria-item">
            <ng-container *ngIf="editandoId === cat.id; else displayIngreso">
              <div class="edit-container">
                <div class="edit-row">
                  <input type="text" [(ngModel)]="editNombre" (keydown.enter)="guardarEdit(cat.id)" (keydown.escape)="cancelarEdit()" class="edit-input" autofocus>
                  <button class="btn-check" (click)="guardarEdit(cat.id)" title="Guardar">&#10003;</button>
                </div>
                <div class="edit-tipo-row">
                  <button class="tipo-btn tipo-ingreso" [class.active]="editTipo === 'ingreso'" (click)="editTipo = 'ingreso'">Ingreso</button>
                  <button class="tipo-btn tipo-gasto" [class.active]="editTipo === 'gasto'" (click)="editTipo = 'gasto'">Gasto</button>
                </div>
                <div class="color-row">
                  <span
                    *ngFor="let c of quickColors"
                    class="color-pill"
                    [class.selected]="editColor === c"
                    [style.background]="c"
                    (click)="editColor = c">
                  </span>
                  <input type="color" [(ngModel)]="editColor" class="color-picker-small">
                </div>
              </div>
            </ng-container>
            <ng-template #displayIngreso>
              <div class="cat-item-content" [style.background]="hexToRgba(cat.color || '#0ea5e9', 0.08)">
                <span class="cat-dot" [style.background]="cat.color || '#0ea5e9'"></span>
                <span class="cat-nombre">{{ cat.nombre }}</span>
                <div class="cat-actions">
                  <button class="btn-icon btn-edit" (click)="iniciarEdit(cat)" title="Editar">&#9998;</button>
                  <button class="btn-icon btn-delete" (click)="eliminar(cat.id)" title="Eliminar"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
              </div>
            </ng-template>
          </div>
          <div *ngIf="catsIngresos.length === 0" class="empty-msg">Sin categorías</div>
        </div>
      </details>

      <details class="grupo" open>
        <summary class="grupo-header grupo-gastos">
          <span class="grupo-dot dot-gasto"></span>
          Gastos
          <span class="grupo-count">{{ catsGastos.length }}</span>
        </summary>
        <div class="categoria-list">
          <div *ngFor="let cat of catsGastos" class="categoria-item">
            <ng-container *ngIf="editandoId === cat.id; else displayGasto">
              <div class="edit-container">
                <div class="edit-row">
                  <input type="text" [(ngModel)]="editNombre" (keydown.enter)="guardarEdit(cat.id)" (keydown.escape)="cancelarEdit()" class="edit-input" autofocus>
                  <button class="btn-check" (click)="guardarEdit(cat.id)" title="Guardar">&#10003;</button>
                </div>
                <div class="edit-tipo-row">
                  <button class="tipo-btn tipo-ingreso" [class.active]="editTipo === 'ingreso'" (click)="editTipo = 'ingreso'">Ingreso</button>
                  <button class="tipo-btn tipo-gasto" [class.active]="editTipo === 'gasto'" (click)="editTipo = 'gasto'">Gasto</button>
                </div>
                <div class="color-row">
                  <span
                    *ngFor="let c of quickColors"
                    class="color-pill"
                    [class.selected]="editColor === c"
                    [style.background]="c"
                    (click)="editColor = c">
                  </span>
                  <input type="color" [(ngModel)]="editColor" class="color-picker-small">
                </div>
              </div>
            </ng-container>
            <ng-template #displayGasto>
              <div class="cat-item-content" [style.background]="hexToRgba(cat.color || '#0ea5e9', 0.08)">
                <span class="cat-dot" [style.background]="cat.color || '#0ea5e9'"></span>
                <span class="cat-nombre">{{ cat.nombre }}</span>
                <div class="cat-actions">
                  <button class="btn-icon btn-edit" (click)="iniciarEdit(cat)" title="Editar">&#9998;</button>
                  <button class="btn-icon btn-delete" (click)="eliminar(cat.id)" title="Eliminar"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
              </div>
            </ng-template>
          </div>
          <div *ngIf="catsGastos.length === 0" class="empty-msg">Sin categorías</div>
        </div>
      </details>

      <details class="grupo" *ngIf="catsSinTipo.length > 0">
        <summary class="grupo-header grupo-sintipo">
          <span class="grupo-dot dot-sintipo"></span>
          Sin tipo
          <span class="grupo-count">{{ catsSinTipo.length }}</span>
        </summary>
        <div class="categoria-list">
          <div *ngFor="let cat of catsSinTipo" class="categoria-item">
            <ng-container *ngIf="editandoId === cat.id; else displaySinTipo">
              <div class="edit-container">
                <div class="edit-row">
                  <input type="text" [(ngModel)]="editNombre" (keydown.enter)="guardarEdit(cat.id)" (keydown.escape)="cancelarEdit()" class="edit-input" autofocus>
                  <button class="btn-check" (click)="guardarEdit(cat.id)" title="Guardar">&#10003;</button>
                </div>
                <div class="edit-tipo-row">
                  <button class="tipo-btn tipo-ingreso" [class.active]="editTipo === 'ingreso'" (click)="editTipo = 'ingreso'">Ingreso</button>
                  <button class="tipo-btn tipo-gasto" [class.active]="editTipo === 'gasto'" (click)="editTipo = 'gasto'">Gasto</button>
                </div>
                <div class="color-row">
                  <span
                    *ngFor="let c of quickColors"
                    class="color-pill"
                    [class.selected]="editColor === c"
                    [style.background]="c"
                    (click)="editColor = c">
                  </span>
                  <input type="color" [(ngModel)]="editColor" class="color-picker-small">
                </div>
              </div>
            </ng-container>
            <ng-template #displaySinTipo>
              <div class="cat-item-content" [style.background]="hexToRgba(cat.color || '#0ea5e9', 0.08)">
                <span class="cat-dot" [style.background]="cat.color || '#0ea5e9'"></span>
                <span class="cat-nombre">{{ cat.nombre }}</span>
                <div class="cat-actions">
                  <button class="btn-icon btn-edit" (click)="iniciarEdit(cat)" title="Editar">&#9998;</button>
                  <button class="btn-icon btn-delete" (click)="eliminar(cat.id)" title="Eliminar"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </details>
    </div>
  `,
  styles: [`
    .categorias-sidebar { padding: 0; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .header h3 { margin: 0; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .btn-add {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 1.1rem;
      line-height: 1;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(14,165,233,0.25);
      transition: all 0.2s;
    }
    .btn-add:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(14,165,233,0.35); }
    .crear-form {
      background: #f8fafb;
      border-radius: 10px;
      padding: 0.8rem;
      margin-bottom: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border: 1.5px solid #e2e8f0;
    }
    .crear-input {
      padding: 0.45rem 0.6rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.82rem;
      outline: none;
    }
    .crear-input:focus { border-color: #0ea5e9; }
    .crear-tipo-row { display: flex; gap: 0.4rem; }
    .tipo-btn {
      flex: 1;
      padding: 0.35rem;
      border-radius: 8px;
      border: 1.5px solid #e2e8f0;
      background: #fff;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tipo-btn.tipo-ingreso.active {
      background: #d1fae5;
      border-color: #10b981;
      color: #065f46;
    }
    .tipo-btn.tipo-gasto.active {
      background: #fee2e2;
      border-color: #ef4444;
      color: #991b1b;
    }
    .color-row {
      display: flex;
      gap: 0.35rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .color-pill {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.15s;
    }
    .color-pill:hover { transform: scale(1.15); }
    .color-pill.selected { border-color: #334155; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #334155; }
    .color-picker-small {
      width: 24px;
      height: 24px;
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
      padding: 0.45rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      transition: all 0.2s;
    }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

    .grupo { margin-bottom: 0.5rem; }
    .grupo-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.6rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      cursor: pointer;
      user-select: none;
      list-style: none;
      transition: background 0.15s;
    }
    .grupo-header::-webkit-details-marker { display: none; }
    .grupo-header:hover { background: #f1f5f9; }
    .grupo-ingresos { color: #065f46; }
    .grupo-gastos { color: #991b1b; }
    .grupo-sintipo { color: #64748b; }
    .grupo-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-ingreso { background: #10b981; }
    .dot-gasto { background: #ef4444; }
    .dot-sintipo { background: #94a3b8; }
    .grupo-count {
      margin-left: auto;
      background: #f1f5f9;
      padding: 0.1rem 0.4rem;
      border-radius: 10px;
      font-size: 0.65rem;
      font-weight: 600;
      color: #64748b;
    }

    .categoria-list { display: flex; flex-direction: column; gap: 0.1rem; padding: 0.3rem 0; }
    .categoria-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 0.4rem 0.6rem;
      border-radius: 8px;
      font-size: 0.83rem;
      color: #334155;
      transition: background 0.15s;
      box-sizing: border-box;
      min-height: 32px;
    }
    .categoria-item:hover { background: #f1f5f9; }
    .cat-item-content {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0.3rem 0.5rem;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .cat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-right: 0.4rem;
    }
    .cat-nombre { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .cat-actions { display: flex; gap: 0.1rem; opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
    .categoria-item:hover .cat-actions { opacity: 1; }
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
    .edit-row { display: flex; gap: 0.3rem; width: 100%; align-items: center; }
    .edit-container {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      width: 100%;
    }
    .edit-tipo-row { display: flex; gap: 0.3rem; }
    .edit-input {
      flex: 1;
      padding: 0.3rem 0.5rem;
      border: 1.5px solid #0ea5e9;
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
      min-width: 0;
    }
    .btn-check {
      background: #10b981;
      color: white;
      border: none;
      width: 26px;
      height: 26px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.85rem;
      line-height: 1;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .btn-check:hover { opacity: 0.9; }
    .empty-msg { color: #94a3b8; font-size: 0.75rem; padding: 0.3rem 0.5rem; }
  `]
})
export class SidebarCategoriaComponent implements OnChanges {
  @Input() categorias: any[] = [];
  @Output() onNuevaCategoria = new EventEmitter<{ nombre: string; tipo: string; color: string }>();
  @Output() onUpdateCategoria = new EventEmitter<{ id: string; nombre: string; tipo: string; color: string }>();
  @Output() onDeleteCategoria = new EventEmitter<string>();

  quickColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#64748b'];

  catsIngresos: any[] = [];
  catsGastos: any[] = [];
  catsSinTipo: any[] = [];

  editandoId: any = null;
  editNombre = '';
  editTipo = 'gasto';
  editColor = '#0ea5e9';
  mostrarCrear = false;
  nuevoNombre = '';
  nuevoTipo = 'gasto';
  nuevoColor = '#0ea5e9';

  ngOnChanges() {
    this.catsIngresos = this.categorias.filter(c => c.tipo === 'ingreso');
    this.catsGastos = this.categorias.filter(c => c.tipo === 'gasto');
    this.catsSinTipo = this.categorias.filter(c => !c.tipo);
  }

  toggleCrear() {
    this.mostrarCrear = !this.mostrarCrear;
    if (this.mostrarCrear) {
      this.nuevoNombre = '';
      this.nuevoTipo = 'gasto';
      this.nuevoColor = '#0ea5e9';
    }
  }

  confirmarCrear() {
    if (!this.nuevoNombre.trim()) return;
    this.onNuevaCategoria.emit({ nombre: this.nuevoNombre.trim(), tipo: this.nuevoTipo, color: this.nuevoColor });
    this.nuevoNombre = '';
    this.nuevoTipo = 'gasto';
    this.nuevoColor = '#0ea5e9';
    this.mostrarCrear = false;
  }

  iniciarEdit(cat: any) {
    this.editandoId = cat.id;
    this.editNombre = cat.nombre;
    this.editTipo = cat.tipo || 'gasto';
    this.editColor = cat.color || '#0ea5e9';
  }

  guardarEdit(id: any) {
    if (!this.editNombre.trim()) return;
    this.onUpdateCategoria.emit({ id: String(id), nombre: this.editNombre.trim(), tipo: this.editTipo, color: this.editColor });
    this.editandoId = null;
    this.editNombre = '';
    this.editTipo = 'gasto';
    this.editColor = '#0ea5e9';
  }

  cancelarEdit() {
    this.editandoId = null;
    this.editNombre = '';
    this.editTipo = 'gasto';
    this.editColor = '#0ea5e9';
  }

  eliminar(id: any) {
    if (confirm('¿Eliminar categoría?')) {
      this.onDeleteCategoria.emit(String(id));
    }
  }

  hexToRgba(hex: string, alpha: number): string {
    if (!hex || hex.length < 7) return `rgba(148,163,184,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
