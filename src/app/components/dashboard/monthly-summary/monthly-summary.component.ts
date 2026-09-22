import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movement } from '../../../models/movement.model';

@Component({
  selector: 'app-monthly-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-grid">
      <div class="kpi-card kpi-balance">
        <div class="kpi-label">Balance</div>
        <div class="kpi-value" [ngClass]="balance >= 0 ? 'positive' : 'negative'">{{ balance | number:'1.2-2' }}&euro;</div>
        <div class="kpi-bar balance-bar"></div>
      </div>
      <div class="kpi-card kpi-income">
        <div class="kpi-label">Ingresos</div>
        <div class="kpi-value positive">{{ totalIngresos | number:'1.2-2' }}&euro;</div>
        <div class="kpi-bar income-bar"></div>
      </div>
      <div class="kpi-card kpi-expense">
        <div class="kpi-label">Gastos</div>
        <div class="kpi-value negative">{{ totalGastos | number:'1.2-2' }}&euro;</div>
        <div class="kpi-bar expense-bar"></div>
      </div>
      <div class="kpi-card kpi-count">
        <div class="kpi-label">Movimientos</div>
        <div class="kpi-value neutral">{{ movimientos.length }}</div>
        <div class="kpi-bar count-bar"></div>
      </div>
    </div>
  `,
  styles: [`
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    .kpi-card {
      background: #fff;
      border-radius: 14px;
      padding: 1.2rem 1.4rem;
      border: 1px solid #e2e8f0;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    }
    .kpi-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin-bottom: 0.5rem;
    }
    .kpi-value {
      font-size: 1.6rem;
      font-weight: 800;
      font-family: 'Space Grotesk', sans-serif;
    }
    .kpi-value.positive { color: #10b981; }
    .kpi-value.negative { color: #ef4444; }
    .kpi-value.neutral { color: #0ea5e9; }
    .kpi-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
    }
    .income-bar { background: linear-gradient(90deg, #10b981, #34d399); }
    .expense-bar { background: linear-gradient(90deg, #ef4444, #f87171); }
    .balance-bar { background: linear-gradient(90deg, #0ea5e9, #38bdf8); }
    .count-bar { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
  `]
})
export class MonthlySummaryComponent implements OnChanges {
  @Input() movimientos: Movement[] = [];
  @Input() saldoInicial = 0;

  totalIngresos = 0;
  totalGastos = 0;
  balance = 0;

  ngOnChanges() {
    this.calcular();
  }

  private calcular() {
    this.totalIngresos = this.movimientos
      .filter(m => (m.importe ?? 0) > 0)
      .reduce((sum, m) => sum + (m.importe ?? 0), 0);

    this.totalGastos = this.movimientos
      .filter(m => (m.importe ?? 0) < 0)
      .reduce((sum, m) => sum + Math.abs(m.importe ?? 0), 0);

    this.balance = this.saldoInicial + this.totalIngresos - this.totalGastos;
  }
}
