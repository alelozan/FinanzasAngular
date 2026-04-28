import { Component, OnInit, ViewChild, ElementRef, LOCALE_ID } from '@angular/core';
import { CommonModule, DecimalPipe, registerLocaleData, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Chart, registerables } from 'chart.js';
import localeEs from '@angular/common/locales/es';
import * as Papa from 'papaparse';

registerLocaleData(localeEs);
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [DecimalPipe, DatePipe, { provide: LOCALE_ID, useValue: 'es-ES' }]
})
export class DashboardComponent implements OnInit {
  @ViewChild('barChart') barChartCanvas!: ElementRef;
  @ViewChild('pieChart') pieChartCanvas!: ElementRef;

  movimientosDB: any[] = [];
  movimientosFiltrados: any[] = [];
  categoriasDB: any[] = [];
  cuentas: any[] = []; 
  
  userEmail = '';
  mostrarEditor = false;
  mostrarImportadorCSV = false;
  
  // Modelo para nuevo/editar
  movimientoSeleccionado: any = { concepto: '', fecha: new Date().toISOString().split('T')[0], importe: null, categoria_id: null, cuenta_id: null };
  nuevaCategoriaNombre = '';
  nuevaCuentaNombre = '';
  
  // Filtros
  cuentaSeleccionadaId: number | null = null; 
  filtros = { concepto: '', categoria: '', tipo: '', maxPrecio: null as number | null };

  // CSV
  archivoCSVTemporal: File | null = null;
  cuentaParaCSV: number | null = null;

