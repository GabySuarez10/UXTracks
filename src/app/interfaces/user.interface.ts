import { IUserSite } from "./user.site.interface";

export interface IUser {
  nombre: string;
  visitasTotales: number;
  numSitios: number;
  sitios: IUserSite[];
}