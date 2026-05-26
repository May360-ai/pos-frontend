import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  loading = false;
  isModalOpen = false;
  isEditMode = false;
  selectedClientId: number | null = null;

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadClients();
  }

  // 🔹 CARGAR CLIENTES
  loadClients() {
    this.loading = true;
    this.cdr.markForCheck();

    this.apiService.getClients().subscribe({
      next: (response: any) => {
        this.clients = response.data || [];
        this.filteredClients = [...this.clients]; 
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

  // 🔍 FILTRO EN TIEMPO REAL
  filterClients() {
    const term = this.searchTerm.toLowerCase();

    this.filteredClients = this.clients.filter(c =>
      (c.firstName + ' ' + c.lastName).toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(term)
    );

    this.cdr.markForCheck(); // 🔥 CLAVE por OnPush
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

    // 🔴 CAMPOS VACÍOS
    if (!this.formData.firstName ||
        !this.formData.lastName ||
        !this.formData.email ||
        !this.formData.phone ||
        !this.formData.address) {

      this.showMessage('Completa todos los campos', 'warning');
      return;
    }

    // 🔴 SOLO LETRAS
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/;

    if (!nameRegex.test(this.formData.firstName)) {
      this.showMessage('El nombre solo debe contener letras', 'danger');
      return;
    }

    if (!nameRegex.test(this.formData.lastName)) {
      this.showMessage('El apellido solo debe contener letras', 'danger');
      return;
    }

    // 🔴 SOLO NÚMEROS
    if (!/^[0-9]+$/.test(this.formData.phone)) {
      this.showMessage('El teléfono solo debe contener números', 'danger');
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
        error: () => this.showMessage('Error actualizando cliente', 'danger'),
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
        error: () => this.showMessage('Error creando cliente', 'danger'),
        complete: () => this.cdr.markForCheck()
      });

    }
  }

    validarLetras(event: KeyboardEvent): void {
    const charCode = event.key;

    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(charCode)) {
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