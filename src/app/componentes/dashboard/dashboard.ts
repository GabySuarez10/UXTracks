import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';

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

export type SectionType = 'dashboard' | 'heatmap' | 'feedbacks';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  activeSection: SectionType = 'dashboard';
  sidebarOpen = false;
  isMobile = false;

  stats: DashboardStats = {
    clicks: 0,
    scrolls: 0,
    visits: 0,
    recurrent: 0,
  };

  displayStats: DashboardStats = {
    clicks: 0,
    scrolls: 0,
    visits: 0,
    recurrent: 0,
  };

  barHeights: Record<keyof DashboardStats, number> = {
    clicks: 0,
    scrolls: 0,
    visits: 0,
    recurrent: 0,
  };

  chartBars: ChartBar[] = [];

  statCards = [
    {
      key: 'clicks' as keyof DashboardStats,
      label: 'Cantidad de Clics',
      icon: 'click',
      trend: '+12%',
      trendUp: true,
    },
    {
      key: 'scrolls' as keyof DashboardStats,
      label: 'Cantidad de Scrolls',
      icon: 'scroll',
      trend: '+8%',
      trendUp: true,
    },
    {
      key: 'visits' as keyof DashboardStats,
      label: 'Visitas',
      icon: 'eye',
      trend: '-3%',
      trendUp: false,
    },
    {
      key: 'recurrent' as keyof DashboardStats,
      label: 'Usuarios Recurrentes',
      icon: 'users',
      trend: '+5%',
      trendUp: true,
    },
  ];

  constructor(private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    
  }

  ngOnInit(): void {
    this.checkMobile();
    this.loadStats();
    this.calculateBarHeights();
    this.animateCounters();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
    if (!this.isMobile) this.sidebarOpen = false;
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  private loadStats(): void {
    this.stats = {
      clicks:    this.getStat('uxt_clicks',    1284),
      scrolls:   this.getStat('uxt_scrolls',   973),
      visits:    this.getStat('uxt_visits',    641),
      recurrent: this.getStat('uxt_recurrent', 312),
    };
  }

  private getStat(key: string, fallback: number): number {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? parseInt(raw, 10) : fallback;
    } catch {
      return fallback;
    }
  }

  private calculateBarHeights(): void {
    const values = Object.values(this.stats) as number[];
    const max = Math.max(...values);
    (Object.keys(this.stats) as (keyof DashboardStats)[]).forEach(key => {
      this.barHeights[key] = Math.round((this.stats[key] / max) * 100);
    });

    this.chartBars = [
      { label: 'Clics',    sublabel: 'Cantidad de clics',    height: this.barHeights.clicks,    value: this.stats.clicks,    tooltipVisible: false },
      { label: 'Scrolls',  sublabel: 'Cantidad de Scrolls',  height: this.barHeights.scrolls,   value: this.stats.scrolls,   tooltipVisible: false },
      { label: 'Visitas',  sublabel: 'Visitas totales',       height: this.barHeights.visits,    value: this.stats.visits,    tooltipVisible: false },
      { label: 'Recurr.',  sublabel: 'Usuarios recurrentes',  height: this.barHeights.recurrent, value: this.stats.recurrent, tooltipVisible: false },
    ];
  }

  private animateCounters(duration = 1100): void {
    const start = performance.now();
    const targets = { ...this.stats };

    const update = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart

      (Object.keys(targets) as (keyof DashboardStats)[]).forEach(key => {
        this.displayStats[key] = Math.round(targets[key] * ease);
      });

      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }

  setSection(section: SectionType): void {
    this.activeSection = section;
    if (this.isMobile) this.sidebarOpen = false;
  }
  onLogout(): void {
    console.log('Cerrar sesión');
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeOnBackdrop(): void {
    if (this.isMobile) this.sidebarOpen = false;
  }

  showTooltip(bar: ChartBar): void {
    bar.tooltipVisible = true;
  }

  hideTooltip(bar: ChartBar): void {
    bar.tooltipVisible = false;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
   onGoToManual(): void {
    console.log('Ir al manual');
    this.router.navigate(['/instrucciones']);
  }
}