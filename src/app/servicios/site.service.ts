import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators'
import { IUser } from '../interfaces/user.interface';
import { IUserSite } from '../interfaces/user.site.interface';

@Injectable({
    providedIn: 'root'
})
export class SiteService {
    //private apiUrl = 'http://localhost:3000/rutas';
  private apiUrl: string = 'https://uxt-api-1.onrender.com/rutas';

    constructor(
        private httpClient: HttpClient
    ) { }

    getSitesByUser(name: string): Observable<IUserSite[]> {
        const params = new HttpParams().set('usuario', name);
        return this.httpClient.get(`${this.apiUrl}/sitios`, { params }).pipe(map((res: any) => {
                    // Transformar la respuesta al tipo IUserSite[]
                    return res.map((site: any) => ({
                        titulo: site.titulo,
                        url: site.url,
                        ultimaRevision: site.ultimaRevision,
                    })) as IUserSite[];
                }),catchError(error => {
                    console.error('Error al obtener sitios por usuario:', error);
                    throw error;
                })
            );
    }

    addSite(siteData: { username: string, title: string, url: string }): Observable<any> {
        return this.httpClient.post(`${this.apiUrl}/sitios`, siteData);
    }
}