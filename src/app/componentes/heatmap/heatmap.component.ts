import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
      </div>
      <div class="heatmap-container-wrapper">
        <iframe *ngIf="safeSiteUrl && !backgroundImageUrl" [src]="safeSiteUrl" class="bg-iframe" title="Sitio Analizado"></iframe>
        <img *ngIf="backgroundImageUrl" [src]="backgroundImageUrl" class="bg-image" alt="Fondo" />
        <div class="heatmap-container" #heatmapContainer></div>
      </div>
    </div>
  `,
  styles: [`
    .heatmap-wrapper { 
      width: 100%; 
      height: 700px; /* Reduced for dashboard */
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
    .heatmap-toolbar button, .btn-upload {
      border: 1px solid #ccc;
      background: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .heatmap-toolbar button:hover, .btn-upload:hover {
      background: #f0f0f0;
    }
    .heatmap-toolbar button.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    .heatmap-container-wrapper {
      position: relative;
      width: auto;
      min-width: 100%;
      height: 2500px; /* A safe scrollable height to accommodate standard sites */
    }
    .bg-iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 1920px; 
      height: 100%;
      border: none;
      pointer-events: none; /* Ignore interactions so heatmap handles them or scroll works */
      z-index: 1;
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

  loading = false;
  error = '';
  heatmapInstance: any;
  viewMode: 'clics' | 'scrolls' = 'clics';

  rawData: { clics: any[], scrolls: any[] } = { clics: [], scrolls: [] };
  safeSiteUrl: SafeResourceUrl | null = null;
  backgroundImageUrl: SafeResourceUrl | null = null;

  constructor(private visitasService: VisitasService, private sanitizer: DomSanitizer) { }

  onBackgroundUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.backgroundImageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(result);
      };
      reader.readAsDataURL(file);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['siteUrl'] && this.siteUrl) {
      this.updateSafeUrl();
      if (this.heatmapInstance) {
        this.loadData();
      }
    }
  }

  ngAfterViewInit() {
    this.initHeatmap();
    if (!this.siteUrl) {
      this.siteUrl = 'http://localhost:4200';
    }
    this.updateSafeUrl();
    this.loadData();
  }

  private updateSafeUrl() {
    let url = this.siteUrl;
    if (url && !/^https?:\/\//i.test(url) && !url.startsWith('file://')) {
      url = 'https://' + url;
    }
    this.safeSiteUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
            this.backgroundImageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.snapshot);
            this.safeSiteUrl = null;
          } else {
            this.backgroundImageUrl = null;
            this.updateSafeUrl();
          }
          this.renderHeatmap();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.loading = false;
          this.error = 'Error al cargar los datos del mapa de calor.';
        });
        console.error("Heatmap fetch error:", err);
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
          let y = Math.round(Number(scroll.scroll_y)) + window.innerHeight / 2;
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
