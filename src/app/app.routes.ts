import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'clients',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/clients/clients.component').then(
        (m) => m.ClientsComponent
      ),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/products/products.component').then(
        (m) => m.ProductsComponent
      ),
  },
  {
    path: 'taxes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/taxes/taxes.component').then((m) => m.TaxesComponent),
  },
  {
    path: 'invoices',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/invoices/invoices.component').then(
        (m) => m.InvoicesComponent
      ),
  },
  { path: '**', redirectTo: '/dashboard' },
];