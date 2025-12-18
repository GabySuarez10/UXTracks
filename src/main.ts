import { bootstrapApplication, provideProtractorTestingSupport } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import routeConfig from './app/routes';
import { JwtInterceptor } from './app/servicios/jwt.interceptor';

bootstrapApplication(App,{
providers: [provideProtractorTestingSupport(), provideRouter(routeConfig), provideHttpClient(),{provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true}],
}).catch((err) => console.error(err));