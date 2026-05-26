import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, Product, Tax, Invoice } from '../models/index';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:3006/api'; // URL de tu backend

  constructor(private http: HttpClient) {}

  // ==================== CLIENTES ====================
  getClients(): Observable<any> {
    return this.http.get(`${this.apiUrl}/clients`);
  }

  getClient(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/clients/${id}`);
  }

  createClient(client: Client): Observable<any> {
    return this.http.post(`${this.apiUrl}/clients`, client);
  }

  updateClient(id: number, data: any) {
    const { id: _, ...bodyData } = data;
    return this.http.put(`${this.apiUrl}/clients/${id}`, bodyData);
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clients/${id}`);
  }

  // ==================== PRODUCTOS ====================
  getProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`);
  }

  getProduct(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}`);
  }

  createProduct(product: Product): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: number, data: any): Observable<any> {
    const { id: _, ...bodyData } = data;
    return this.http.put(`${this.apiUrl}/products/${id}`, bodyData);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`);
  }

  // ==================== IMPUESTOS ====================
  getTaxes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/taxes`);
  }

  getTax(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/taxes/${id}`);
  }

  createTax(tax: Tax): Observable<any> {
    return this.http.post(`${this.apiUrl}/taxes`, tax);
  }

  updateTax(id: number, data: any): Observable<any> {
    const { id: _, ...bodyData } = data;
    return this.http.put(`${this.apiUrl}/taxes/${id}`, bodyData);
  }

  deleteTax(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/taxes/${id}`);
  }

  // ==================== INVOICES ====================
  getInvoices(): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices`);
  }

  getInvoice(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/invoices/${id}`);
  }

  createInvoice(invoice: Invoice): Observable<any> {
    return this.http.post(`${this.apiUrl}/invoices`, invoice);
  }

  updateInvoice(id: number, data: any): Observable<any> {
    const { id: _, ...bodyData } = data;
    return this.http.put(`${this.apiUrl}/invoices/${id}`, bodyData);
  }

  deleteInvoice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/invoices/${id}`);
  }
}