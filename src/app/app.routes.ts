import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'clients',
    loadComponent: () =>
      import('./pages/clients/clients.component').then(
        (m) => m.ClientsComponent
      ),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products/products.component').then(
        (m) => m.ProductsComponent
      ),
  },
  {
    path: 'taxes',
    loadComponent: () =>
      import('./pages/taxes/taxes.component').then((m) => m.TaxesComponent),
  },
  {
    path: 'invoices',
    loadComponent: () =>
      import('./pages/invoices/invoices.component').then(
        (m) => m.InvoicesComponent
      ),
  },
];