import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators'
import { IUser } from '../interfaces/user.interface';
import { IUserSite } from '../interfaces/user.site.interface';

@Injectable({
    providedIn: 'root'
})
export class VisitasService {
    //private apiUrl = 'http://localhost:3000/rutas';
  private apiUrl: string = 'https://uxt-api-1.onrender.com/rutas';

    constructor(
        private httpClient: HttpClient
    ) { }

    getVisitasByUrl(url: string): Observable<any[]> {
        const params = new HttpParams().set('url', url);
        return this.httpClient.get(`${this.apiUrl}/visitas`, { params }).pipe(map((res: any) => {
                    // Transformar la respuesta al tipo IUserSite[]
                    return res.map((site: any) => ({
                        uid: site.uid,
                        url: site.url,
                        recurrente: site.recurrente,
                    })) as any[];
                }),catchError(error => {
                    console.error('Error al obtener sitios por usuario:', error);
                    throw error;
                })
            );
    }
}