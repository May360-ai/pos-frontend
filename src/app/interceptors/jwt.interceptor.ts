import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { EMPTY } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);

  // Si estamos en el servidor, no intentamos hacer peticiones protegidas.
  // Esto evita los 401 durante la hidratación inicial.
  if (!isPlatformBrowser(platformId) && !req.url.includes('/auth/login')) {
    console.log('JwtInterceptor [Server]: Skipping protected request', req.url);
    return EMPTY;
  }

  const token = authService.getToken();

  if (token) {
    console.log('JwtInterceptor [Browser]: Adding token to request', req.url);
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else if (!req.url.includes('/auth/login')) {
    console.warn('JwtInterceptor [Browser]: No token found for protected request', req.url);
  }

  return next(req);
};
