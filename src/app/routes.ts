import { Routes } from '@angular/router';
import { Homepage } from './homepage/homepage';
import { InicioSesion } from './inicio-sesion/inicio-sesion';
import { Registro } from './registrarse/registrarse';
import { instruccionesInicio } from './instrucciones-inicio/instrucciones-inicio';
import { VincularSitio } from './vincular-sitio/vincular-sitio';
import { seleccionPaginas } from './seleccion-paginas/seleccion-paginas';

const routeConfig: Routes = [ 
  {
    path: 'homepage', // ruta principal
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
    path: 'instrucciones', // /instrucciones
    component: instruccionesInicio,
    title: 'instrucciones',
  },
   {
    path: 'vincular', // /registro
    component: VincularSitio,
    title: 'Vincular Sitio',
  },
   {
    path: 'seleccion', // /registro
    component: seleccionPaginas,
    title: 'bienvenida',
  }

];

export default routeConfig;
