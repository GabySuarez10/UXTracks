import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { VisitasService } from '../../servicios/visitas.service';
// @ts-ignore
import h337 from 'heatmap.js';

// Ancho fijo de referencia — debe coincidir con CAPTURE_WIDTH del backend (screenshot/route.js)
const HEATMAP_WIDTH = 1280;

@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heatmap-wrapper">
      <div *ngIf="loading" class="loading">Cargando mapa de calor...</div>
      <div *ngIf="error" class="error-msg">{{error}}</div>

      <div class="heatmap-toolbar" *ngIf="!loading && !error">
        <button (click)="toggleViewMode('clics')" [class.active]="viewMode === 'clics'">Clics</button>
        <button (click)="toggleViewMode('scrolls')" [class.active]="viewMode === 'scrolls'">Scrolls</button>
        <button
          *ngIf="!backgroundImageUrl && siteUrl"
          class="btn-capture"
          [disabled]="capturing"
          (click)="captureScreenshot()">
          {{ capturing ? 'Capturando...' : '📷 Capturar sitio' }}
        </button>
        <button
          *ngIf="backgroundImageUrl"
          class="btn-recapture"
          [disabled]="capturing"
          (click)="captureScreenshot()">
          {{ capturing ? 'Capturando...' : '🔄 Recapturar' }}
        </button>
      </div>

      <!-- Contenedor principal — ancho dinámico según la imagen capturada -->
      <div class="heatmap-container-wrapper" [style.width.px]="containerWidth" [style.height.px]="containerHeight">

        <!-- Snapshot del sitio como fondo real -->
        <img
          *ngIf="backgroundImageUrl"
          [src]="backgroundImageUrl"
          class="bg-image"
          [style.width.px]="containerWidth"
          alt="Captura del sitio" />

        <!-- Overlay blanco tenue: evita que interacciones se pierdan en páginas oscuras -->
        <div *ngIf="backgroundImageUrl" class="heatmap-overlay"></div>

        <!-- Fondo neutro cuando no hay snapshot aún -->
        <div *ngIf="!backgroundImageUrl && !capturing" class="bg-placeholder">
          <div class="bg-placeholder-content">
            <span class="bg-placeholder-icon">🖼️</span>
            <span class="bg-placeholder-text">Sin captura de pantalla disponible</span>
            <span class="bg-placeholder-hint">Haz clic en "Capturar sitio" para obtener el fondo</span>
          </div>
        </div>

        <div *ngIf="!backgroundImageUrl && capturing" class="bg-placeholder">
          <div class="bg-placeholder-content">
            <span class="bg-placeholder-icon capturing-icon">⏳</span>
            <span class="bg-placeholder-text">Capturando screenshot...</span>
            <span class="bg-placeholder-hint">Esto puede tardar unos segundos</span>
          </div>
        </div>

        <div class="heatmap-container" #heatmapContainer></div>
      </div>
    </div>
  `,
  styles: [`
    .heatmap-wrapper {
      width: 100%;
      height: 700px;
      position: relative;
      background: #f8f9fa;
      border: 1px solid #eaeaea;
      border-radius: 8px;
      overflow: auto;
    }
    .heatmap-toolbar {
      position: sticky;
      top: 10px;
      right: 10px;
      z-index: 20;
      background: white;
      padding: 5px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      gap: 5px;
      justify-content: flex-end;
      width: fit-content;
      margin-left: auto;
      margin-right: 15px;
      margin-top: 10px;
    }
    .heatmap-toolbar button {
      border: 1px solid #ccc;
      background: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .heatmap-toolbar button:hover:not(:disabled) {
      background: #f0f0f0;
    }
    .heatmap-toolbar button.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    .btn-capture {
      background: linear-gradient(135deg, #0E2C40, #148D8D) !important;
      color: white !important;
      border-color: #148D8D !important;
      font-weight: 600;
    }
    .btn-recapture {
      background: #f0f4f8 !important;
      color: #475569 !important;
      border-color: #cbd5e1 !important;
      font-size: 13px !important;
    }
    .btn-capture:disabled,
    .btn-recapture:disabled {
      opacity: 0.6;
      cursor: not-allowed !important;
    }
    /* El contenedor principal ahora usa dimensiones dinámicas (binding [style]) */
    .heatmap-container-wrapper {
      position: relative;
      min-width: 100%;
      min-height: 600px;
    }
    .bg-image {
      position: absolute;
      top: 0;
      left: 0;
      height: auto;
      pointer-events: none;
      z-index: 1;
      display: block;
    }
    /* ── Overlay blanco tenue entre imagen y puntos de calor ── */
    .heatmap-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.18);
      pointer-events: none;
      z-index: 2;
    }
    .bg-placeholder {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #f0f4f8 0%, #dde6ef 50%, #e8edf4 100%);
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 60px;
    }
    .bg-placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.75);
      padding: 20px 30px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      backdrop-filter: blur(4px);
    }
    .bg-placeholder-icon { font-size: 32px; }
    .capturing-icon {
      animation: spin 1.5s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .bg-placeholder-text { font-size: 14px; font-weight: 600; color: #475569; }
    .bg-placeholder-hint { font-size: 12px; color: #94a3b8; }
    /* El heatmap canvas se superpone encima del overlay (z-index 3) */
    .heatmap-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 3;
    }
    .loading, .error-msg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px;
      text-align: center;
      z-index: 5;
    }
    .error-msg { color: #dc2626; background: #fee2e2; border-radius: 8px; }
  `]
})
export class HeatmapComponent implements AfterViewInit, OnChanges {
  @Input() siteUrl: string = '';
  @ViewChild('heatmapContainer') heatmapContainer!: ElementRef;

  private readonly apiBase = 'https://uxt-api-1.onrender.com/rutas';

  loading = false;
  capturing = false;
  error = '';
  heatmapInstance: any;
  viewMode: 'clics' | 'scrolls' = 'clics';

  rawData: { clics: any[], scrolls: any[] } = { clics: [], scrolls: [] };
  backgroundImageUrl: SafeUrl | null = null;

  // Dimensiones dinámicas del contenedor — se ajustan al tamaño real de la captura
  containerWidth: number = HEATMAP_WIDTH;
  containerHeight: number = 2500;

  constructor(
    private visitasService: VisitasService,
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['siteUrl'] && this.siteUrl) {
      if (this.heatmapInstance) {
        this.loadData();
      }
    }
  }

  ngAfterViewInit() {
    this.initHeatmap();
    this.loadData();
  }

  initHeatmap() {
    this.heatmapInstance = h337.create({
      container: this.heatmapContainer.nativeElement,
      radius: 40,
      maxOpacity: 0.8,
      minOpacity: 0.1,
      blur: 0.75,
      gradient: {
        '0.25': 'blue',
        '0.55': 'green',
        '0.85': 'yellow',
        '1.0': 'red'
      }
    });
  }

  loadData() {
    setTimeout(() => {
      this.loading = true;
      this.error = '';
    });
    this.visitasService.getHeatmapData(this.siteUrl).subscribe({
      next: (data) => {
        setTimeout(() => {
          this.loading = false;
          this.rawData = data;
          if (data && data.snapshot) {
            this.applySnapshot(data.snapshot);
          } else {
            this.backgroundImageUrl = null;
          }
          this.renderHeatmap();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.loading = false;
          this.error = 'Error al cargar los datos del mapa de calor.';
        });
        console.error('Heatmap fetch error:', err);
      }
    });
  }

  /**
   * Aplica el snapshot como fondo y detecta las dimensiones reales de la imagen
   * para ajustar el contenedor dinámicamente.
   */
  private applySnapshot(snapshotBase64: string, width?: number, height?: number) {
    this.backgroundImageUrl = this.sanitizer.bypassSecurityTrustUrl(snapshotBase64);

    if (width) {
      this.containerWidth = width;
    } else {
      // Detectar dimensiones desde la imagen base64
      const img = new Image();
      img.onload = () => {
        this.containerWidth = img.naturalWidth || HEATMAP_WIDTH;
        this.containerHeight = img.naturalHeight || 2500;
        // Re-renderizar con las dimensiones correctas
        setTimeout(() => this.renderHeatmap());
      };
      img.src = snapshotBase64;
    }

    if (height) {
      this.containerHeight = height;
    }
  }

  captureScreenshot() {
    if (!this.siteUrl || this.capturing) return;
    this.capturing = true;

    this.http.post<{ snapshot: string; width?: number; height?: number }>(
      `${this.apiBase}/screenshot`,
      { url: this.siteUrl }
    ).subscribe({
      next: (res) => {
        this.capturing = false;
        if (res && res.snapshot) {
          this.applySnapshot(res.snapshot, res.width, res.height);
          setTimeout(() => this.renderHeatmap());
          console.log(`Screenshot capturado: ${res.width}x${res.height}px`);
        }
      },
      error: (err) => {
        this.capturing = false;
        console.error('Error al capturar screenshot:', err);
        this.error = 'No se pudo capturar el sitio. Intenta de nuevo.';
        setTimeout(() => { this.error = ''; }, 4000);
      }
    });
  }

  toggleViewMode(mode: 'clics' | 'scrolls') {
    this.viewMode = mode;
    this.renderHeatmap();
  }

  renderHeatmap() {
    if (!this.heatmapInstance) return;

    const points: any[] = [];
    let max = 1;

    if (this.viewMode === 'clics' && this.rawData.clics) {
      this.rawData.clics.forEach((clic: any) => {
        if (clic.posicion_x != null && clic.posicion_y != null) {
          points.push({
            x: Math.round(Number(clic.posicion_x)),
            y: Math.round(Number(clic.posicion_y)),
            value: 1
          });
        }
      });
      max = Math.max(1, points.length > 50 ? 5 : 2);
    } else if (this.viewMode === 'scrolls' && this.rawData.scrolls) {
      this.rawData.scrolls.forEach((scroll: any) => {
        if (scroll.scroll_y != null) {
          const y = Math.round(Number(scroll.scroll_y)) + window.innerHeight / 2;
          points.push({
            x: 640, // 1280 / 2
            y: y,
            value: 1
          });
        }
      });
      max = 3;
    }

    this.heatmapInstance.setData({ max, data: points });
  }
}
