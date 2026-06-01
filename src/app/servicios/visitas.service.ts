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
    private apiUrl = 'http://localhost:3000/rutas';
    //private apiUrl: string = 'https://uxt-api-1.onrender.com/rutas';

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
        }), catchError(error => {
            console.error('Error al obtener sitios por usuario:', error);
            throw error;
        })
        );
    }

    getHeatmapData(url: string, startDate?: string, endDate?: string): Observable<{ clics: any[], scrolls: any[] }> {
        let params = new HttpParams().set('url', url);
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        
        return this.httpClient.get<{ clics: any[], scrolls: any[] }>(`${this.apiUrl}/heatmaps`, { params }).pipe(
            catchError(error => {
                console.error('Error al obtener datos del mapa de calor:', error);
                throw error;
            })
        );
    }

    getEstadisticas(url: string, startDate?: string, endDate?: string): Observable<{
        clicks: number,
        scrolls: number,
        visits: number,
        recurrent: number,
        porcentajeScroll: number,
        tendencias: {
            clics: { fecha: string, total: number }[],
            scrolls: { fecha: string, total: number }[],
            visitas: { fecha: string, total: number }[]
        }
    }> {
        let params = new HttpParams().set('url', url);
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        
        return this.httpClient.get<any>(`${this.apiUrl}/estadisticas`, { params }).pipe(
            map(res => ({
                clicks: res.clics || 0,
                scrolls: res.scrolls || 0,
                visits: res.visitas || 0,
                recurrent: res.recurrentes || 0,
                porcentajeScroll: res.porcentajeScroll || 0,
                tendencias: res.tendencias || { clics: [], scrolls: [], visitas: [] }
            })),
            catchError(error => {
                console.error('Error al obtener estadisticas del dashboard:', error);
                throw error;
            })
        );
    }
}