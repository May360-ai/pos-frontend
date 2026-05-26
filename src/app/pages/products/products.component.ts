import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  loading = false;
  isModalOpen = false;
  isEditMode = false;
  selectedProductId: number | null = null;
  message = '';
  messageType = 'success';
  searchTerm = '';
  errors: { [key: string]: string } = {};

  formData = {
    name: '',
    price: 0,
    stock: 0,
  };

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getProducts().subscribe({
      next: (response: any) => {
        this.products = response.data || [];
        this.filterProducts();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.showMessage('Error cargando productos', 'danger');
        this.cdr.markForCheck();
      }
    });
  }

  filterProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.products];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredProducts = this.products.filter(product =>
        product.name?.toLowerCase().includes(term)
      );
    }
    this.cdr.markForCheck();
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.filterProducts();
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formData.name?.trim()) {
      this.errors['name'] = 'El nombre es obligatorio';
    } else if (!/^[a-záéíóúñ0-9\s\-\",]+$/i.test(this.formData.name)) {
      this.errors['name'] = 'El nombre contiene caracteres inválidos';
    }


    if (!this.formData.price || this.formData.price <= 0) {
      this.errors['price'] = 'El precio debe ser mayor a 0';
    }

    if (this.formData.stock === null || this.formData.stock === undefined || this.formData.stock < 0) {
      this.errors['stock'] = 'El stock no puede ser negativo';
    }

    return Object.keys(this.errors).length === 0;
  }

  openModal(product?: any) {
    this.isEditMode = !!product;
    this.selectedProductId = product?.id || null;
    this.errors = {};
    if (product) {
      this.formData = { ...product };
    } else {
      this.formData = { name: '', price: 0, stock: 0 };
    }
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal() {
    this.isModalOpen = false;
    this.formData = { name: '', price: 0, stock: 0 };
    this.errors = {};
    this.cdr.markForCheck();
  }

  saveProduct() {
    if (!this.validateForm()) {
      return;
    }

    if (this.isEditMode && this.selectedProductId) {
      this.apiService.updateProduct(this.selectedProductId, this.formData).subscribe({
        next: () => {
          this.showMessage('Producto actualizado correctamente', 'success');
          this.loadProducts();
          this.closeModal();
        },
        error: () => this.showMessage('Error actualizando producto', 'danger'),
        complete: () => this.cdr.markForCheck()
      });
    } else {
      this.apiService.createProduct(this.formData).subscribe({
        next: () => {
          this.showMessage('Producto creado correctamente', 'success');
          this.loadProducts();
          this.closeModal();
        },
        error: () => this.showMessage('Error creando producto', 'danger'),
        complete: () => this.cdr.markForCheck()
      });
    }
  }

  deleteProduct(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    
    this.apiService.deleteProduct(id).subscribe({
      next: () => {
        this.showMessage('Producto eliminado correctamente', 'success');
        this.loadProducts();
      },
      error: () => this.showMessage('Error eliminando producto', 'danger'),
      complete: () => this.cdr.markForCheck()
    });
  }

  showMessage(msg: string, type: string) {
    this.message = msg;
    this.messageType = type;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.message = '';
      this.cdr.markForCheck();
    }, 3000);
  }
}