import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Observable, of, map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  clientCount$: Observable<number>;
  productCount$: Observable<number>;
  taxCount$: Observable<number>;
  invoiceCount$: Observable<number>;
  totalRevenue$: Observable<number>;

  constructor(
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.clientCount$ = of(0);
    this.productCount$ = of(0);
    this.taxCount$ = of(0);
    this.invoiceCount$ = of(0);
    this.totalRevenue$ = of(0);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDashboardData();
    }
  }

  loadDashboardData() {
    this.clientCount$ = this.apiService.getClients(1, 1).pipe(
      map((response: any) => response.total || 0)
    );

    this.productCount$ = this.apiService.getProducts(1, 1).pipe(
      map((response: any) => response.total || 0)
    );

    this.taxCount$ = this.apiService.getTaxes(1, 1).pipe(
      map((response: any) => response.total || 0)
    );

    this.invoiceCount$ = this.apiService.getInvoices(1, 1).pipe(
      map((response: any) => response.total || 0)
    );

    // Para la recaudación total, necesitamos sumar todas las facturas. 
    // Como el backend es paginado, pedimos una página con límite alto para el dashboard.
    this.totalRevenue$ = this.apiService.getInvoices(1, 1000).pipe(
      map((response: any) =>
        (response.data || []).reduce((sum: number, inv: any) => sum + (Number(inv.totalSnapshot) || 0), 0)
      )
    );
  }
}