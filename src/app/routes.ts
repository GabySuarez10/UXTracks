import { Routes } from '@angular/router';
import { Homepage } from './homepage/homepage';
import { InicioSesion } from './inicio-sesion/inicio-sesion';
import { Registro } from './registrarse/registrarse';

const routeConfig: Routes = [ 
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
  }
];

export default routeConfig;
