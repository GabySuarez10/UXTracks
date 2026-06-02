import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { VisitasService } from '../../servicios/visitas.service';
// @ts-ignore
import h337 from 'heatmap.js';

@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heatmap-wrapper">
      <div *ngIf="loading" class="loading">Cargando mapa de calor...</div>
      <div *ngIf="error" class="error">{{error}}</div>

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
      </div>

      <div class="heatmap-container-wrapper">
        <!-- Snapshot del sitio como fondo real -->
        <img *ngIf="backgroundImageUrl" [src]="backgroundImageUrl" class="bg-image" alt="Captura del sitio" />

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
      z-index: 10;
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
    .btn-capture:disabled {
      opacity: 0.6;
      cursor: not-allowed !important;
    }
    .heatmap-container-wrapper {
      position: relative;
      width: auto;
      min-width: 100%;
      height: 2500px;
    }
    .bg-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 1920px;
      height: auto;
      pointer-events: none;
      z-index: 1;
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
    .bg-placeholder-icon {
      font-size: 32px;
    }
    .capturing-icon {
      animation: spin 1.5s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .bg-placeholder-text {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
    }
    .bg-placeholder-hint {
      font-size: 12px;
      color: #94a3b8;
    }
    .heatmap-container {
      width: 1920px;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 2;
    }
    .loading, .error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px;
      text-align: center;
      z-index: 5;
    }
    .error { color: #dc2626; background: #fee2e2; border-radius: 8px; }
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
            this.backgroundImageUrl = this.sanitizer.bypassSecurityTrustUrl(data.snapshot);
          } else {
            // Sin snapshot: mostrar placeholder con botón de captura
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

  captureScreenshot() {
    if (!this.siteUrl || this.capturing) return;
    this.capturing = true;

    this.http.post<{ snapshot: string }>(
      `${this.apiBase}/screenshot`,
      { url: this.siteUrl }
    ).subscribe({
      next: (res) => {
        this.capturing = false;
        if (res && res.snapshot) {
          this.backgroundImageUrl = this.sanitizer.bypassSecurityTrustUrl(res.snapshot);
          console.log('Screenshot capturado y aplicado como fondo del heatmap');
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
            x: 960, // center of 1920
            y: y,
            value: 1
          });
        }
      });
      max = 3;
    }

    this.heatmapInstance.setData({
      max: max,
      data: points
    });
  }
}
