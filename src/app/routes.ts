import { Routes } from '@angular/router';
import { Homepage } from './componentes/homepage/homepage';
import { InicioSesion } from './componentes/inicio-sesion/inicio-sesion';
import { Registro } from './componentes/registrarse/registrarse';
import { RecuperarPassword } from './componentes/recuperar-password/recuperar-password';
import { instruccionesInicio } from './componentes/instrucciones-inicio/instrucciones-inicio';
import { VincularSitio } from './componentes/vincular-sitio/vincular-sitio';
import { seleccionPaginas } from './componentes/seleccion-paginas/seleccion-paginas';
import { AuthGuard } from './auth.guard';
import { DashboardComponent } from './componentes/dashboard/dashboard';

const routeConfig: Routes = [ 
  {
    path: 'homepage', // ruta principal
    component: Homepage,
    title: 'homepage',
  },
  {
    path: '', // ruta principal
    component: Homepage,
    title: 'homepage',
  },
  {
    path: 'login', // /login
    component: InicioSesion,
    title: 'inicio de sesión',
  },
  {
    path: 'registro', // /registro
    component: Registro,
    title: 'registro',
  },
  {
    path: 'recuperar-password', // /recuperar-password
    component: RecuperarPassword,
    title: 'Recuperar contraseña',
  },
  {
    path: 'instrucciones', // /instrucciones
    component: instruccionesInicio,
    title: 'instrucciones',
    canActivate: [AuthGuard],
  },
   {
    path: 'vincular', // /registro
    component: VincularSitio,
    title: 'Vincular Sitio',
    canActivate: [AuthGuard],
  },
   {
    path: 'seleccion', // /registro
    component: seleccionPaginas,
    title: 'bienvenida',
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard', // /registro
    component: DashboardComponent,
    title: 'metricas',
    canActivate: [AuthGuard],
  }

];

export default routeConfig;