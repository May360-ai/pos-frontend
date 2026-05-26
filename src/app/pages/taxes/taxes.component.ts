import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  message = '';
  messageType = 'success';
  searchTerm = '';
  errors: { [key: string]: string } = {};

  formData = {
    name: '',
    currentRate: 0,
  };

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTaxes();
  }

  loadTaxes() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getTaxes().subscribe({
      next: (response: any) => {
        this.taxes = response.data || [];
        this.filterTaxes();
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

  filterTaxes() {
    if (!this.searchTerm.trim()) {
      this.filteredTaxes = [...this.taxes];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredTaxes = this.taxes.filter(tax =>
        tax.name?.toLowerCase().includes(term)
      );
    }
    this.cdr.markForCheck();
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.filterTaxes();
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