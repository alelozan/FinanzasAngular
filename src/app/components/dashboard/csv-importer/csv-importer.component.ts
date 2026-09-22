import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { CategoriesService } from '../../../services/categories.service';
import { CategoryPredictionService } from '../../../services/category-prediction.service';
import { SmartCategorizationsService } from '../../../services/smart-categorizations.service';
import { ToastService } from '../../../services/toast.service';
import { Account } from '../../../models/account.model';

function parseImporte(raw: string): number {
  let limpio = raw.replace('EUR', '').trim();
  limpio = limpio.replace(/[^0-9,.\-]/g, '');

  const tieneComa = limpio.includes(',');
  const tienePunto = limpio.includes('.');

  if (tieneComa && tienePunto) {
    const ultimaComa = limpio.lastIndexOf(',');
    const ultimoPunto = limpio.lastIndexOf('.');
    if (ultimaComa > ultimoPunto) {
      limpio = limpio.replace(/\./g, '').replace(',', '.');
    } else {
      limpio = limpio.replace(/,/g, '');
    }
  } else if (tieneComa) {
    const partes = limpio.split(',');
    if (partes.length === 2 && partes[1].length <= 2) {
      limpio = limpio.replace(',', '.');
    } else {
      limpio = limpio.replace(/,/g, '');
    }
  }

  return parseFloat(limpio);
}

function parseFechaDDMMYYYY(raw: string): string {
  const partes = raw.trim().split('/');
  if (partes.length === 3) return `${partes[2]}-${partes[1]}-${partes[0]}`;
  return new Date().toISOString().split('T')[0];
}

const HEADER_STRICT = 'Concepto;Fecha;Importe;Saldo disponible';

function esHeaderEstricto(linea: string): boolean {
  return linea.trim() === HEADER_STRICT;
}

function detectarHeaderIndex(lineas: string[]): number {
  for (let i = 0; i < lineas.length; i++) {
    if (esHeaderEstricto(lineas[i])) return i;
  }
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i].toLowerCase().includes('concepto') && lineas[i].toLowerCase().includes('fecha')) return i;
  }
  return -1;
}

function procesarLineaMovimiento(linea: string): { concepto: string; fecha: string; importe: number } | null {
  const parts = linea.split(';');
  if (parts.length < 3) return null;

  const concepto = (parts[0] || '').trim();
  const fecha = parseFechaDDMMYYYY(parts[1] || '');
  const importeRaw = (parts[2] || '').trim();
  const importe = parseImporte(importeRaw);

  if (!concepto || isNaN(importe) || importe === 0) return null;

  return { concepto, fecha, importe };
}

