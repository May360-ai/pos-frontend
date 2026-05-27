import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-taxes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './taxes.component.html',
  styleUrls: ['./taxes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxesComponent implements OnInit {
  taxes: any[] = [];
  filteredTaxes: any[] = [];
  loading = false;
  isModalOpen = false;
  isEditMode = false;
  selectedTaxId: number | null = null;

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
    currentRate: 0,
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
      this.loadTaxes();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTaxes();
    }
  }

  loadTaxes() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getTaxes(this.currentPage, this.pageSize, this.searchTerm, this.searchField).subscribe({
      next: (response: any) => {
        this.taxes = response.data || [];
        this.filteredTaxes = [...this.taxes];
        this.totalItems = response.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.showMessage('Error cargando impuestos', 'danger');
        this.cdr.markForCheck();
      }
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTaxes();
    }
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  onSearchFieldChange(value: string) {
    this.searchField = value;
    this.currentPage = 1;
    this.loadTaxes();
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formData.name?.trim()) {
      this.errors['name'] = 'El nombre es obligatorio';
    } else if (!/^[a-záéíóúñ\s]+$/i.test(this.formData.name)) {
      this.errors['name'] = 'El nombre solo puede contener letras';
    }

    if (!this.formData.currentRate || this.formData.currentRate <= 0 || this.formData.currentRate > 100) {
      this.errors['currentRate'] = 'El porcentaje debe estar entre 0 y 100';
    }

    return Object.keys(this.errors).length === 0;
  }

  openModal(tax?: any) {
    this.isEditMode = !!tax;
    this.selectedTaxId = tax?.id || null;
    this.errors = {};
    if (tax) {
      this.formData = { name: tax.name, currentRate: tax.currentRate || tax.percentage };
    } else {
      this.formData = { name: '', currentRate: 0 };
    }
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal() {
    this.isModalOpen = false;
    this.formData = { name: '', currentRate: 0 };
    this.errors = {};
    this.cdr.markForCheck();
  }

  saveTax() {
    if (!this.validateForm()) {
      return;
    }

    if (this.isEditMode && this.selectedTaxId) {
      this.apiService.updateTax(this.selectedTaxId, this.formData).subscribe({
        next: () => {
          this.showMessage('Impuesto actualizado correctamente', 'success');
          this.loadTaxes();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error:', err);
          if (err.error?.message?.includes('name') || err.status === 400) {
            this.showMessage('El nombre del impuesto ya existe', 'danger');
          } else {
            this.showMessage('Error actualizando impuesto', 'danger');
          }
          this.cdr.markForCheck();
        },
        complete: () => this.cdr.markForCheck()
      });
    } else {
      this.apiService.createTax(this.formData).subscribe({
        next: () => {
          this.showMessage('Impuesto creado correctamente', 'success');
          this.loadTaxes();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error:', err);
          if (err.error?.message?.includes('name') || err.status === 400) {
            this.showMessage('El nombre del impuesto ya existe', 'danger');
          } else {
            this.showMessage('Error creando impuesto', 'danger');
          }
          this.cdr.markForCheck();
        },
        complete: () => this.cdr.markForCheck()
      });
    }
  }

  deleteTax(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar este impuesto?')) return;
    
    this.apiService.deleteTax(id).subscribe({
      next: () => {
        this.showMessage('Impuesto eliminado correctamente', 'success');
        this.loadTaxes();
      },
      error: () => this.showMessage('Error eliminando impuesto', 'danger'),
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