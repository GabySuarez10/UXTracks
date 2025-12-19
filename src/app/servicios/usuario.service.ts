import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators'
import { IUser } from '../interfaces/user.interface';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    //private apiUrl = 'http://localhost:3000/rutas';
  private apiUrl: string = 'https://uxt-api-1.onrender.com/rutas';

    constructor(
        private httpClient: HttpClient
    ) { }

    searchUserByName(name: string): Observable<IUser> {
        return this.httpClient.get(`${this.apiUrl}/users/get/${name.replace(/\s/g, "-")}`).pipe(map(res => <IUser>res));
    }

    updateUserData(userData: { avatar: number; nombreViejo: string; emailViejo: string; nombreNuevo: string; emailNuevo: string;}): Observable<any> {
        return this.httpClient.put(`${this.apiUrl}/user/update`, userData);
    }

    updateFirstTime(username: string): Observable<any> {
        return this.httpClient.put(`${this.apiUrl}/updateFirstTime`, { nombre: username });
    }
}