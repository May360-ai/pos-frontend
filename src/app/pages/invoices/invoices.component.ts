import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesComponent implements OnInit {
  invoices: any[] = [];
  filteredInvoices: any[] = [];
  clients: any[] = [];
  products: any[] = [];
  filteredProducts: any[] = [];
  filteredClients: any[] = []; 
  taxes: any[] = [];
  loading = false;
  isModalOpen = false;
  isViewMode = false;
  selectedInvoiceId: number | null = null;
  selectedInvoice: any = null;

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
  productSearchTerm = '';
  errors: { [key: string]: string } = {};

  formData = {
    clientId: 0,
    invoiceDate: new Date().toISOString().split('T')[0],
    items: [] as any[]
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
      this.loadInvoices();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadInvoices();
      this.loadClients();
      this.loadProducts();
      this.loadTaxes();
    }
  }

  loadInvoices() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getInvoices(this.currentPage, this.pageSize, this.searchTerm, this.searchField).subscribe({
      next: (response: any) => {
        this.invoices = (response.data || []).map((invoice: any) => ({
          ...invoice,
          items: invoice.details || [],
          details: undefined
        }));
        this.filteredInvoices = [...this.invoices];
        this.totalItems = response.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.showMessage('Error cargando facturas', 'danger');
        this.cdr.markForCheck();
      }
    });
  }

  onSearchChange(value: string) {
    this.searchSubject.next(value);
  }

  onSearchFieldChange(value: string) {
    this.searchField = value;
    this.currentPage = 1;
    this.loadInvoices();
  }

  onProductSearchChange(value: string) {
    this.productSearchTerm = value;
    if (!value) {
      this.filteredProducts = [...this.products];
    } else {
      const term = value.toLowerCase();
      this.filteredProducts = this.products.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.description?.toLowerCase().includes(term)
      );
    }
    this.cdr.markForCheck();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadInvoices();
    }
  }

  loadClients() {
    this.apiService.getClients(1, 1000).subscribe({
      next: (response: any) => {
        this.clients = response.data || [];
        this.filteredClients = [...this.clients]; 
        this.cdr.markForCheck();
      },
      error: () => console.error('Error loading clients')
    });
  }

  loadProducts() {
    this.apiService.getProductsForSale(1, 1000).subscribe({
      next: (response: any) => {
        this.products = response.data || [];
        this.filteredProducts = [...this.products];
        this.cdr.markForCheck();
      },
      error: () => console.error('Error loading products')
    });
  }

  loadTaxes() {
    this.apiService.getTaxes(1, 1000).subscribe({
      next: (response: any) => {
        this.taxes = response.data || [];
        this.cdr.markForCheck();
      },
      error: () => console.error('Error loading taxes')
    });
  }

  getAvailableStock(productId: number): number {
    const product = this.products.find(p => p.id === productId);
    if (!product) return 0;

    const usedQuantity = this.formData.items
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const available = product.stock - usedQuantity;
    return Math.max(0, available);
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formData.clientId) {
      this.errors['clientId'] = 'Debe seleccionar un cliente';
    }

    if (this.formData.items.length === 0) {
      this.errors['items'] = 'Debe agregar al menos un producto';
    }

    for (let i = 0; i < this.formData.items.length; i++) {
      const item = this.formData.items[i];
      if (!item.productId) {
        this.errors[`item_${i}_product`] = 'Debe seleccionar un producto';
      }
      
      const quantity = Number(item.quantity);
      if (!quantity || quantity <= 0) {
        this.errors[`item_${i}_quantity`] = 'La cantidad debe ser mayor a 0';
      }

      const product = this.products.find(p => p.id === item.productId);
      if (product && quantity > product.stock) {
        this.errors[`item_${i}_stock`] = `Stock insuficiente. Stock total: ${product.stock}`;
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  addItem() {
    this.formData.items.push({ 
      productId: 0, 
      quantity: 1, 
      impuestoIds: [] 
    });
    this.cdr.markForCheck();
  }

  removeItem(index: number) {
    this.formData.items.splice(index, 1);
    this.cdr.markForCheck();
  }

  onProductChange(index: number) {
    const productId = this.formData.items[index]?.productId;
    const product = this.products.find((p) => p.id === Number(productId));
    if (product) {
      this.formData.items[index].productName = product.name;
      this.formData.items[index].unitPrice = product.price;
      this.formData.items[index].quantity = 1;
    }
    this.cdr.markForCheck();
  }

  openModal(invoice?: any) {
    this.isViewMode = false;
    this.errors = {};
    this.productSearchTerm = '';
    this.filteredProducts = [...this.products];
    this.formData = { 
      clientId: 0, 
      invoiceDate: new Date().toISOString().split('T')[0],
      items: [] 
    };
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  addItemWithProduct(product: any) {
    const existingItem = this.formData.items.find(item => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
      this.showMessage(`Se incrementó la cantidad de ${product.name}`, 'info');
    } else {
      this.formData.items.push({
        productId: product.id,
        quantity: 1,
        productName: product.name,
        unitPrice: product.price,
        impuestoIds: []
      });
      this.showMessage(`${product.name} agregado a la factura`, 'success');
    }
    this.cdr.markForCheck();
  }

  viewInvoice(invoice: any) {
    this.isViewMode = true;
    this.selectedInvoice = {
      ...invoice,
      items: invoice.details || invoice.items || []
    };
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal() {
    this.isModalOpen = false;
    this.isViewMode = false;
    this.selectedInvoice = null;
    this.formData = { clientId: 0, invoiceDate: new Date().toISOString().split('T')[0], items: [] };
    this.errors = {};
    this.productSearchTerm = '';
    this.filteredProducts = [...this.products];
    this.cdr.markForCheck();
  }

  showPreview() {
    if (!this.validateForm()) {
      return;
    }

    let subtotal = 0;
    let taxTotal = 0;

    const previewItems = this.formData.items.map((item: any) => {
      const product = this.products.find(p => p.id === Number(item.productId));
      const itemSubtotal = (item.quantity || 0) * (product?.price || 0);
      subtotal += itemSubtotal;

      const detailTaxes = (item.impuestoIds || []).map((taxId: any) => {
        const tax = this.taxes.find(t => t.id === Number(taxId));
        const rate = Number(tax?.currentRate || 0);
        const amount = (itemSubtotal * rate) / 100;
        taxTotal += amount;
        return {
          taxId: Number(taxId),
          rateSnapshot: rate,
          calculatedAmountSnapshot: amount
        };
      });

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPriceSnapshot: product?.price || 0,
        detailTaxes: detailTaxes
      };
    });

    this.selectedInvoice = {
      clientId: Number(this.formData.clientId),
      invoiceDate: this.formData.invoiceDate,
      subtotalSnapshot: subtotal,
      taxTotalSnapshot: taxTotal,
      totalSnapshot: subtotal + taxTotal,
      items: previewItems,
      isPreCreation: true
    };

    this.isViewMode = true;
    this.cdr.markForCheck();
  }

  confirmSave() {
    const data: any = {
      clientId: Number(this.formData.clientId),
      items: this.formData.items.map((item: any) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        impuestoIds: Array.isArray(item.impuestoIds) ? item.impuestoIds.map((id: any) => Number(id)) : []
      }))
    };

    this.apiService.createInvoice(data).subscribe({
      next: (response: any) => {
        this.showMessage('Factura creada correctamente', 'success');
        this.updateProductStock();
        this.loadInvoices();
        const createdInvoice = response.data || response;
        this.isModalOpen = false;
        this.cdr.markForCheck();

        setTimeout(() => {
          this.viewInvoice(createdInvoice);
          this.cdr.markForCheck();
        }, 100);
      },
      error: (err) => {
        console.error('Error:', err);
        this.showMessage('Error creando factura: ' + (err.error?.message || 'Desconocido'), 'danger');
        this.cdr.markForCheck();
      }
    });
  }

  updateProductStock() {
    for (const item of this.formData.items) {
      const product = this.products.find(p => p.id === item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        this.apiService.updateProduct(item.productId, {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: newStock
        }).subscribe({
          next: () => {
            product.stock = newStock;
            this.cdr.markForCheck();
          },
          error: (err) => console.error('Error actualizando stock:', err)
        });
      }
    }
  }

  printInvoice(invoice: any) {
    const width = 1000;
    const height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    const printWindow = window.open('', '', `width=${width},height=${height},left=${left},top=${top}`);
    const clientName = this.getClientName(invoice.clientId);
    const itemsList = invoice.details || invoice.items || [];

    let itemsHtml = '';
    let rowNumber = 1;
    itemsList.forEach((item: any) => {
      const productName = this.getProductName(item.productId);
      const taxNames = (item.detailTaxes || [])
        .map((dt: any) => `${this.getTaxName(dt.taxId)} (${dt.rateSnapshot}%)`)
        .join('<br>');
      const itemTaxTotal = (item.detailTaxes || []).reduce((sum: number, dt: any) => 
        sum + (dt.calculatedAmountSnapshot || 0), 0
      );
      const itemTotal = (item.quantity * (item.unitPriceSnapshot || 0)) + itemTaxTotal;

      itemsHtml += `
        <tr>
          <td style="text-align: center; padding: 12px;">${rowNumber}</td>
          <td style="text-align: left; padding: 12px;">${productName}</td>
          <td style="text-align: center; padding: 12px;">${item.quantity}</td>
          <td style="text-align: right; padding: 12px;">$${item.unitPriceSnapshot?.toFixed(2) || '0.00'}</td>
          <td style="text-align: left; padding: 12px; font-size: 12px;">
            ${taxNames || '<span style="color: #999;">Sin impuesto</span>'}
          </td>
          <td style="text-align: right; padding: 12px;">$${itemTotal.toFixed(2)}</td>
        </tr>
      `;
      rowNumber++;
    });

    const subtotal = invoice.subtotalSnapshot || 0;
    const taxTotal = invoice.taxTotalSnapshot || 0;
    const total = invoice.totalSnapshot || 0;

    const content = `
      <html>
      <head>
        <title>Factura #${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f4f4f4; }
          .totals { margin-top: 20px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header"><h1>FACTURA #${invoice.id}</h1></div>
        <p>Cliente: ${clientName}</p>
        <p>Fecha: ${new Date(invoice.issueDate || invoice.invoiceDate).toLocaleDateString()}</p>
        <table>
          <thead><tr><th>N°</th><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
          <p>Subtotal: $${subtotal.toFixed(2)}</p>
          <p>Impuestos: $${taxTotal.toFixed(2)}</p>
          <h3>TOTAL: $${total.toFixed(2)}</h3>
        </div>
      </body>
      </html>
    `;
    printWindow!.document.write(content);
    printWindow!.document.close();
    this.closeModal();
  }

  getClientName(id: any): string {
    const clientId = Number(id);
    if (!clientId || clientId === 0) return 'Consumidor Final';
    const client = this.clients.find(c => Number(c.id) === clientId);
    return client ? (client.firstName + ' ' + client.lastName).trim() : `Cliente #${clientId}`;
  }

  getProductName(id: number): string {
    return this.products.find(p => p.id === id)?.name || '';
  }

  getTaxName(id: number): string {
    return this.taxes.find(t => t.id === id)?.name || '';
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
