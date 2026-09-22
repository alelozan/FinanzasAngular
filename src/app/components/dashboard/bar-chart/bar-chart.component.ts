import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { Movement } from '../../../models/movement.model';

Chart.register(...registerables);

interface MonthData {
  key: string;
  label: string;
  ingresos: number;
  gastos: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="chart-header">
        <h3>Tendencia Últimos 12 Meses</h3>
        <span class="chart-hint" *ngIf="mesSeleccionadoLabel">Mes seleccionado: {{ mesSeleccionadoLabel }}</span>
      </div>
      <canvas #barChart></canvas>
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
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    h3 {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .chart-hint {
      font-size: 0.72rem;
      font-weight: 600;
      color: #0ea5e9;
      background: #e0f2fe;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
    }
    canvas { max-height: 250px; width: 100% !important; }
  `]
})
export class BarChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('barChart') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() movimientos: Movement[] = [];
  @Output() mesClick = new EventEmitter<{ fechaMin: string; fechaMax: string; label: string }>();

  mesSeleccionadoLabel = '';
  private chart: Chart | null = null;
  private inicializado = false;
  private monthData: MonthData[] = [];

  ngAfterViewInit() {
    this.inicializado = true;
    this.render();
  }

  ngOnChanges() {
    if (this.inicializado) this.render();
  }

  private getUltimos12Meses(): MonthData[] {
    const meses: MonthData[] = [];
    const ahora = new Date();
    const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${nombres[d.getMonth()]} ${d.getFullYear()}`;
      meses.push({ key, label, ingresos: 0, gastos: 0 });
    }
    return meses;
  }

  private agregarMovimientos(meses: MonthData[]) {
    for (const m of this.movimientos) {
      const fechaStr = m.fecha?.substring(0, 7);
      const mes = meses.find(ms => ms.key === fechaStr);
      if (!mes) continue;
      if ((m.importe ?? 0) > 0) {
        mes.ingresos += m.importe ?? 0;
      } else {
        mes.gastos += Math.abs(m.importe ?? 0);
      }
    }
  }

  private render() {
    if (!this.canvas) return;
    if (this.chart) { this.chart.destroy(); this.chart = null; }

    this.monthData = this.getUltimos12Meses();
    this.agregarMovimientos(this.monthData);

    const labels = this.monthData.map(ms => ms.label);
    const ingresosData = this.monthData.map(ms => ms.ingresos);
    const gastosData = this.monthData.map(ms => -ms.gastos);

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: ingresosData,
            backgroundColor: '#10b981',
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: 'Gastos',
            data: gastosData,
            backgroundColor: '#ef4444',
            borderRadius: 4,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { usePointStyle: true, pointStyleWidth: 8, padding: 12, font: { size: 11 }, color: '#64748b' }
          }
        },
        scales: {
          y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        },
        onClick: (_event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const mes = this.monthData[index];
            if (!mes) return;
            const [year, month] = mes.key.split('-');
            const fechaMin = `${year}-${month}-01`;
            const lastDay = new Date(Number(year), Number(month), 0).getDate();
            const fechaMax = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
            this.mesSeleccionadoLabel = mes.label;
            this.mesClick.emit({ fechaMin, fechaMax, label: mes.label });
          }
        }
      }
    });
  }
}
