import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent implements OnInit {

  clients: any[] = [];
  filteredClients: any[] = []; 

  searchTerm: string = '';
  searchField: string = 'all';
  private searchSubject = new Subject<string>();
  errors: { [key: string]: string } = {};

  loading = false;
  isModalOpen = false;
  isEditMode = false;
  selectedClientId: number | null = null;

  // 📄 PAGINACIÓN
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  message = '';
  messageType = 'success';

  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
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
      this.loadClients();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadClients();
    }
  }

  // 🔹 CARGAR CLIENTES
  loadClients() {
    this.loading = true;
    this.cdr.markForCheck();

    this.apiService.getClients(this.currentPage, this.pageSize, this.searchTerm, this.searchField).subscribe({
      next: (response: any) => {
        this.clients = response.data || [];
        this.filteredClients = [...this.clients]; 
        this.totalItems = response.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.showMessage('Error cargando clientes', 'danger');
        this.cdr.markForCheck();
      }
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadClients();
    }
  }

  // 🔍 BÚSQUEDA EN SERVIDOR
  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  onSearchFieldChange(value: string) {
    this.searchField = value;
    this.currentPage = 1;
    this.loadClients();
  }

  openModal(client?: any) {
    this.isEditMode = !!client;
    this.selectedClientId = client?.id || null;

    if (client) {
      this.formData = { ...client };
    } else {
      this.formData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: ''
      };
    }

    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal() {
    this.isModalOpen = false;
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: ''
    };
    this.cdr.markForCheck();
  }

  // ✅ VALIDACIONES + GUARDADO
  saveClient() {
    this.errors = {};

    // 🔴 CAMPOS VACÍOS
    if (!this.formData.firstName?.trim()) {
      this.errors['firstName'] = 'El nombre es obligatorio';
    }

    if (!this.formData.lastName?.trim()) {
      this.errors['lastName'] = 'El apellido es obligatorio';
    }

    if (!this.formData.email?.trim()) {
      this.errors['email'] = 'El email es obligatorio';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.formData.email)) {
      this.errors['email'] = 'Formato de email inválido';
    }

    if (!this.formData.phone?.trim()) {
      this.errors['phone'] = 'El teléfono es obligatorio';
    } else if (!/^[0-9]{10}$/.test(this.formData.phone)) {
      this.errors['phone'] = 'Debe tener 10 dígitos';
    }

    if (!this.formData.address?.trim()) {
      this.errors['address'] = 'La dirección es obligatoria';
    }

    if (Object.keys(this.errors).length > 0) {
      this.showMessage('Completa los campos correctamente', 'warning');
      this.cdr.markForCheck();
      return;
    }

    // 🔹 EDITAR
    if (this.isEditMode && this.selectedClientId) {

      this.apiService.updateClient(this.selectedClientId, this.formData).subscribe({
        next: () => {
          this.showMessage('Cliente actualizado correctamente', 'success');
          this.loadClients();
          this.closeModal();
        },
        error: (err) => {
          const errorMsg = err.error?.message || err.error?.error || '';
          if (err.status === 400 && errorMsg.toLowerCase().includes('email')) {
            this.errors['email'] = 'Ya existe un cliente con ese email';
            this.showMessage('Ya existe un cliente con ese email', 'danger');
          } else {
            this.showMessage('Error actualizando cliente', 'danger');
          }
          this.cdr.markForCheck();
        },
        complete: () => this.cdr.markForCheck()
      });

    } else {

      // 🔹 CREAR
      this.apiService.createClient(this.formData).subscribe({
        next: () => {
          this.showMessage('Cliente creado correctamente', 'success');
          this.loadClients();
          this.closeModal();
        },
        error: (err) => {
          const errorMsg = err.error?.message || err.error?.error || '';
          if (err.status === 400 && errorMsg.toLowerCase().includes('email')) {
            this.errors['email'] = 'Ya existe un cliente con ese email';
            this.showMessage('Ya existe un cliente con ese email', 'danger');
          } else {
            this.showMessage('Error creando cliente', 'danger');
          }
          this.cdr.markForCheck();
        },
        complete: () => this.cdr.markForCheck()
      });

    }
  }

  validatePhone(): void {
    if (!this.formData.phone?.trim()) {
      this.errors['phone'] = 'El teléfono es obligatorio';
    } else if (!/^[0-9]{10}$/.test(this.formData.phone)) {
      this.errors['phone'] = 'Debe tener 10 dígitos';
    } else {
      delete this.errors['phone'];
    }
    this.cdr.markForCheck();
  }

  validateEmail(): void {
    if (!this.formData.email?.trim()) {
      this.errors['email'] = 'El email es obligatorio';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.formData.email)) {
      this.errors['email'] = 'Formato de email inválido';
    } else {
      delete this.errors['email'];
    }
    this.cdr.markForCheck();
  }

  validarLetras(event: KeyboardEvent): void {
    const charCode = event.key;

    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(charCode)) {
      event.preventDefault();
    }
  }

  validarNumeros(event: KeyboardEvent): void {
    const charCode = event.key;

    if (!/[0-9]/.test(charCode)) {
      event.preventDefault();
    }
  }

  deleteClient(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;

    this.apiService.deleteClient(id).subscribe({
      next: () => {
        this.showMessage('Cliente eliminado correctamente', 'success');
        this.loadClients();
      },
      error: () => this.showMessage('Error eliminando cliente', 'danger'),
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