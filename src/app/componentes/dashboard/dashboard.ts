import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { VisitasService } from '../../servicios/visitas.service';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

/* ---- Interfaces ---- */
export interface DashboardStats {
  clicks: number;
  scrolls: number;
  visits: number;
  recurrent: number;
}

export interface ChartBar {
  label: string;
  sublabel: string;
  height: number;
  value: number;
  tooltipVisible: boolean;
}

export interface LinePoint {
  x: number;
  y: number;
  value: number;
  label: string;
  tooltipVisible: boolean;
}

export interface LineSeriesConfig {
  title: string;
  color: string;
  chartData: ChartConfiguration['data'];
  chartOptions: ChartConfiguration['options'];
  lastValue: number;
  maxValue: number;
}

export interface HistogramBar {
  label: string;
  sublabel: string;
  value: number;
  percent: number;
  tooltipVisible: boolean;
}

export type SectionType = 'dashboard' | 'heatmap' | 'feedbacks';

import { HeatmapComponent } from '../heatmap/heatmap.component';
import { FeedbackComponent } from '../feedback/feedback.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeatmapComponent, FeedbackComponent, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {

  activeSection: SectionType = 'dashboard';
  sidebarOpen = false;
  isMobile = false;
  activeFilter: 'last7' | 'last30' | 'custom' = 'last30';
  customDateFrom = '';
  customDateTo = '';
  showCustomPicker = false;
  currentSiteUrl = '';
  currentSiteTitle = '';
  isExporting = false;

  // Modal states
  showAccountModal = false;
  showDeactivateConfirm = false;

  startDate: string | undefined = undefined;
  endDate: string | undefined = undefined;

  setFilter(filter: 'last7' | 'last30' | 'custom'): void {
    this.activeFilter = filter;
    this.showCustomPicker = filter === 'custom';
    if (filter !== 'custom') {
      this.customDateFrom = '';
      this.customDateTo = '';

      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - (filter === 'last7' ? 7 : 30));

      this.startDate = from.toISOString();
      this.endDate = to.toISOString();

      this.loadRealData();
    }
  }

  applyCustomRange(): void {
    if (!this.customDateFrom || !this.customDateTo) return;
    this.startDate = `${this.customDateFrom}T00:00:00.000Z`;
    this.endDate = `${this.customDateTo}T23:59:59.999Z`;
    this.loadRealData();
    this.showCustomPicker = false;
  }

  get filterLabel(): string {
    const labels = { last7: 'Últimos 7 días', last30: 'Últimos 30 días', custom: 'Personalizado' };
    return labels[this.activeFilter];
  }

  /* ---- Stats principales ---- */
  stats: DashboardStats = { clicks: 0, scrolls: 0, visits: 0, recurrent: 0 };
  displayStats: DashboardStats = { clicks: 0, scrolls: 0, visits: 0, recurrent: 0 };
  barHeights: Record<keyof DashboardStats, number> = { clicks: 0, scrolls: 0, visits: 0, recurrent: 0 };
  chartBars: ChartBar[] = [];

  statCards = [
    { key: 'clicks' as keyof DashboardStats, label: 'Cantidad de Clics', icon: 'click' },
    { key: 'scrolls' as keyof DashboardStats, label: 'Cantidad de Scrolls', icon: 'scroll' },
    { key: 'visits' as keyof DashboardStats, label: 'Visitas', icon: 'eye' },
    { key: 'recurrent' as keyof DashboardStats, label: 'Usuarios Recurrentes', icon: 'users' },
  ];

  /* ---- Métricas por usuario ---- */
  avgClicksPerUser = 0;
  displayAvgClicks = 0;
  avgScrollPercent = 0;
  displayScrollPct = 0;

  /* ---- Tendencias (Chart.js) ---- */
  trendSeries: LineSeriesConfig[] = [];

  /* ---- Histograma ---- */
  histogramBars: HistogramBar[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private visitasService: VisitasService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.checkMobile();

    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 30);
    this.startDate = from.toISOString();
    this.endDate = to.toISOString();

    this.route.queryParams.subscribe(params => {
      this.currentSiteUrl = params['siteUrl'] || '';
      this.currentSiteTitle = params['siteTitle'] || '';
      this.loadRealData();
    });
  }

  ngAfterViewInit(): void { }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
    if (!this.isMobile) this.sidebarOpen = false;
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  /* ---- Carga de datos reales ---- */
  private loadRealData(): void {
    if (!this.currentSiteUrl) return;
    this.visitasService.getEstadisticas(this.currentSiteUrl, this.startDate, this.endDate).subscribe({
      next: (res) => {
        this.stats = {
          clicks: res.clicks || 0,
          scrolls: res.scrolls || 0,
          visits: res.visits || 0,
          recurrent: res.recurrent || 0
        };
        this.calculateBarHeights();
        this.animateCounters();

        this.avgClicksPerUser = this.stats.visits > 0 ? (this.stats.clicks / this.stats.visits) : 0;
        this.avgScrollPercent = res.porcentajeScroll || 0;
        this.animateUserMetrics();

        // Build charts from real daily data
        this.buildTrendSeriesFromReal(res.tendencias);
        this.buildHistogram(this.stats);
      },
      error: (e) => console.error("Error loading stats:", e)
    });
  }

  private calculateBarHeights(): void {
    const max = Math.max(...(Object.values(this.stats) as number[]), 1);
    (Object.keys(this.stats) as (keyof DashboardStats)[]).forEach(k => {
      this.barHeights[k] = Math.round((this.stats[k] / max) * 100);
    });
    this.chartBars = [
      { label: 'Clics', sublabel: 'Cantidad de clics', height: this.barHeights.clicks, value: this.stats.clicks, tooltipVisible: false },
      { label: 'Scrolls', sublabel: 'Cantidad de Scrolls', height: this.barHeights.scrolls, value: this.stats.scrolls, tooltipVisible: false },
      { label: 'Visitas', sublabel: 'Visitas totales', height: this.barHeights.visits, value: this.stats.visits, tooltipVisible: false },
      { label: 'Recurr.', sublabel: 'Usuarios recurrentes', height: this.barHeights.recurrent, value: this.stats.recurrent, tooltipVisible: false },
    ];
  }

  private animateCounters(duration = 1100): void {
    const start = performance.now();
    const targets = { ...this.stats };
    const update = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 4);
      (Object.keys(targets) as (keyof DashboardStats)[]).forEach(k => {
        this.displayStats[k] = Math.round(targets[k] * e);
      });
      if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  /* ---- Métricas por usuario ---- */
  private animateUserMetrics(): void {
    this.animateValue(0, this.avgClicksPerUser, 1100, v => { this.displayAvgClicks = Math.round(v * 10) / 10; });
    this.animateValue(0, this.avgScrollPercent, 1100, v => { this.displayScrollPct = Math.round(v); });
  }

  private animateValue(from: number, to: number, duration: number, setter: (v: number) => void): void {
    const start = performance.now();
    const update = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setter(from + (to - from) * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }

  /* ---- Gráficas de línea (Chart.js) ---- */
  private buildTrendSeriesFromReal(tendencias: {
    clics: { fecha: string, total: number }[],
    scrolls: { fecha: string, total: number }[],
    visitas: { fecha: string, total: number }[]
  }): void {
    const allDates = this.buildDateRange();

    const fillData = (raw: { fecha: string, total: number }[]): { labels: string[], data: number[] } => {
      const map = new Map<string, number>();
      raw.forEach(r => {
        // Date parsing: keep strictly local to avoid shifting timezone offsets 
        // Handles "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS" without implicit shift
        const d = new Date(r.fecha);
        const pYear = d.getUTCFullYear();
        const pMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
        const pDay = String(d.getUTCDate()).padStart(2, '0');
        map.set(`${pYear}-${pMonth}-${pDay}`, r.total);
      });

      const labels: string[] = [];
      const data: number[] = [];

      allDates.forEach(dateStr => {
        data.push(map.get(dateStr) || 0);

        // Date String "YYYY-MM-DD"
        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        labels.push(dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }));
      });
      return { labels, data };
    };

    const clicksFilled = fillData(tendencias.clics);
    const scrollsFilled = fillData(tendencias.scrolls);
    const visitsFilled = fillData(tendencias.visitas);

    const datasets = [
      { title: 'Tendencia de Clics', data: clicksFilled.data, labels: clicksFilled.labels, color: '#148D8D' },
      { title: 'Tendencia de Scrolls', data: scrollsFilled.data, labels: scrollsFilled.labels, color: '#1A4A5A' },
      { title: 'Tendencia de Visitas', data: visitsFilled.data, labels: visitsFilled.labels, color: '#0E2C40' },
    ];

    this.trendSeries = datasets.map(d => this.buildChartSeries(d));
  }

  private buildDateRange(): string[] {
    const dates: string[] = [];
    const start = this.startDate ? new Date(this.startDate) : new Date();
    const end = this.endDate ? new Date(this.endDate) : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const current = new Date(start);
    while (current <= end) {
      // Safely get local string "YYYY-MM-DD"
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);

      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  private buildChartSeries(d: { title: string; data: number[]; labels: string[]; color: string }): LineSeriesConfig {
    const data: ChartConfiguration['data'] = {
      labels: d.labels,
      datasets: [
        {
          data: d.data,
          label: d.title,
          borderColor: d.color,
          backgroundColor: `${d.color}20`, // Add transparency for fill
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
        }
      ]
    };

    const options: ChartConfiguration['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          intersect: false,
          mode: 'index',
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 7
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#eef1f3' }
        }
      }
    };

    const lastValue = d.data.length > 0 ? d.data[d.data.length - 1] : 0;
    const maxValue = d.data.length > 0 ? Math.max(...d.data) : 0;

    return {
      title: d.title,
      color: d.color,
      chartData: data,
      chartOptions: options,
      lastValue,
      maxValue
    };
  }

  /* ---- Histograma ---- */
  private buildHistogram(stats: DashboardStats): void {
    const raw = [
      { label: '0–10 seg', sublabel: 'Menos de 10 segundos', value: Math.floor(stats.visits * 0.15) },
      { label: '10–30 seg', sublabel: 'Entre 10 y 30 segundos', value: Math.floor(stats.visits * 0.35) },
      { label: '30–60 seg', sublabel: 'Entre 30 y 60 segundos', value: Math.floor(stats.visits * 0.30) },
      { label: '1–3 min', sublabel: 'Entre 1 y 3 minutos', value: Math.floor(stats.visits * 0.20) },
    ];
    const maxVal = Math.max(...raw.map(r => r.value), 1);
    this.histogramBars = raw.map(r => ({ ...r, percent: Math.round((r.value / maxVal) * 100), tooltipVisible: false }));
  }

  showHistTooltip(bar: HistogramBar): void { bar.tooltipVisible = true; }
  hideHistTooltip(bar: HistogramBar): void { bar.tooltipVisible = false; }
  showTooltip(bar: ChartBar): void { bar.tooltipVisible = true; }
  hideTooltip(bar: ChartBar): void { bar.tooltipVisible = false; }

  /* ---- Navegación ---- */
  setSection(section: SectionType): void { this.activeSection = section; if (this.isMobile) this.sidebarOpen = false; }
  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
  closeOnBackdrop(): void { if (this.isMobile) this.sidebarOpen = false; }
  goHome(): void { this.router.navigate(['/']); }
  goToSeleccion(): void { this.router.navigate(['/seleccion']); }

  async downloadReport(): Promise<void> {
    this.isExporting = true;

    // Give Angular a moment to render the pdf-logo-header
    setTimeout(async () => {
      try {
        const dashboardContent = document.getElementById('dashboard-content');
        if (!dashboardContent) {
          throw new Error('Dashboard content not found');
        }

        // Capture canvas
        const canvas = await html2canvas(dashboardContent, {
          scale: 2,
          useCORS: true,
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');

        // Calculate PDF proportions
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `Reporte-${this.currentSiteTitle || 'Sitio'}-${dateStr}.pdf`;
        pdf.save(filename);

      } catch (error) {
        console.error('Error generating PDF report:', error);
        alert('Hubo un error al generar el reporte.');
      } finally {
        this.isExporting = false;
      }
    }, 100);
  }

  // Account management
  openAccountModal(): void { this.showAccountModal = true; }
  closeAccountModal(): void { this.showAccountModal = false; }

  openDeactivateConfirm(): void {
    this.showAccountModal = false;
    this.showDeactivateConfirm = true;
  }
  closeDeactivateConfirm(): void { this.showDeactivateConfirm = false; }

  confirmDeactivation(): void {
    const username = localStorage.getItem('username') || '';
    if (!username) return;

    this.authService.deactivateAccount(username).subscribe({
      next: () => {
        localStorage.setItem('active', 'false');
        this.authService.logout();
        this.router.navigate(['/']);
      },
      error: (err: any) => console.error('Error al desactivar cuenta:', err)
    });
  }
}