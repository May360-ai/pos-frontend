import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Observable, forkJoin, map } from 'rxjs';

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

  constructor(private apiService: ApiService) {
    this.clientCount$ = new Observable();
    this.productCount$ = new Observable();
    this.taxCount$ = new Observable();
    this.invoiceCount$ = new Observable();
    this.totalRevenue$ = new Observable();
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.clientCount$ = this.apiService.getClients().pipe(
      map((response: any) => response.data?.length || 0)
    );

    this.productCount$ = this.apiService.getProducts().pipe(
      map((response: any) => response.data?.length || 0)
    );

    this.taxCount$ = this.apiService.getTaxes().pipe(
      map((response: any) => response.data?.length || 0)
    );

    this.invoiceCount$ = this.apiService.getInvoices().pipe(
      map((response: any) => response.data?.length || 0)
    );

    this.totalRevenue$ = this.apiService.getInvoices().pipe(
      map((response: any) =>
        response.data?.reduce((sum: number, inv: any) => sum + (inv.totalSnapshot || 0), 0) || 0
      )
    );
  }
}