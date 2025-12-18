// bienvenida-dashboard/bienvenida-dashboard.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../servicios/usuario.service';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../servicios/auth.service';
import { IUserSite } from '../../interfaces/user.site.interface';
import { SiteService } from '../../servicios/site.service';
import { VisitasService } from '../../servicios/visitas.service';

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
export class seleccionPaginas {
  userName = 'Usuario'; // Vendría del servicio de autenticación
  websites: Website[] = [];
  isLoading = true;
  selectedSiteTitle: string | null = null;
  hoveredSiteTitle: string | null = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private siteService: SiteService,
    private visitasService: VisitasService,
    private route: ActivatedRoute
  ){}

  private ngUnsubscribe: Subject<void> = new Subject<void>();
  
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  ngOnInit(): void {
    this.userName = localStorage.getItem('username') || 'Usuario';
    // Simular carga de datos
    this.loadWebsites();
    // Código para establecer firstTime en false
    if (localStorage.getItem('firstTime') === 'true'){
      this.updateFirstTime();
    }
    
  }

  public sitiosUsuario: IUserSite[] = [];
  public totalVisitas: number = 0;

  public loadWebsites(){
    this.siteService.getSitesByUser(this.userName)
    .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
          res => {
              this.isLoading = false;
              this.sitiosUsuario = res;
              console.log("sitios cargados")
              for (let sitio of this.sitiosUsuario){
                this.visitasService.getVisitasByUrl(sitio.url)
                    .pipe(takeUntil(this.ngUnsubscribe))
                      .subscribe(
                          ans => {
                              sitio.vistas = ans.length;
                              this.totalVisitas += sitio.vistas;
                              sitio.recurrentes = 0;
                              for (let visita of ans){
                                if(visita.recurrente == true){
                                  sitio.recurrentes += 1;
                                }
                              }
                          },
                          error => {
                              console.log(error);
                          }
                      );
              }
          },
          error => {
              console.log(error);
          }
      );
  }

  updateFirstTime(): void {
    this.userService.updateFirstTime(localStorage.getItem('username') || '')
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: () => {
                  this.isLoading = false;
                  console.log('First time actualizado');
              },
            error: (err) => {
                this.isLoading = false;
                console.log('Error al actualizar first time');
            }
          });
        }
  // Seleccionar sitio
  onSelectSite(site: IUserSite): void {
    this.selectedSiteTitle = site.titulo;
    console.log('Sitio seleccionado:', site);
    
    // Pequeño delay para feedback visual
    setTimeout(() => {
      this.goToMetrics(site);
    }, 300);
  }

  // Ir a las métricas del sitio
  goToMetrics(site: IUserSite): void {
    console.log('Ir a métricas de:', site.titulo);
    // Navegar a la página de métricas
    // this.router.navigate(['/dashboard/metrics', site.id]);
  }

  restar5HorasCompleta(fechaStr: string): string {
  // Extraer las 5 partes
  const partes = fechaStr.split(' ');
  const [diaIng, mesIng, diaNumStr, añoStr, horaStr] = partes;
  
  // Mapeo de meses a número
  const mesesMap: Record<string, number> = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
  };
  
  // Convertir a números
  const año = parseInt(añoStr);
  const mes = mesesMap[mesIng];
  const dia = parseInt(diaNumStr);
  const [horas, minutos, segundos] = horaStr.split(':').map(Number);
  
  // Crear fecha y restar 5 horas
  const fecha = new Date(año, mes - 1, dia, horas, minutos, segundos);
  fecha.setHours(fecha.getHours() - 5);
  
  // Obtener nueva fecha
  const nuevoAño = fecha.getFullYear();
  const nuevoMes = fecha.getMonth() + 1;
  const nuevoDia = fecha.getDate();
  const nuevaHora = fecha.getHours();
  
  // Obtener día de la semana en español (3 letras sin acento)
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const diaEsp = diasSemana[fecha.getDay()];
  
  // Formatear resultado
  return `${diaEsp} ${nuevoDia.toString().padStart(2, '0')}-${nuevoMes.toString().padStart(2, '0')}-${nuevoAño} ${nuevaHora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}

  // Hover effects
  onMouseEnter(siteId: string): void {
    this.hoveredSiteTitle = siteId;
  }

  onMouseLeave(): void {
    this.hoveredSiteTitle = null;
  }

  // Agregar nuevo sitio
  onAddNewSite(): void {
    console.log('Añadir nuevo sitio web');
    // Navegar a la página de configuración o dashboard
    this.router.navigate(['/vincular']);
  }

  // Navegación
  onLogout(): void {
    console.log('Cerrar sesión');
    this.authService.logout();
    this.router.navigate(['/']);
  }
  onDeactivation(): void {
    console.log('Desactivar cuenta');
    this.authService.deactivateAccount(localStorage.getItem('username') || '').pipe(takeUntil(this.ngUnsubscribe))
          .subscribe({
            next: () => {
                  this.isLoading = false;
                  this.authService.logout();
                  console.log('cuenta desactivada');
                  localStorage.setItem('active', 'false');
                  this.router.navigate(['/']);
              },
            error: (err) => {
                this.isLoading = false;
                console.log('Error al desactivar cuenta');
            }
          });
  }

  onGoToManual(): void {
    console.log('Ir al manual');
    this.router.navigate(['/instrucciones']);
  }


  // Obtener el saludo según la hora
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

}