import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Client, Product, Tax, Invoice } from '../models/index';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:3001/api'; // URL de tu backend

  get baseApiUrl(): string {
    return this.apiUrl;
  }

  constructor(private http: HttpClient) {}

  private mapResponse(response: any): any {
    // Si la respuesta tiene data.data (paginación de NestJS con interceptor)
    if (response && response.data && Array.isArray(response.data.data)) {
      return {
        data: response.data.data.map((item: any) => this.mapEntity(item)),
        total: response.data.total
      };
    }
    // Si la respuesta tiene data y es un array
    if (response && Array.isArray(response.data)) {
      return { 
        data: response.data.map((item: any) => this.mapEntity(item)), 
        total: response.data.length 
      };
    }
    return response;
  }

  private mapEntity(entity: any): any {
    if (!entity || typeof entity !== 'object') return entity;

    // Si es un array, mapeamos cada elemento
    if (Array.isArray(entity)) {
      return entity.map(item => this.mapEntity(item));
    }

    const mapped: any = { ...entity };

    // Desenterrar valores de Value Objects y campos privados
    for (const key in entity) {
      let value = entity[key];

      // Si el valor es un objeto (posible Value Object o entidad anidada), procesar recursivamente
      if (value && typeof value === 'object') {
        // Caso especial: Value Object con propiedad 'value'
        if (value.hasOwnProperty('value')) {
          value = value.value;
        } else {
          // Caso general: entidad anidada o array
          value = this.mapEntity(value);
        }
      }

      // Si la clave empieza con guion bajo, creamos una copia sin el guion bajo
      if (key.startsWith('_')) {
        const newKey = key.substring(1);
        mapped[newKey] = value;
      } else {
        mapped[key] = value;
      }
    }

    // Normalización específica para el frontend (asegurar compatibilidad)
    if (mapped.first_name) mapped.firstName = mapped.first_name;
    if (mapped.last_name) mapped.lastName = mapped.last_name;
    if (mapped.current_rate) mapped.currentRate = mapped.current_rate;
    if (mapped.subtotal_snapshot) mapped.subtotalSnapshot = Number(mapped.subtotal_snapshot);
    if (mapped.tax_total_snapshot) mapped.taxTotalSnapshot = Number(mapped.tax_total_snapshot);
    if (mapped.total_snapshot) mapped.totalSnapshot = Number(mapped.total_snapshot);
    if (mapped.issue_date) mapped.issueDate = mapped.issue_date;

    return mapped;
  }

  // ==================== AUTH ====================
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  // ==================== CLIENTES ====================
  getClients(page: number = 1, limit: number = 10, search: string = '', searchField: string = 'all'): Observable<any> {
    let url = `${this.apiUrl}/clients?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
      if (searchField !== 'all') {
        url += `&searchField=${searchField}`;
      }
    }
    return this.http.get<any>(url).pipe(map(res => this.mapResponse(res)));
  }

  getClient(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clients/${id}`).pipe(map(res => this.mapEntity(res.data)));
  }

  createClient(client: Client): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clients`, client).pipe(map(res => this.mapEntity(res.data)));
  }

  updateClient(id: number, data: any) {
    const { id: _, ...bodyData } = data;
    return this.http.put<any>(`${this.apiUrl}/clients/${id}`, bodyData).pipe(map(res => this.mapEntity(res.data)));
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clients/${id}`).pipe(map(res => res.data));
  }

  // ==================== PRODUCTOS ====================
  getProducts(page: number = 1, limit: number = 10, search: string = '', searchField: string = 'all'): Observable<any> {
    let url = `${this.apiUrl}/products?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
      if (searchField !== 'all') {
        url += `&searchField=${searchField}`;
      }
    }
    return this.http.get<any>(url).pipe(map(res => this.mapResponse(res)));
  }

  getProductsForSale(page: number = 1, limit: number = 10, search: string = '', searchField: string = 'all'): Observable<any> {
    let url = `${this.apiUrl}/products/for-sale?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
      if (searchField !== 'all') {
        url += `&searchField=${searchField}`;
      }
    }
    return this.http.get<any>(url).pipe(map(res => this.mapResponse(res)));
  }

  getProduct(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`).pipe(map(res => this.mapEntity(res.data)));
  }

  createProduct(product: Product): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products`, product).pipe(map(res => this.mapEntity(res.data)));
  }

  updateProduct(id: number, data: any): Observable<any> {
    const { id: _, ...bodyData } = data;
    return this.http.put<any>(`${this.apiUrl}/products/${id}`, bodyData).pipe(map(res => this.mapEntity(res.data)));
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`).pipe(map(res => res.data));
  }

  // ==================== IMPUESTOS ====================
  getTaxes(page: number = 1, limit: number = 10, search: string = '', searchField: string = 'all'): Observable<any> {
    let url = `${this.apiUrl}/taxes?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
      if (searchField !== 'all') {
        url += `&searchField=${searchField}`;
      }
    }
    return this.http.get<any>(url).pipe(map(res => this.mapResponse(res)));
  }

  getTax(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/taxes/${id}`).pipe(map(res => this.mapEntity(res.data)));
  }

  createTax(tax: Tax): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/taxes`, tax).pipe(map(res => this.mapEntity(res.data)));
  }

  updateTax(id: number, data: any): Observable<any> {
    const { id: _, ...bodyData } = data;
    return this.http.put<any>(`${this.apiUrl}/taxes/${id}`, bodyData).pipe(map(res => this.mapEntity(res.data)));
  }

  deleteTax(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/taxes/${id}`).pipe(map(res => res.data));
  }

  // ==================== INVOICES ====================
  getInvoices(page: number = 1, limit: number = 10, search: string = '', searchField: string = 'all'): Observable<any> {
    let url = `${this.apiUrl}/invoices?page=${page}&limit=${limit}`;
    if (search) {
      if (searchField === 'id') {
        const searchId = parseInt(search, 10);
        if (!isNaN(searchId)) {
          url += `&searchId=${searchId}`;
        }
      } else {
        url += `&search=${encodeURIComponent(search)}`;
      }
    }
    return this.http.get<any>(url).pipe(map(res => this.mapResponse(res)));
  }

  getInvoice(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoices/${id}`).pipe(map(res => this.mapEntity(res.data)));
  }

  createInvoice(invoice: Invoice): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/invoices`, invoice).pipe(map(res => this.mapEntity(res.data)));
  }

  updateInvoice(id: number, data: any): Observable<any> {
    const { id: _, ...bodyData } = data;
    return this.http.put<any>(`${this.apiUrl}/invoices/${id}`, bodyData).pipe(map(res => this.mapEntity(res.data)));
  }

  deleteInvoice(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/invoices/${id}`).pipe(map(res => res.data));
  }

  getInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/invoices/${id}/pdf`, {
      responseType: 'blob'
    });
  }
}
