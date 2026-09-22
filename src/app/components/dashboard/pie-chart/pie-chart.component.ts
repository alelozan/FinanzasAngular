import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { Movement } from '../../../models/movement.model';

Chart.register(...registerables);

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="chart-header">
        <h3>{{ titulo }}</h3>
        <span class="chart-hint" *ngIf="categoriaFiltrada">
          Filtrado: {{ categoriaFiltrada }}
          <button class="btn-clear-filter" (click)="limpiarFiltro()">&times;</button>
        </span>
      </div>
      <canvas #pieChart></canvas>
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
      color: #8b5cf6;
      background: #ede9fe;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-clear-filter {
      background: none;
      border: none;
      color: #8b5cf6;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0 0.2rem;
      line-height: 1;
    }
    .btn-clear-filter:hover { color: #6d28d9; }
    canvas { max-height: 220px; width: 100% !important; }
  `]
})
export class PieChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('pieChart') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() movimientos: Movement[] = [];
  @Input() tipo: 'gasto' | 'ingreso' = 'gasto';
  @Input() titulo = 'Gastos por Categoría';
  @Output() categoriaClick = new EventEmitter<string | null>();

  private chart: Chart | null = null;
  private inicializado = false;
  categoriaFiltrada: string | null = null;
  private catIdMap: Record<string, string> = {};

  ngAfterViewInit() {
    this.inicializado = true;
    this.render();
  }

  ngOnChanges() {
    if (this.inicializado) this.render();
  }

  limpiarFiltro() {
    this.categoriaFiltrada = null;
    this.categoriaClick.emit(null);
  }

  private render() {
    if (!this.canvas) return;
    if (this.chart) { this.chart.destroy(); this.chart = null; }

    const esIngreso = this.tipo === 'ingreso';
    const dataCat: Record<string, number> = {};
    const colorMap: Record<string, string> = {};
    this.catIdMap = {};

    this.movimientos.filter(m => esIngreso ? (m.importe ?? 0) > 0 : (m.importe ?? 0) < 0).forEach(m => {
      const nombre = m.categorias?.nombre || 'General';
      const catColor = m.categorias?.color || null;
      dataCat[nombre] = (dataCat[nombre] || 0) + Math.abs(m.importe ?? 0);
      if (catColor && !colorMap[nombre]) {
        colorMap[nombre] = catColor;
      }
      if (m.categoria_id && !this.catIdMap[nombre]) {
        this.catIdMap[nombre] = m.categoria_id;
      }
    });

    const labels = Object.keys(dataCat);
    const values = Object.values(dataCat);
    const total = values.reduce((a, b) => a + b, 0);
    const fallbackColors = esIngreso
      ? ['#10b981', '#0ea5e9', '#22c55e', '#14b8a6', '#3b82f6', '#06b6d4', '#84cc16', '#6366f1']
      : ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const bgColors = labels.map((l, i) => colorMap[l] || fallbackColors[i % fallbackColors.length]);

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return ` ${context.label}: ${value.toFixed(2)} € (${pct}%)`;
              }
            }
          }
        },
        onClick: (_event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const nombre = labels[index];
            const catId = this.catIdMap[nombre] || null;
            this.categoriaFiltrada = nombre;
            this.categoriaClick.emit(catId);
          }
        }
      }
    });
  }
}