function normalizarTexto(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

@Component({
  selector: 'app-csv-importer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <label for="csv-upload" class="btn-outline">
        <span class="btn-icon-csv">&#8682;</span> Importar CSV
      </label>
      <input type="file" (change)="onFileSelected($event)" accept=".csv" id="csv-upload" hidden>
    </div>

    <div class="overlay" [class.visible]="mostrar">
      <div class="modal">
        <h3>Importar Extracto Bancario</h3>
        <p class="modal-desc">Selecciona la cuenta destino para los movimientos</p>
        <select [(ngModel)]="cuentaParaCSV" class="full-select">
          <option [value]="null" disabled>Seleccionar cuenta...</option>
          <option *ngFor="let c of cuentas" [value]="c.id">{{ c.nombre }}</option>
        </select>
        <div class="modal-info" *ngIf="archivoCSV">
          <span class="info-badge">{{ archivoCSV.name }}</span>
        </div>
        <button class="btn-primary full" (click)="procesar()" [disabled]="!cuentaParaCSV">
          {{ procesando ? 'Importando...' : 'Importar Datos' }}
        </button>
        <button class="btn-text full" (click)="cerrar()">Cancelar</button>
      </div>
    </div>
  `,
  styles: [`
    .btn-outline {
      border: 1.5px solid #0ea5e9;
      color: #0ea5e9;
      padding: 0.55rem 1rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
    }
    .btn-outline:hover { background: #f0f9ff; }
    .btn-icon-csv { font-size: 1rem; }
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.2);
      backdrop-filter: blur(4px);
      display: none;
      z-index: 1000;
    }
    .overlay.visible { display: block; }
    .modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      padding: 2rem;
      border-radius: 20px;
      width: 380px;
      z-index: 1002;
      box-shadow: 0 20px 48px rgba(15,23,42,0.15);
      animation: scaleIn 0.3s ease-out;
    }
    @keyframes scaleIn { from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    .modal h3 {
      margin: 0 0 0.4rem;
      font-size: 1.1rem;
      font-family: 'Space Grotesk', sans-serif;
    }
    .modal-desc {
      color: #64748b;
      font-size: 0.85rem;
      margin-bottom: 1.2rem;
    }
    .full-select {
      width: 100%;
      padding: 0.7rem 0.8rem;
      margin-bottom: 1rem;
      border-radius: 10px;
      border: 1.5px solid #e2e8f0;
      box-sizing: border-box;
      font-size: 0.9rem;
    }
    .full-select:focus { outline: none; border-color: #0ea5e9; }
    .modal-info {
      margin-bottom: 1rem;
    }
    .info-badge {
      background: #f0f9ff;
      color: #0369a1;
      padding: 0.3rem 0.7rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(14,165,233,0.25);
      transition: all 0.2s;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(14,165,233,0.35); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-text {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-weight: 600;
      padding: 0.5rem 0;
      width: 100%;
      margin-top: 0.5rem;
      font-size: 0.88rem;
      transition: color 0.15s;
    }
    .btn-text:hover { color: #334155; }
    .full { width: 100%; }
  `]
})
export class CsvImporterComponent {
  @Input() cuentas: Account[] = [];
  @Output() importacionCompleta = new EventEmitter<void>();

  mostrar = false;
  archivoCSV: File | null = null;
  cuentaParaCSV: number | null = null;
  procesando = false;

  constructor(
    private authService: AuthService,
    private categoriesService: CategoriesService,
    private predictionService: CategoryPredictionService,
    private smartService: SmartCategorizationsService,
    private toast: ToastService
  ) {}

  onFileSelected(event: any) {
    this.archivoCSV = event.target.files[0];
    if (this.archivoCSV) this.mostrar = true;
  }

  cerrar() {
    this.mostrar = false;
    this.archivoCSV = null;
    this.cuentaParaCSV = null;
    this.procesando = false;
  }

  async procesar() {
    if (!this.cuentaParaCSV || !this.archivoCSV) return;
    this.procesando = true;

    try {
      const user = await this.authService.getCurrentUser();
      const cuentaDestino = this.cuentas.find(c => c.id === Number(this.cuentaParaCSV));
      const categories = cuentaDestino?.es_compartida && cuentaDestino.user_id
        ? await this.categoriesService.getForUser(cuentaDestino.user_id)
        : await this.categoriesService.getAll();
      const rules = await this.smartService.getByCuenta(Number(this.cuentaParaCSV));

      const textoCSV = await this.archivoCSV.text();
      const lineas = textoCSV.split(/\r?\n/).filter(l => l.trim() !== '');

      const headerIndex = detectarHeaderIndex(lineas);
      if (headerIndex === -1) {
        this.procesando = false;
        this.toast.error('No se detectó la cabecera del CSV');
        return;
      }

      const dataLines = lineas.slice(headerIndex + 1);
      const nuevosMovimientos: any[] = [];

      for (const linea of dataLines) {
        const parsed = procesarLineaMovimiento(linea);
        if (parsed) {
          nuevosMovimientos.push({
            concepto: parsed.concepto,
            fecha: parsed.fecha,
            importe: parsed.importe,
            descripcion: null,
            cuenta_id: Number(this.cuentaParaCSV),
            user_id: user?.id,
          });
        }
      }

      let categorizadosPorReglas = 0;
      for (const mov of nuevosMovimientos) {
        const conceptoNorm = normalizarTexto(mov.concepto || '');
        for (const rule of rules) {
          if (rule.nombre && rule.categoria_id && conceptoNorm.includes(normalizarTexto(rule.nombre))) {
            mov.categoria_id = rule.categoria_id;
            categorizadosPorReglas++;
            break;
          }
        }
      }

      const predicted = this.predictionService.bulkPredict(nuevosMovimientos, categories);

      for (const m of predicted) {
        if (m.categoria_id) {
          const cat = categories.find(c => c.id === m.categoria_id);
          const esIngreso = (m.importe ?? 0) > 0;
          if (cat?.tipo && ((cat.tipo === 'ingreso') !== esIngreso)) {
            m.categoria_id = null;
          }
        }
      }

      if (predicted.length === 0) {
        this.procesando = false;
        this.toast.warning('No se encontraron movimientos válidos en el CSV');
        return;
      }

      const { error } = await this.authService.getSupabaseClient().from('movimientos').insert(predicted);
      if (error) {
        this.procesando = false;
        this.toast.error('Error al importar: ' + (error.message || ''));
        return;
      }

      this.mostrar = false;
      this.procesando = false;
      this.importacionCompleta.emit();
      this.toast.success(
        `${predicted.length} movimientos importados` +
        (categorizadosPorReglas > 0 ? ` (${categorizadosPorReglas} categorizados por reglas)` : '')
      );
    } catch (e: any) {
      this.procesando = false;
      this.toast.error('Error al importar CSV: ' + (e?.message || ''));
    }
  }
}
