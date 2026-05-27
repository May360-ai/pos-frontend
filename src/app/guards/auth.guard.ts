import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Si estamos en el servidor, dejamos pasar para que el cliente hidrate.
  // El cliente volverá a ejecutar este guard y redirigirá si es necesario.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // No está logueado, redirigir a login (solo en el navegador)
  router.navigate(['/login']);
  return false;
};
