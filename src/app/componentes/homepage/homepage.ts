// homepage/homepage.ts
import { ActivatedRoute, Router } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface CarouselImage {
  id: number;
  title: string;
  description: string;
  image: string;
  alt: string;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.css']
})
export class Homepage {
  constructor(private router: Router, private route: ActivatedRoute) {}
  title = 'UXTracks';
  
  features: Feature[] = [
    {
      title: 'Análisis de Clics y scrolls',
      description: 'Rastrea y analiza todos los clicks y scrolls de tus usuarios para entender mejor su comportamiento.',
      icon: '🖱️'
    },
    {
      title: 'Mapas de Calor',
      description: 'Visualiza las áreas más populares de tu sitio web con mapas de calor interactivos.',
      icon: '📈'
    },
    {
      title: 'Feedback Inteligente',
      description: 'Recibe retroalimentación inteligente basada en el comportamiento del usuario.',
      icon: '🧠'
    },
    {
      title: 'Dashboard interactivo',
      description: 'Obtén metricas claves de la experiencia de usuario en tiempo real.',
      icon: '📊'
    }
  ];
  
  // Datos para el carrusel de "¿Cómo funciona?"
  currentSlide: number = 0;
  carouselImages: CarouselImage[] = [
    {
      id: 1,
      title: 'Script de Integración',
      description: 'Instalación simple con una línea de código',
      image: '📋',
      alt: 'Dashboard con métricas'
    },
    {
      id: 2,
      title: 'Recopilación de Datos',
      description: 'Captura automática de clicks, scrolls y comportamiento',
      image: '🖱️',
      alt: 'Seguimiento de clicks'
    },
    {
      id: 3,
      title: 'Análisis Inteligente',
      description: 'Procesamiento y análisis de patrones de usuario',
      image: '🧠',
      alt: 'Análisis inteligente'
    },
    {
      id: 4,
      title: 'Panel Interactivo',
      description: 'Visualización clara y datos accionables',
      image: '📊',
      alt: 'Panel de resultados'
    }
  ];

  // Métodos para manejo de eventos
  onGetStarted(event: Event): void {
    console.log('Comenzar ahora clicked');
     event.preventDefault()
     this.router.navigate(['/registro']);
    // Aquí puedes agregar navegación o lógica específica
  }

  onLogin(): void {
    console.log('Iniciar sesión clicked')
    this.router.navigate(['/login']);

    // Lógica para iniciar sesión
  }

  onFeatureClick(feature: Feature): void {
    console.log('Feature clicked:', feature.title);
    // Lógica para mostrar más detalles de la característica
  }

  onNavItemClick(item: any): void {
    console.log('Nav item clicked:', item.label);
    this.router.navigate([item.link]);
    // Lógica para navegación
  }
   onBackToHome(): void {
    console.log('Back to home clicked');
    this.router.navigate(['/homepage']);
  }
  onRegister(event: Event): void {
    console.log('Register clicked');
      event.preventDefault()
    // Navegar a página de registro
     this.router.navigate(['/registro']);
  }
private readonly INTERVAL = 1500;
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  private startAutoPlay(): void {
    this.timer = setInterval(() => this.nextSlide(), this.INTERVAL);
  }

  private stopAutoPlay(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  // Métodos para el carrusel
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.carouselImages.length;
  }

  prevSlide(): void {
    this.stopAutoPlay();  // 👈 agrega esto
    this.currentSlide = this.currentSlide === 0
      ? this.carouselImages.length - 1
      : this.currentSlide - 1;
    this.startAutoPlay(); // 👈 agrega esto
  }

  goToSlide(index: number): void {
    this.stopAutoPlay();  // 👈 agrega esto
    this.currentSlide = index;
    this.startAutoPlay(); // 👈 agrega esto
  }

  // TrackBy function para mejor performance
  trackByCarousel(index: number, item: CarouselImage): number {
    return item.id;
  }

  trackByFeature(index: number, item: Feature): string {
    return item.title;
  }
}