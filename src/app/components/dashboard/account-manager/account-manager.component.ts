import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Account } from '../../../models/account.model';

@Component({
  selector: 'app-account-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="accounts-sidebar">
      <h3>Mis Cuentas</h3>

      <button class="btn-toggle-crear" (click)="toggleCrear()" [class.open]="mostrarCrear">
        <span class="toggle-icon">{{ mostrarCrear ? '&#8722;' : '+' }}</span>
        Nueva cuenta
      </button>

      <div class="crear-cuenta-form" *ngIf="mostrarCrear">
        <div class="input-group">
          <input type="text" [(ngModel)]="nuevoNombre" placeholder="Nueva cuenta..." (keydown.enter)="crear()">
          <button (click)="crear()" title="Crear cuenta">+</button>
        </div>
        <div class="field-row">
          <input type="number" [(ngModel)]="nuevoSaldoInicial" placeholder="Saldo inicial" class="saldo-input" step="0.01">
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
      </div>

      <div class="account-list">
        <div
          *ngFor="let c of cuentas"
          class="account-item"
          [class.selected]="isSelected(c.id!)"
          [class.shared]="c.es_compartida"
          (click)="toggleCuenta(c.id!)">
          <input
            type="checkbox"
            [checked]="isSelected(c.id!)"
            (click)="$event.stopPropagation()"
            (change)="toggleCuenta(c.id!)"
            class="account-checkbox"
          >
          <span class="account-dot" [style.background]="c.color || '#0ea5e9'"></span>
          <span class="account-name">{{ c.nombre }}</span>
          <span *ngIf="c.es_compartida" class="shared-badge" [title]="'Compartida por ' + (c.propietario_email || 'otro usuario')">
            &#128101; <span class="shared-email">{{ c.propietario_email || 'Compartida' }}</span>
          </span>
          <span class="account-edit" (click)="abrirEditar($event, c)" title="Editar">&#9998;</span>
          <span class="account-delete" (click)="eliminar($event, c.id!)" *ngIf="!c.es_compartida">&times;</span>
        </div>
        <div *ngIf="cuentas.length === 0" class="empty-msg">Sin cuentas aún</div>
      </div>

      <div *ngIf="cuentaEditando" class="edit-panel">
        <h4>Editar cuenta</h4>
        <div class="edit-field">
          <label class="edit-label">Nombre</label>
          <input
            type="text"
            [(ngModel)]="editNombre"
            class="edit-name-input"
            placeholder="Nombre de la cuenta"
            (keydown.enter)="guardarEdit()"
          >
        </div>
        <div class="field-row">
          <input type="number" [(ngModel)]="editSaldoInicial" placeholder="Saldo inicial" class="saldo-input" step="0.01">
        </div>
        <div class="edit-color-row">
          <span
            *ngFor="let c of quickColors"
            class="color-pill"
            [class.selected]="editColor === c"
            [style.background]="c"
            (click)="editColor = c">
          </span>
          <input type="color" [(ngModel)]="editColor" class="color-picker-small">
        </div>
        <div class="share-section">
          <label class="share-label">
            <input type="checkbox" [(ngModel)]="editCompartida"> Compartida
          </label>
          <div *ngIf="editCompartida" class="share-input-row">
            <input
              type="email"
              [(ngModel)]="shareEmail"
              placeholder="email@ejemplo.com"
              class="share-input"
              (keydown.enter)="compartir()"
            >
            <button class="btn-share" (click)="compartir()" [disabled]="!shareEmail.trim()">Invitar</button>
          </div>
        </div>
        <div class="edit-actions">
          <button class="btn-save" (click)="guardarEdit()">Guardar</button>
          <button class="btn-cancel" (click)="cancelarEdit()">Cancelar</button>
        </div>
        <button
          *ngIf="!cuentaEditando.es_compartida"
          class="btn-delete-account"
          (click)="eliminarDesdeEdit()">
          Eliminar cuenta
        </button>
      </div>
    </div>
  `,
  styles: [`
    .accounts-sidebar { padding: 0; }
    h3 { margin: 0 0 1rem; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
    .btn-toggle-crear {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.55rem 0.8rem;
      margin-bottom: 1rem;
      background: none;
      border: 1.5px dashed #cbd5e1;
      border-radius: 10px;
      color: #64748b;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-toggle-crear:hover { border-color: #0ea5e9; color: #0ea5e9; background: #f0f9ff; }
    .btn-toggle-crear.open { border-color: #0ea5e9; color: #0ea5e9; border-style: solid; }
    .toggle-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 5px;
      background: #e2e8f0;
      color: #64748b;
      font-weight: 700;
      font-size: 0.9rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .btn-toggle-crear:hover .toggle-icon { background: #0ea5e9; color: #fff; }
    .btn-toggle-crear.open .toggle-icon { background: #0ea5e9; color: #fff; }
    .crear-cuenta-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .input-group { display: flex; gap: 0.4rem; }
    .input-group input {
      flex: 1;
      padding: 0.5rem 0.7rem;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      font-size: 0.82rem;
      transition: border-color 0.2s;
    }
    .input-group input:focus { outline: none; border-color: #0ea5e9; }
    .input-group button {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      border: none;
      padding: 0.5rem 0.8rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.95rem;
      box-shadow: 0 2px 8px rgba(14,165,233,0.25);
      transition: all 0.2s;
    }
    .input-group button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(14,165,233,0.35); }
    .field-row { display: flex; gap: 0.4rem; }
    .saldo-input {
      padding: 0.45rem 0.6rem;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-size: 0.8rem;
      outline: none;
      flex: 1;
      min-width: 0;
    }
    .saldo-input:focus { border-color: #0ea5e9; }
    .color-row {
      display: flex;
      gap: 0.3rem;
      align-items: center;
    }
    .color-pill {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.15s;
    }
    .color-pill:hover { transform: scale(1.15); }
    .color-pill.selected { border-color: #334155; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #334155; }
    .color-picker-small {
      width: 22px;
      height: 22px;
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: 50%;
      overflow: hidden;
    }
    .account-list { display: flex; flex-direction: column; gap: 0.2rem; }
    .account-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.55rem 0.7rem;
      background: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.85rem;
      color: #334155;
      transition: all 0.15s;
      text-align: left;
      border: 1.5px solid transparent;
    }
    .account-item:hover { background: #f1f5f9; }
    .account-item.selected { background: #e0f2fe; border-color: #bae6fd; }
    .account-item.shared { border-left: 3px solid #8b5cf6; }
    .account-checkbox {
      width: 16px;
      height: 16px;
      accent-color: #0ea5e9;
      cursor: pointer;
      flex-shrink: 0;
    }
    .account-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .account-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .shared-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.68rem;
      font-weight: 600;
      color: #7c3aed;
      background: #ede9fe;
      padding: 0.1rem 0.45rem;
      border-radius: 6px;
      max-width: 110px;
      white-space: nowrap;
      flex-shrink: 1;
    }
    .shared-email {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .account-edit {
      color: #94a3b8;
      font-size: 0.8rem;
      padding: 0.15rem 0.3rem;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.15s;
    }
    .account-item:hover .account-edit { opacity: 1; }
    .account-edit:hover { color: #0ea5e9; background: #e0f2fe; }
    .account-delete {
      color: #94a3b8;
      font-weight: 700;
      font-size: 1rem;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.15s;
      line-height: 1;
    }
    .account-item:hover .account-delete { opacity: 1; }
    .account-delete:hover { color: #ef4444; background: #fef2f2; }
    .empty-msg { color: #94a3b8; font-size: 0.8rem; padding: 0.5rem; text-align: center; }

    .edit-panel {
      background: #f8fafb;
      border-radius: 10px;
      padding: 0.8rem;
      margin-top: 0.8rem;
      border: 1.5px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .edit-panel h4 {
      margin: 0;
      font-size: 0.78rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .edit-field { display: flex; flex-direction: column; gap: 0.3rem; }
    .edit-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .edit-name-input {
      padding: 0.45rem 0.6rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.82rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .edit-name-input:focus { border-color: #0ea5e9; }
    .edit-color-row {
      display: flex;
      gap: 0.3rem;
      align-items: center;
    }
    .share-section { display: flex; flex-direction: column; gap: 0.4rem; }
    .share-label {
      font-size: 0.8rem;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
    }
    .share-label input { accent-color: #8b5cf6; }
    .share-input-row { display: flex; gap: 0.3rem; }
    .share-input {
      flex: 1;
      padding: 0.4rem 0.6rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.8rem;
      outline: none;
    }
    .share-input:focus { border-color: #8b5cf6; }
    .btn-share {
      background: #8b5cf6;
      color: white;
      border: none;
      padding: 0.4rem 0.7rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.78rem;
      transition: all 0.15s;
    }
    .btn-share:hover:not(:disabled) { background: #7c3aed; }
    .btn-share:disabled { opacity: 0.5; cursor: not-allowed; }
    .edit-actions { display: flex; gap: 0.4rem; }
    .btn-save {
      flex: 1;
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
    .btn-cancel {
      background: none;
      border: 1.5px solid #e2e8f0;
      color: #64748b;
      padding: 0.45rem 0.7rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      transition: all 0.15s;
    }
    .btn-cancel:hover { background: #f1f5f9; }
    .btn-delete-account {
      background: none;
      border: 1.5px solid #fecaca;
      color: #ef4444;
      padding: 0.45rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      width: 100%;
      transition: all 0.15s;
    }
    .btn-delete-account:hover { background: #fef2f2; }
  `]
})
export class AccountManagerComponent {
  @Input() cuentas: Account[] = [];
  @Input() cuentasSeleccionadas: number[] = [];
  @Output() cuentaCreada = new EventEmitter<{ nombre: string; color: string; saldoInicial: number }>();
  @Output() cuentaActualizada = new EventEmitter<{ id: number; nombre: string; color: string; saldoInicial: number }>();
  @Output() cuentaEliminada = new EventEmitter<number>();
  @Output() cuentasSeleccionadasChange = new EventEmitter<number[]>();
  @Output() compartirCuenta = new EventEmitter<{ cuentaId: number; email: string }>();

  quickColors = ['#0ea5e9', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#64748b'];

  nuevoNombre = '';
  nuevoColor = '#0ea5e9';
  nuevoSaldoInicial = 0;
  mostrarCrear = false;
  cuentaEditando: Account | null = null;
  editColor = '#0ea5e9';
  editNombre = '';
  editSaldoInicial = 0;
  editCompartida = false;
  shareEmail = '';

  isSelected(id: number): boolean {
    return this.cuentasSeleccionadas.includes(id);
  }

  toggleCuenta(id: number) {
    const index = this.cuentasSeleccionadas.indexOf(id);
    if (index >= 0) {
      this.cuentasSeleccionadas = this.cuentasSeleccionadas.filter(i => i !== id);
    } else {
      this.cuentasSeleccionadas = [...this.cuentasSeleccionadas, id];
    }
    this.cuentasSeleccionadasChange.emit(this.cuentasSeleccionadas);
  }

  toggleCrear() {
    this.mostrarCrear = !this.mostrarCrear;
    if (this.mostrarCrear) {
      this.nuevoNombre = '';
      this.nuevoColor = '#0ea5e9';
      this.nuevoSaldoInicial = 0;
    }
  }

  crear() {
    if (!this.nuevoNombre.trim()) return;
    this.cuentaCreada.emit({
      nombre: this.nuevoNombre.trim(),
      color: this.nuevoColor,
      saldoInicial: Number(this.nuevoSaldoInicial) || 0
    });
    this.nuevoNombre = '';
    this.nuevoColor = '#0ea5e9';
    this.nuevoSaldoInicial = 0;
    this.mostrarCrear = false;
  }

  abrirEditar(event: Event, cuenta: Account) {
    event.stopPropagation();
    this.cuentaEditando = cuenta;
    this.editColor = cuenta.color || '#0ea5e9';
    this.editNombre = cuenta.nombre;
    this.editSaldoInicial = Number(cuenta.saldo_inicial) || 0;
    this.editCompartida = cuenta.es_compartida || false;
    this.shareEmail = '';
  }

  guardarEdit() {
    if (!this.cuentaEditando?.id || !this.editNombre.trim()) return;
    this.cuentaActualizada.emit({
      id: this.cuentaEditando.id,
      nombre: this.editNombre.trim(),
      color: this.editColor,
      saldoInicial: Number(this.editSaldoInicial) || 0
    });
    this.cuentaEditando = null;
  }

  cancelarEdit() {
    this.cuentaEditando = null;
    this.editNombre = '';
    this.shareEmail = '';
  }

  eliminarDesdeEdit() {
    if (!this.cuentaEditando?.id) return;
    if (confirm('¿Eliminar cuenta?')) {
      const id = this.cuentaEditando.id;
      this.cuentaEditando = null;
      this.editNombre = '';
      this.cuentaEliminada.emit(id);
    }
  }

  compartir() {
    if (!this.cuentaEditando?.id || !this.shareEmail.trim()) return;
    this.compartirCuenta.emit({ cuentaId: this.cuentaEditando.id, email: this.shareEmail.trim() });
    this.shareEmail = '';
  }

  eliminar(event: Event, id: number) {
    event.stopPropagation();
    if (confirm('¿Eliminar cuenta?')) {
      this.cuentaEliminada.emit(id);
    }
  }
}