  private barChart: any;
  private pieChart: any;

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    const user = await this.authService.getCurrentUser();
    if (!user) { this.router.navigate(['/login']); return; }
    this.userEmail = user.email || '';
    await this.cargarTodo();
  }

  async cargarTodo() {
    await this.cargarCuentas();
    await this.cargarCategorias();
    await this.cargarMovimientos();
  }

  async cargarCuentas() {
    const user = await this.authService.getCurrentUser();
    const { data } = await this.authService.getSupabaseClient().from('cuentas').select('*').eq('user_id', user?.id).order('nombre');
    this.cuentas = data || [];
  }

  async cargarCategorias() {
    const user = await this.authService.getCurrentUser();
    const { data } = await this.authService.getSupabaseClient().from('categorias').select('*').eq('user_id', user?.id).order('nombre');
    this.categoriasDB = data || [];
  }

  async cargarMovimientos() {
    let query = this.authService.getSupabaseClient()
      .from('movimientos')
      .select(`*, categorias(nombre), cuentas(nombre)`)
      .order('fecha', { ascending: false });

    if (this.cuentaSeleccionadaId) query = query.eq('cuenta_id', this.cuentaSeleccionadaId);

    const { data, error } = await query;
    if (!error) {
      this.movimientosDB = data;
      this.aplicarFiltros();
    }
  }

  // --- LÓGICA DE IMPORTACIÓN (ESPECÍFICA PARA IMAGIN) ---
  onFileSelected(event: any) {
    this.archivoCSVTemporal = event.target.files[0];
    if (this.archivoCSVTemporal) this.mostrarImportadorCSV = true;
  }

  async procesarCSV() {
    if (!this.cuentaParaCSV) { alert('Selecciona una cuenta de destino'); return; }
    const user = await this.authService.getCurrentUser();
    
    Papa.parse(this.archivoCSVTemporal!, {
      delimiter: ";",
      skipEmptyLines: true,
      complete: async (results) => {
        // Encontrar la fila donde empiezan los datos (omitiendo cabeceras de saldo/IBAN)
        const headerIndex = results.data.findIndex((row: any) => row[0]?.toLowerCase().includes('concepto'));
        if (headerIndex === -1) return;

        const dataRows = results.data.slice(headerIndex + 1);
        const nuevosMovimientos = dataRows.map((row: any) => {
          // Limpiar importe: "-12,96EUR" -> -12.96
          const rawImporte = row[2] || "0";
          const limpioImporte = rawImporte.replace('EUR', '').replace('.', '').replace(',', '.').trim();
          
          // Formatear fecha: DD/MM/YYYY -> YYYY-MM-DD
          const partesFecha = row[1]?.split('/') || [];
          const fechaISO = partesFecha.length === 3 ? `${partesFecha[2]}-${partesFecha[1]}-${partesFecha[0]}` : null;

          return {
            concepto: row[0] || 'Importado',
            fecha: fechaISO || new Date().toISOString().split('T')[0],
            importe: parseFloat(limpioImporte),
            cuenta_id: Number(this.cuentaParaCSV),
            user_id: user?.id
          };
        }).filter((m: any) => !isNaN(m.importe));

        if (nuevosMovimientos.length > 0) {
          await this.authService.getSupabaseClient().from('movimientos').insert(nuevosMovimientos);
          this.mostrarImportadorCSV = false;
          await this.cargarMovimientos();
        }
      }
    });
  }

  // --- ACCIONES DE GESTIÓN ---
  async crearCuenta() {
    const user = await this.authService.getCurrentUser();
    await this.authService.getSupabaseClient().from('cuentas').insert({ nombre: this.nuevaCuentaNombre, user_id: user?.id });
    this.nuevaCuentaNombre = ''; await this.cargarCuentas();
  }

  async eliminarCuenta(id: number) {
    if (!confirm('¿Eliminar cuenta?')) return;
    await this.authService.getSupabaseClient().from('cuentas').delete().eq('id', id);
    await this.cargarCuentas(); await this.cargarMovimientos();
  }

  async crearCategoria() {
    const user = await this.authService.getCurrentUser();
    await this.authService.getSupabaseClient().from('categorias').insert({ nombre: this.nuevaCategoriaNombre, user_id: user?.id });
    this.nuevaCategoriaNombre = ''; await this.cargarCategorias();
  }

  async eliminarCategoria(id: number) {
    await this.authService.getSupabaseClient().from('categorias').delete().eq('id', id);
    await this.cargarCategorias();
  }

  async guardarMovimientoRapido() {
    const user = await this.authService.getCurrentUser();
    if (!this.movimientoSeleccionado.cuenta_id || !this.movimientoSeleccionado.importe) return;
    await this.authService.getSupabaseClient().from('movimientos').insert([{ ...this.movimientoSeleccionado, user_id: user?.id }]);
    this.movimientoSeleccionado = { concepto: '', fecha: new Date().toISOString().split('T')[0], importe: null, categoria_id: null, cuenta_id: this.movimientoSeleccionado.cuenta_id };
    await this.cargarMovimientos();
  }

  abrirEditor(mov: any) {
    this.movimientoSeleccionado = { ...mov };
    this.mostrarEditor = true;
  }

  async guardarEdicion() {
    const { id, categorias, cuentas, ...payload } = this.movimientoSeleccionado;
    await this.authService.getSupabaseClient().from('movimientos').update(payload).eq(id ? 'id' : '', id);
    this.mostrarEditor = false;
    await this.cargarMovimientos();
  }

  async eliminarMovimiento() {
    if (confirm('¿Eliminar registro?')) {
      await this.authService.getSupabaseClient().from('movimientos').delete().eq('id', this.movimientoSeleccionado.id);
      this.mostrarEditor = false;
      await this.cargarMovimientos();
    }
  }

  // --- FILTROS Y GRÁFICAS ---
  aplicarFiltros() {
    this.movimientosFiltrados = this.movimientosDB.filter(m => {
      const cConcepto = m.concepto.toLowerCase().includes(this.filtros.concepto.toLowerCase());
      const cCat = !this.filtros.categoria || m.categoria_id === Number(this.filtros.categoria);
      const cTipo = !this.filtros.tipo || (this.filtros.tipo === 'ingreso' ? m.importe > 0 : m.importe < 0);
      const cPrecio = !this.filtros.maxPrecio || Math.abs(m.importe) <= this.filtros.maxPrecio;
      return cConcepto && cCat && cTipo && cPrecio;
    });
    this.actualizarGraficos();
  }

  limpiarFiltros() {
    this.filtros = { concepto: '', categoria: '', tipo: '', maxPrecio: null };
    this.aplicarFiltros();
  }

  actualizarGraficos() {
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    setTimeout(() => { this.renderBarChart(); this.renderPieChart(); }, 100);
  }

  renderBarChart() {
    if (!this.barChartCanvas) return;
    const ultimos = this.movimientosFiltrados.slice(0, 10).reverse();
    this.barChart = new Chart(this.barChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ultimos.map(m => m.fecha),
        datasets: [{ label: 'Importe €', data: ultimos.map(m => m.importe), backgroundColor: '#6366f1' }]
      }
    });
  }

  renderPieChart() {
    if (!this.pieChartCanvas) return;
    const dataCat: any = {};
    this.movimientosFiltrados.filter(m => m.importe < 0).forEach(m => {
      const nombre = m.categorias?.nombre || 'General';
      dataCat[nombre] = (dataCat[nombre] || 0) + Math.abs(m.importe);
    });
    this.pieChart = new Chart(this.pieChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: Object.keys(dataCat),
        datasets: [{ data: Object.values(dataCat), backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }]
      }
    });
  }

  async logout() { await this.authService.getSupabaseClient().auth.signOut(); this.router.navigate(['/login']); }
}