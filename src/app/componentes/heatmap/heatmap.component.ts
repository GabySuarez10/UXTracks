import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VisitasService } from '../../servicios/visitas.service';
// @ts-ignore
import h337 from 'heatmap.js';

// Ancho fijo de referencia — debe coincidir con el ancho típico de escritorio si no hay metadata
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
      </div>

      <!-- Contenedor principal — alto dinámico según los datos de la página real -->
      <div class="heatmap-container-wrapper" [style.width.px]="containerWidth" [style.height.px]="containerHeight">

        <!-- Iframe del sitio cargado como fondo visual -->
        <iframe
          *ngIf="safeUrl"
          [src]="safeUrl"
          class="bg-iframe"
          title="Sitio Trackeado"
          sandbox="allow-same-origin allow-scripts allow-forms"
          [style.width.px]="containerWidth"
          [style.height.px]="containerHeight">
        </iframe>

        <!-- Overlay transparente para que el iframe no intercepte clics del usuario del dashboard -->
        <div class="heatmap-overlay"></div>

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
    .heatmap-container-wrapper {
      position: relative;
      margin: 0 auto;
      min-height: 600px;
      background: #fff;
    }
    .bg-iframe {
      position: absolute;
      top: 0;
      left: 0;
      border: none;
      pointer-events: none; /* Crucial para evitar interacciones */
      z-index: 1;
      display: block;
    }
    .heatmap-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      pointer-events: none;
      z-index: 2;
    }
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

  loading = false;
  error = '';
  heatmapInstance: any;
  viewMode: 'clics' | 'scrolls' = 'clics';

  rawData: { clics: any[], scrolls: any[] } = { clics: [], scrolls: [] };
  safeUrl: SafeResourceUrl | null = null;

  containerWidth: number = HEATMAP_WIDTH;
  containerHeight: number = 2500;

  constructor(
    private visitasService: VisitasService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['siteUrl'] && this.siteUrl) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.siteUrl);
      if (this.heatmapInstance) {
        this.loadData();
      }
    }
  }

  ngAfterViewInit() {
    if (this.siteUrl) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.siteUrl);
    }
    this.initHeatmap();
    this.loadData();
  }

  initHeatmap() {
    if (this.heatmapContainer && this.heatmapContainer.nativeElement) {
      this.heatmapContainer.nativeElement.innerHTML = '';
      this.heatmapContainer.nativeElement.style.width = this.containerWidth + 'px';
      this.heatmapContainer.nativeElement.style.height = this.containerHeight + 'px';
    }

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
          this.calculateDimensions();
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

  calculateDimensions() {
    let maxPageHeight = 1200;
    
    if (this.rawData.clics && this.rawData.clics.length > 0) {
      this.rawData.clics.forEach((clic: any) => {
        if (clic.posicion_y && Number(clic.posicion_y) > maxPageHeight) {
          maxPageHeight = Number(clic.posicion_y);
        }
      });
    }

    if (this.rawData.scrolls && this.rawData.scrolls.length > 0) {
      this.rawData.scrolls.forEach((scroll: any) => {
        if (scroll.scroll_y && Number(scroll.scroll_y) > 0) {
          let estimatedHeight = Number(scroll.scroll_y);
          if (scroll.porcentaje_scroll && Number(scroll.porcentaje_scroll) > 0) {
            estimatedHeight = Math.round((Number(scroll.scroll_y) * 100) / Number(scroll.porcentaje_scroll)) + 900;
          } else {
            estimatedHeight = Number(scroll.scroll_y) + 1000;
          }
          if (estimatedHeight > maxPageHeight) {
            maxPageHeight = estimatedHeight;
          }
        }
      });
    }

    this.containerHeight = maxPageHeight + 200;
    
    // Re-aplicar dimensiones
    if (this.heatmapContainer && this.heatmapContainer.nativeElement) {
      this.heatmapContainer.nativeElement.style.height = this.containerHeight + 'px';
      this.initHeatmap(); // Reiniciar heatmap con nuevo tamaño
    }
  }

  toggleViewMode(mode: 'clics' | 'scrolls') {
    this.viewMode = mode;
    this.renderHeatmap();
  }

  renderHeatmap() {
    if (!this.heatmapInstance) return;

    this.heatmapInstance.setData({
      max: 1,
      data: []
    });

    const points: any[] = [];
    let max = 1;
    const scaleFactor = this.containerWidth / HEATMAP_WIDTH;

    if (this.viewMode === 'clics' && this.rawData.clics) {
      this.rawData.clics.forEach((clic: any) => {
        if (clic.posicion_x != null && clic.posicion_y != null) {
          let scaledX = Number(clic.posicion_x);
          let scaledY = Number(clic.posicion_y);

          // Normalizar coordenadas usando el viewport_width original del visitante
          if (clic.viewport_width && Number(clic.viewport_width) > 0) {
            scaledX = (scaledX / Number(clic.viewport_width)) * this.containerWidth;
          } else {
            // Fallback de escala por defecto
            scaledX = scaledX * scaleFactor;
            scaledY = scaledY * scaleFactor;
          }

          if (scaledX >= 0 && scaledY >= 0 && scaledX <= this.containerWidth && scaledY <= this.containerHeight) {
            points.push({
              x: Math.round(scaledX),
              y: Math.round(scaledY),
              value: 1
            });
          }
        }
      });
      max = Math.max(1, points.length > 50 ? 5 : 2);
    }
    else if (this.viewMode === 'scrolls' && this.rawData.scrolls) {
      this.rawData.scrolls.forEach((scroll: any) => {
        if (scroll.scroll_y != null) {
          const scaledY = Number(scroll.scroll_y) * scaleFactor;
          if (scaledY >= 0 && scaledY <= this.containerHeight) {
            points.push({
              x: Math.round(this.containerWidth / 2),
              y: Math.round(scaledY),
              value: 1
            });
          }
        }
      });
      max = 3;
    }

    this.heatmapInstance.setData({
      max,
      data: points
    });

    console.log(`Heatmap renderizado con ${points.length} puntos`);
  }
}
