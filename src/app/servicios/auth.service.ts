import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/rutas';
  //private apiUrl: string = 'https://uxtapitemp.onrender.com/rutas';
  private loggedIn = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.checkToken();
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  register(userData: {username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData);
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem('jwt_token', response.token);
        localStorage.setItem('username', response.user.name);
        localStorage.setItem('active', response.user.active);
        localStorage.setItem('firstTime', response.user.firstTime);
        this.loggedIn.next(true);
      })
    );
  }
  deactivateAccount(username:string): Observable<any> {
      return this.http.put(`${this.apiUrl}/deactivate`, { nombre: username });
    }
    

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('active');
    localStorage.removeItem('firstTime');
    this.loggedIn.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  getUsername(): string | null{
    return localStorage.getItem('username');
  }

  getActive(): string | null{
    return localStorage.getItem('active');
  }

  getFirstTime(): string | null{
    return localStorage.getItem('firstTime');
  }

  private checkToken(): void {
    const token = this.getToken();
    this.loggedIn.next(!!token && !this.isTokenExpired(token));
  }

  public isTokenExpired(token: string): boolean {
    const expiry = (JSON.parse(atob(token.split('.')[1]))).exp;
    return (Math.floor((new Date).getTime() / 1000)) >= expiry;
  }
}