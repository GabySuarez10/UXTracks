import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { VisitasService } from '../../servicios/visitas.service';
// @ts-ignore
import h337 from 'heatmap.js';

// Ancho fijo de referencia para el iframe y heatmap
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
        <button (click)="forceScreenshot()" *ngIf="backgroundMode === 'iframe'" style="margin-left:auto; background-color:#ff4444; color:white;">Usar Captura (Si el fondo está blanco)</button>
        <button (click)="restoreIframe()" *ngIf="backgroundMode === 'screenshot'" style="margin-left:auto; background-color:#4CAF50; color:white;">Usar Iframe Original</button>
      </div>

      <div class="heatmap-container-wrapper" [style.width.px]="containerWidth" [style.height.px]="containerHeight">
        
        <iframe
          *ngIf="backgroundMode === 'iframe' && safeSiteUrl"
          [src]="safeSiteUrl"
          class="bg-iframe"
          scrolling="no"
          [style.width.px]="containerWidth"
          [style.height.px]="containerHeight"
          (load)="onIframeLoad($event)"
          (error)="onIframeError()">
        </iframe>

        <img
          *ngIf="backgroundMode === 'screenshot' && screenshotUrl"
          [src]="screenshotUrl"
          class="bg-screenshot"
          [style.width.px]="containerWidth"
          [style.height.px]="containerHeight"
          alt="Screenshot del sitio" />

        <div class="heatmap-overlay"></div>

        <div class="heatmap-container" #heatmapContainer></div>

        <div *ngIf="screenshotLoading" class="screenshot-loading">
          Generando captura del sitio...
        </div>
      </div>
    </div>
  `,
  styles: [`
    .heatmap-wrapper {
      width: 100%;
      height: min(700px, calc(100vh - 190px));
      min-height: 420px;
      position: relative;
      background: #f8f9fa;
      border: 1px solid #eaeaea;
      border-radius: 8px;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
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
      transform-origin: top center;
    }
    .bg-iframe {
      position: absolute;
      top: 0;
      left: 0;
      border: none;
      display: block;
      z-index: 1;
      pointer-events: none; /* Previene interacciones directamente en el iframe */
    }
    .heatmap-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.08);
      pointer-events: auto; /* Bloquea cualquier click para que no llegue al iframe */
      z-index: 2;
    }
    .heatmap-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 3;
      pointer-events: none;
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

    .bg-screenshot {
      position: absolute;
      top: 0;
      left: 0;
      display: block;
      z-index: 1;
      pointer-events: none;
      object-fit: contain;
      object-position: top left;
    }

    .screenshot-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255,255,255,0.9);
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 5;
      font-size: 14px;
      color: #64748b;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    @media (max-width: 900px) {
      .heatmap-wrapper {
        height: min(640px, calc(100vh - 170px));
        min-height: 380px;
        border-radius: 8px;
      }

      .heatmap-toolbar {
        left: 10px;
        right: 10px;
        width: auto;
        margin-inline: 10px;
        justify-content: stretch;
      }

      .heatmap-toolbar button {
        flex: 1;
      }
    }

    @media (max-width: 560px) {
      .heatmap-wrapper {
        height: min(560px, calc(100vh - 150px));
        min-height: 340px;
      }

      .heatmap-toolbar {
        top: 8px;
        gap: 6px;
      }

      .heatmap-toolbar button {
        padding: 8px 10px;
        font-size: 13px;
      }

      .loading, .error-msg {
        width: calc(100% - 32px);
      }
    }
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
  safeSiteUrl: SafeResourceUrl | null = null;

  iframeBlocked = false;
  screenshotUrl = '';
  dbSnapshot = '';
  backgroundMode: 'iframe' | 'screenshot' = 'iframe';
  screenshotLoading = false;
  private iframeCheckTimeout: any;

  containerWidth: number = HEATMAP_WIDTH;
  containerHeight: number = 1200;

  // Dimensiones REALES de la página original (las que reportó el navegador del visitante)
  originalPageWidth: number = HEATMAP_WIDTH;
  originalPageHeight: number = 1200;

  constructor(
    private visitasService: VisitasService,
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['siteUrl'] && this.siteUrl) {
      this.iframeBlocked = false;
      this.backgroundMode = 'iframe';
      this.screenshotUrl = '';
      this.dbSnapshot = '';
      clearTimeout(this.iframeCheckTimeout);

      this.safeSiteUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.siteUrl);

      this.iframeCheckTimeout = setTimeout(() => {
        if (!this.iframeBlocked && this.backgroundMode === 'iframe') {
          console.warn('Iframe timeout detectado - cambiando a screenshot fallback');
          this.switchToScreenshot();
        }
      }, 5000);

      if (this.heatmapInstance) {
        this.loadData();
      }
    }
  }

  onIframeLoad(event: Event): void {
    const iframe = event.target as HTMLIFrameElement;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc && doc.body) {
        clearTimeout(this.iframeCheckTimeout);
        return;
      }
    } catch (e) {
      clearTimeout(this.iframeCheckTimeout);
      return;
    }
  }

  onIframeError(): void {
    clearTimeout(this.iframeCheckTimeout);
    this.switchToScreenshot();
  }

  forceScreenshot(): void {
    clearTimeout(this.iframeCheckTimeout);
    this.iframeBlocked = false; // Allow manual override
    this.switchToScreenshot();
  }

  restoreIframe(): void {
    this.iframeBlocked = false;
    this.backgroundMode = 'iframe';
    this.screenshotUrl = '';
  }

  private switchToScreenshot(): void {
    if (this.iframeBlocked) return;
    this.iframeBlocked = true;

    if (this.dbSnapshot) {
      this.screenshotUrl = this.dbSnapshot;
      this.backgroundMode = 'screenshot';
      return;
    }

    this.screenshotLoading = true;
    this.http.post<any>(`${this.visitasService.baseUrl}/screenshot`, {
      url: this.siteUrl
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.screenshotUrl = `${this.visitasService.baseUrl}/screenshot?file=${res.screenshotFile}`;
          this.backgroundMode = 'screenshot';
          if (res.height) {
            this.containerHeight = Math.max(this.containerHeight, res.height);
          }
        }
        this.screenshotLoading = false;
      },
      error: () => {
        this.screenshotLoading = false;
        console.error('No se pudo obtener el screenshot fallback');
      }
    });
  }

  ngAfterViewInit() {
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

          if (data.snapshot?.snapshot) {
            this.dbSnapshot = data.snapshot.snapshot;
            // Usar las dimensiones reales de la página que envió el script
            if (data.snapshot.width && data.snapshot.height) {
              this.originalPageWidth = Number(data.snapshot.width);
              this.originalPageHeight = Number(data.snapshot.height);
              console.log(`Dimensiones originales de página: ${this.originalPageWidth}x${this.originalPageHeight}`);
            }
          }

          this.calculateDimensions();
          this.initHeatmap();
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
    const scaleFactor = this.containerWidth / this.originalPageWidth;

    // Buscar la altura máxima entre: dimensiones del snapshot, page_height de clics, posicion_y de clics, scroll_y
    let maxOriginalHeight = this.originalPageHeight;

    if (this.rawData.clics && this.rawData.clics.length > 0) {
      this.rawData.clics.forEach((clic: any) => {
        if (clic.page_height && Number(clic.page_height) > maxOriginalHeight) {
          maxOriginalHeight = Number(clic.page_height);
        }
        if (clic.posicion_y && Number(clic.posicion_y) > maxOriginalHeight) {
          maxOriginalHeight = Number(clic.posicion_y);
        }
      });
    }

    if (this.rawData.scrolls && this.rawData.scrolls.length > 0) {
      this.rawData.scrolls.forEach((scroll: any) => {
        if (scroll.scroll_y && Number(scroll.scroll_y) > maxOriginalHeight) {
          maxOriginalHeight = Number(scroll.scroll_y);
        }
      });
    }

    this.containerHeight = (maxOriginalHeight * scaleFactor) + 100;
    console.log(`Container: ${this.containerWidth}x${this.containerHeight}, scaleFactor: ${scaleFactor}, originalPage: ${this.originalPageWidth}x${maxOriginalHeight}`);
  }

  toggleViewMode(mode: 'clics' | 'scrolls') {
    this.viewMode = mode;
    this.renderHeatmap();
  }

  renderHeatmap() {
    if (!this.heatmapInstance) return;

    // Limpiar anterior
    this.heatmapInstance.setData({
      max: 1,
      data: []
    });

    const points: any[] = [];
    let max = 1;

    // =========================
    // CLICS
    // =========================
    if (this.viewMode === 'clics' && this.rawData.clics) {
      this.rawData.clics.forEach((clic: any) => {
        if (clic.posicion_x != null && clic.posicion_y != null) {
          let scaledX = Number(clic.posicion_x);
          let scaledY = Number(clic.posicion_y);

          // Usar SIEMPRE las dimensiones originales de la página para escalar
          // Esto garantiza que clics y screenshot se alineen perfectamente
          const referenceWidth = (clic.page_width && Number(clic.page_width) > 0)
            ? Number(clic.page_width)
            : this.originalPageWidth;

          const scaleFactor = this.containerWidth / referenceWidth;
          scaledX = scaledX * scaleFactor;
          scaledY = scaledY * scaleFactor;

          if (
            scaledX >= 0 &&
            scaledY >= 0 &&
            scaledX <= this.containerWidth &&
            scaledY <= this.containerHeight
          ) {
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


    // SCROLLS

    else if (this.viewMode === 'scrolls' && this.rawData.scrolls) {
      this.rawData.scrolls.forEach((scroll: any) => {
        if (scroll.scroll_y != null) {
          let originalY = Number(scroll.scroll_y);
          const scaleFactor = this.containerWidth / this.originalPageWidth;
          let scaledY = originalY * scaleFactor;

          if (
            scaledY >= 0 &&
            scaledY <= this.containerHeight
          ) {
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

    // Render final
    this.heatmapInstance.setData({
      max,
      data: points
    });

    console.log(`Heatmap renderizado con ${points.length} puntos`);
  }
}
