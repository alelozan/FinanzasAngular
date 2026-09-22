import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Account } from '../../../models/account.model';

@Component({
  selector: 'app-account-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="top-nav">
      <div class="nav-container">
        <div class="logo">
          <span class="logo-icon">$</span>
          <span class="logo-text">FinanzasPro</span>
        </div>
        <div class="center-info">
          <span class="visualizando-label">Visualizando:</span>
          <span class="visualizando-cuentas" *ngIf="cuentasSeleccionadas.length === 0">Todas las cuentas</span>
          <span class="visualizando-cuentas" *ngIf="cuentasSeleccionadas.length >= 1">{{ getNombresSeleccionadas() }}</span>
        </div>
        <div class="user-area">
          <button (click)="logout.emit()" class="btn-logout">Salir</button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .top-nav {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 0.8rem 1.5rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-container {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .logo-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #0ea5e9, #10b981);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 1.1rem;
      font-family: 'Space Grotesk', sans-serif;
      box-shadow: 0 4px 12px rgba(14,165,233,0.25);
    }
    .logo-text {
      font-weight: 700;
      font-size: 1.1rem;
      font-family: 'Space Grotesk', sans-serif;
      color: #0f172a;
    }
    .center-info {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .visualizando-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
    }
    .visualizando-cuentas {
      font-size: 0.82rem;
      font-weight: 700;
      color: #0ea5e9;
      background: #e0f2fe;
      padding: 0.2rem 0.7rem;
      border-radius: 8px;
    }
    .user-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-logout {
      background: none;
      border: 1.5px solid #fecaca;
      color: #ef4444;
      padding: 0.45rem 1rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      transition: all 0.2s;
    }
    .btn-logout:hover {
      background: #fef2f2;
      border-color: #ef4444;
    }
  `]
})
export class AccountSelectorComponent {
  @Input() cuentas: Account[] = [];
  @Input() cuentasSeleccionadas: number[] = [];
  @Output() logout = new EventEmitter<void>();

  getNombresSeleccionadas(): string {
    const nombres = this.cuentasSeleccionadas
      .map(id => this.cuentas.find(c => c.id === id)?.nombre)
      .filter(n => !!n);
    return nombres.join(', ');
  }
}
