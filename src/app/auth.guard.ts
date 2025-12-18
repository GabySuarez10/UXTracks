import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from './servicios/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    let token = this.authService.getToken();
    if (token && !this.authService.isTokenExpired(token) && localStorage.getItem('active') === 'true') {
      /*const requestedUsername = route.paramMap.get('nombre');
      const currentUser = this.authService.getUsername();
      if(currentUser == requestedUsername){
        return true;
      }*/

      // HAY QUE ARREGLAR LO DE ARRIBA
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}