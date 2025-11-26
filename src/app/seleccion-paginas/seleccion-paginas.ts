// bienvenida-dashboard/bienvenida-dashboard.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Website {
  id: string;
  name: string;
  url: string;
  addedDate: Date;
  lastActivity: Date;
  isActive: boolean;
  visitCount: number;
  icon?: string;
}

@Component({
  selector: 'seleccion-paginas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'seleccion-paginas.html',
  styleUrls: ['./seleccion-paginas.css']
})
export class seleccionPaginas implements OnInit {
  userName = 'Usuario'; // Vendría del servicio de autenticación
  websites: Website[] = [];
  isLoading = true;
  selectedSiteId: string | null = null;
  hoveredSiteId: string | null = null;

  ngOnInit(): void {
    // Simular carga de datos
    this.loadWebsites();
  }

  private loadWebsites(): void {
    // Simular llamada a API
    setTimeout(() => {
      this.websites = [
        {
          id: 'SITE_1',
          name: 'Homepage',
          url: 'https://mitienda.com',
          addedDate: new Date('2024-01-15'),
          lastActivity: new Date('2024-11-17'),
          isActive: true,
          visitCount: 1234,
          icon: '🏠'
        },
        {
          id: 'SITE_2',
          name: 'Blog Corporativo',
          url: 'https://blog.miempresa.com',
          addedDate: new Date('2024-02-20'),
          lastActivity: new Date('2024-11-16'),
          isActive: true,
          visitCount: 856,
          icon: '📝'
        },
        {
          id: 'SITE_3',
          name: 'Tienda Online',
          url: 'https://shop.mitienda.com',
          addedDate: new Date('2024-03-10'),
          lastActivity: new Date('2024-11-15'),
          isActive: true,
          visitCount: 2341,
          icon: '🛒'
        },
        {
          id: 'SITE_4',
          name: 'Landing Page Campaña',
          url: 'https://promo.miempresa.com',
          addedDate: new Date('2024-10-01'),
          lastActivity: new Date('2024-11-10'),
          isActive: false,
          visitCount: 432,
          icon: '🎯'
        }
      ];
      this.isLoading = false;
    }, 1000);
  }

  // Seleccionar sitio
  onSelectSite(site: Website): void {
    this.selectedSiteId = site.id;
    console.log('Sitio seleccionado:', site);
    
    // Pequeño delay para feedback visual
    setTimeout(() => {
      this.goToMetrics(site);
    }, 300);
  }

  // Ir a las métricas del sitio
  goToMetrics(site: Website): void {
    console.log('Ir a métricas de:', site.name);
    // Navegar a la página de métricas
    // this.router.navigate(['/dashboard/metrics', site.id]);
  }

  // Hover effects
  onMouseEnter(siteId: string): void {
    this.hoveredSiteId = siteId;
  }

  onMouseLeave(): void {
    this.hoveredSiteId = null;
  }

  // Agregar nuevo sitio
  onAddNewSite(): void {
    console.log('Añadir nuevo sitio');
    // Navegar a la página de vincular sitio
    // this.router.navigate(['/vincular-sitio']);
  }

  // Navegación
  onLogout(): void {
    console.log('Cerrar sesión');
    // this.authService.logout();
    // this.router.navigate(['/']);
  }

  onGoToManual(): void {
    console.log('Ir al manual');
    // this.router.navigate(['/manual']);
  }

  // Formatear fecha
  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Formatear número de visitas
  formatVisits(count: number): string {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  }

  // Obtener el saludo según la hora
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // TrackBy function
  trackBySite(index: number, site: Website): string {
    return site.id;
  }
}