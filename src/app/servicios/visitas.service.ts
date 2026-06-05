import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class VisitasService {

    // private apiUrl = 'http://localhost:3000/rutas';
    private apiUrl: string = 'https://uxt-api-1.onrender.com/rutas';

    public get baseUrl(): string {
        // Devuelve la URL base de la API quitando el path final si es necesario
        return this.apiUrl.split('/rutas')[0] || this.apiUrl;
    }

    constructor(
        private httpClient: HttpClient
    ) { }

    getVisitasByUrl(url: string): Observable<any[]> {

        const params = new HttpParams().set('url', url);

        return this.httpClient
            .get<any[]>(`${this.apiUrl}/visitas`, { params })
            .pipe(

                map((res: any[]) => {
                    return res.map((site: any) => ({
                        uid: site.uid,
                        url: site.url,
                        recurrente: site.recurrente,
                    }));
                }),

                catchError(error => {
                    console.error('Error al obtener sitios por usuario:', error);
                    throw error;
                })

            );
    }

    getHeatmapData(
        url: string,
        startDate?: string,
        endDate?: string
    ): Observable<{
        width: number;
        height: number;
        clics: any[];
        scrolls: any[];
        snapshot?: string | null;
    }> {

        let params = new HttpParams().set('url', url);

        if (startDate) {
            params = params.set('startDate', startDate);
        }

        if (endDate) {
            params = params.set('endDate', endDate);
        }

        return this.httpClient.get<{
            width: number;
            height: number;
            clics: any[];
            scrolls: any[];
            snapshot?: string | null;
        }>(
            `${this.apiUrl}/heatmaps`,
            { params }
        ).pipe(

            catchError(error => {
                console.error('Error al obtener datos del mapa de calor:', error);
                throw error;
            })

        );
    }

    getEstadisticas(
        url: string,
        startDate?: string,
        endDate?: string
    ): Observable<{
        clicks: number;
        scrolls: number;
        visits: number;
        recurrent: number;
        porcentajeScroll: number;
        tendencias: {
            clics: { fecha: string, total: number }[];
            scrolls: { fecha: string, total: number }[];
            visitas: { fecha: string, total: number }[];
        };
    }> {

        let params = new HttpParams().set('url', url);

        if (startDate) {
            params = params.set('startDate', startDate);
        }

        if (endDate) {
            params = params.set('endDate', endDate);
        }

        return this.httpClient
            .get<any>(`${this.apiUrl}/estadisticas`, { params })
            .pipe(

                map(res => ({
                    clicks: res.clics || 0,
                    scrolls: res.scrolls || 0,
                    visits: res.visitas || 0,
                    recurrent: res.recurrentes || 0,
                    porcentajeScroll: res.porcentajeScroll || 0,
                    tendencias: res.tendencias || {
                        clics: [],
                        scrolls: [],
                        visitas: []
                    }
                })),

                catchError(error => {
                    console.error('Error al obtener estadísticas del dashboard:', error);
                    throw error;
                })

            );
    }

    getFeedbacks(url: string): Observable<any[]> {

        const params = new HttpParams().set('url', url);

        return this.httpClient
            .get<any[]>(`${this.apiUrl}/feedback`, { params })
            .pipe(

                catchError(error => {
                    console.error('Error al obtener feedbacks:', error);
                    throw error;
                })

            );
    }
}