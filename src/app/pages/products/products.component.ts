import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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

  // 📄 PAGINACIÓN
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  message = '';
  messageType = 'success';
  searchTerm = '';
  searchField = 'all';
  private searchSubject = new Subject<string>();
  errors: { [key: string]: string } = {};

  formData = {
    name: '',
    price: 0,
    stock: 0,
  };

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Configurar el debounce para la búsqueda
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1; // Resetear a la primera página al buscar
      this.loadProducts();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProducts();
    }
  }

  loadProducts() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getProducts(this.currentPage, this.pageSize, this.searchTerm, this.searchField).subscribe({
      next: (response: any) => {
        this.products = response.data || [];
        this.filteredProducts = [...this.products];
        this.totalItems = response.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
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

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  onSearchFieldChange(value: string) {
    this.searchField = value;
    this.currentPage = 1;
    this.loadProducts();
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formData.name?.trim()) {
      this.errors['name'] = 'El nombre es obligatorio';
    } else if (this.formData.name.length > 30) {
      this.errors['name'] = 'Máximo 30 caracteres';
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

  validateName(): void {
    if (!this.formData.name?.trim()) {
      this.errors['name'] = 'El nombre es obligatorio';
    } else if (this.formData.name.length > 30) {
      this.errors['name'] = 'Máximo 30 caracteres';
    } else if (!/^[a-záéíóúñ0-9\s\-\",]+$/i.test(this.formData.name)) {
      this.errors['name'] = 'El nombre contiene caracteres inválidos';
    } else {
      delete this.errors['name'];
    }
    this.cdr.markForCheck();
  }

  validatePrice(): void {
    if (!this.formData.price || this.formData.price <= 0) {
      this.errors['price'] = 'El precio debe ser mayor a 0';
    } else {
      delete this.errors['price'];
    }
    this.cdr.markForCheck();
  }

  validateStock(): void {
    if (this.formData.stock === null || this.formData.stock === undefined || this.formData.stock < 0) {
      this.errors['stock'] = 'El stock no puede ser negativo';
    } else {
      delete this.errors['stock'];
    }
    this.cdr.markForCheck();
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
        error: (err) => {
          const errorMsg = err.error?.message || err.error?.error || 'Error actualizando producto';
          if (err.status === 400 && errorMsg.toLowerCase().includes('name')) {
            this.errors['name'] = 'Ya existe un producto con ese nombre';
            this.showMessage('Ya existe un producto con ese nombre', 'danger');
          } else {
            this.showMessage(errorMsg, 'danger');
          }
          this.cdr.markForCheck();
        },
        complete: () => this.cdr.markForCheck()
      });
    } else {
      this.apiService.createProduct(this.formData).subscribe({
        next: () => {
          this.showMessage('Producto creado correctamente', 'success');
          this.loadProducts();
          this.closeModal();
        },
        error: (err) => {
          const errorMsg = err.error?.message || err.error?.error || err.message || 'Error creando producto';
          if ((err.status === 400 || err.status === 500) && (errorMsg.toLowerCase().includes('name') || errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('existe'))) {
            this.errors['name'] = 'Ya existe un producto con ese nombre';
            this.showMessage('Ya existe un producto con ese nombre', 'danger');
          } else if (err.status === 500) {
            this.errors['name'] = errorMsg || 'Error interno del servidor';
            this.showMessage(errorMsg || 'Error interno del servidor', 'danger');
          } else {
            this.showMessage(errorMsg, 'danger');
          }
          this.cdr.markForCheck();
        },
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

  validarNumeros(event: KeyboardEvent): void {
    const charCode = event.key;

    if (!/[0-9]/.test(charCode)) {
      event.preventDefault();
    }
  }
}