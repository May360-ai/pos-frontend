import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  message = '';
  messageType = 'success';
  searchTerm = '';
  productSearchTerm = '';
  errors: { [key: string]: string } = {};

  formData = {
    clientId: 0,
    invoiceDate: new Date().toISOString().split('T')[0],
    items: [] as any[]
  };

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadInvoices();
    this.loadClients();
    this.loadProducts();
    this.loadTaxes();
  }

  loadInvoices() {
    this.loading = true;
    this.cdr.markForCheck();
    this.apiService.getInvoices().subscribe({
      next: (response: any) => {
        this.invoices = (response.data || []).map((invoice: any) => ({
          ...invoice,
          items: invoice.details || [],
          details: undefined
        }));
        this.filterInvoices();
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

  filterInvoices() {
    if (!this.searchTerm.trim()) {
      this.filteredInvoices = [...this.invoices];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredInvoices = this.invoices.filter(invoice =>
        invoice.id.toString().includes(term) ||
        this.getClientName(invoice.clientId).toLowerCase().includes(term) ||
        invoice.transactionId?.toLowerCase().includes(term)
      );
    }
    this.cdr.markForCheck();
  }

  onSearchChange(span: string) {
    this.searchTerm = span;
    this.filterInvoices();
  }

  filterProducts() {
    if (!this.productSearchTerm.trim()) {
      this.filteredProducts = [...this.products];
    } else {
      const term = this.productSearchTerm.toLowerCase();
      this.filteredProducts = this.products.filter(product =>
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term)
      );
    }
    this.cdr.markForCheck();
  }

  onProductSearchChange(span: string) {
    this.productSearchTerm = span;
    this.filterProducts();
  }

    filterClients() {
    const term = this.searchTerm.toLowerCase();

    this.filteredClients = this.clients.filter(c =>
      (c.firstName + ' ' + c.lastName).toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone.includes(term)
    );

    this.cdr.markForCheck();
  }

  loadClients() {
    this.apiService.getClients().subscribe({
      next: (response: any) => {
        this.clients = response.data || [];
        this.filteredClients = [...this.clients]; 
        this.cdr.markForCheck();
      },
      error: () => console.error('Error loading clients')
    });
  }

  loadProducts() {
    this.apiService.getProducts().subscribe({
      next: (response: any) => {
        this.products = response.data || [];
        this.filteredProducts = [...this.products];
        this.cdr.markForCheck();
      },
      error: () => console.error('Error loading products')
    });
  }

  loadTaxes() {
    this.apiService.getTaxes().subscribe({
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

    // Obtener cantidad ya agregada en la factura actual (excluyendo el item actual)
    const usedQuantity = this.formData.items
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const available = product.stock - usedQuantity;
    return Math.max(0, available); // Nunca retornar negativo
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

    // Validar stock (comparar contra stock del producto, no disponible)
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
      // Resetear cantidad a 1 al cambiar producto
      this.formData.items[index].quantity = 1;
    }
    this.cdr.markForCheck();
  }

  openModal(invoice?: any) {
    this.isViewMode = false;
    this.errors = {};
    this.productSearchTerm = '';
    this.filteredProducts = [...this.products];

    // Nunca permitir editar facturas (solo crear nuevas)
    this.formData = { 
      clientId: 0, 
      invoiceDate: new Date().toISOString().split('T')[0], // Fecha automática de hoy
      items: [] 
    };
    
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }


    addItemWithProduct(product: any) {
    // Verificar si el producto ya está en la factura
    const existingItem = this.formData.items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Si ya existe, incrementar cantidad
      existingItem.quantity += 1;
      this.showMessage(`Se incrementó la cantidad de ${product.name}`, 'info');
    } else {
      // Si no existe, agregarlo
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

saveInvoice() {
  if (!this.validateForm()) {
    return;
  }

  const clientId = Number(this.formData.clientId);
  if (!clientId) {
    this.showMessage('Selecciona un cliente válido', 'warning');
    return;
  }

  const data: any = {
    clientId: clientId,
    invoiceDate: this.formData.invoiceDate,
    items: this.formData.items.map((item: any) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
      impuestoIds: Array.isArray(item.impuestoIds) ? item.impuestoIds.map((id: any) => Number(id)) : []
    }))
  };

  this.apiService.createInvoice(data).subscribe({
    next: (response: any) => {
      this.showMessage('Factura creada correctamente', 'success');
      // Actualizar stock de los productos
      this.updateProductStock();
      this.loadInvoices();
      
      // Mostrar confirmación y luego imprimir
      setTimeout(() => {
        const createdInvoice = response.data || response;
        this.showConfirmationAndPrint(createdInvoice);
      }, 500);
    },
    error: (err) => {
      console.error('Error:', err);
      this.showMessage('Error creando factura: ' + (err.error?.message || 'Desconocido'), 'danger');
      this.cdr.markForCheck();
    },
    complete: () => this.cdr.markForCheck()
  });
}

showConfirmationAndPrint(invoice: any) {
  // Cerrar modal de creación
  this.closeModal();
  
  // Preparar factura para vista previa
  const invoiceWithItems = {
    ...invoice,
    items: invoice.details || invoice.items || []
  };
  
  this.selectedInvoice = invoiceWithItems;
  this.isViewMode = true;
  this.isModalOpen = true;
  
  this.showMessage('¿Deseas imprimir la factura?', 'info');
  this.cdr.markForCheck();
}

printFromPreview() {
  if (this.selectedInvoice) {
    this.printInvoice(this.selectedInvoice);
  }
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
  const printWindow = window.open('', '', 'width=1000,height=700');
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
    <!DOCTYPE html>
    <html>
    <head>
      <title>Factura #${invoice.id}</title>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          color: #333;
          background-color: #fff;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #101010;
          padding-bottom: 20px;
        }
        
        .header h1 {
          font-size: 36px;
          margin: 0 0 10px 0;
          color: #0b0c0c;
        }
        
        .header p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
        
        .invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 5px;
        }
        
        .invoice-info-item {
          display: flex;
          flex-direction: column;
        }
        
        .invoice-info-item label {
          font-weight: bold;
          color: #0c0c0c;
          margin-bottom: 5px;
        }
        
        .invoice-info-item span {
          color: #555;
          font-size: 15px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        table thead {
          background-color: #050505;
          color: white;
        }
        
        table th {
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          border: 1px solid #151516;
        }
        
        table tbody tr {
          border-bottom: 1px solid #dee2e6;
        }
        
        table tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        table td {
          padding: 12px;
          border: 1px solid #dee2e6;
          font-size: 13px;
          vertical-align: top;
        }
        
        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 30px;
        }
        
        .total-box {
          width: 350px;
          background-color: #f8f9fa;
          border: 2px solid #0f0f0f;
          border-radius: 5px;
          padding: 20px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #dee2e6;
          font-size: 14px;
        }
        
        .total-row.grand {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
          border: none;
          padding: 15px 0;
          background-color: white;
          margin-top: 10px;
        }
        
        .total-row label {
          font-weight: 600;
          color: #333;
        }
        
        .total-row span {
          text-align: right;
          color: #050606;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          font-size: 12px;
          color: #666;
        }
        
        .print-button {
          display: block;
          margin: 30px auto;
          padding: 12px 30px;
          font-size: 16px;
          background-color: #090909;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          text-align: center;
        }
        
        .print-button:hover {
          background-color: #131414;
        }
        
        @media print {
          .print-button {
            display: none;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .container {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FACTURA</h1>
          <p>Número: <strong>#${invoice.id}</strong></p>
        </div>
        
        <div class="invoice-info">
          <div class="invoice-info-item">
            <label>Cliente:</label>
            <span>${clientName}</span>
          </div>
          <div class="invoice-info-item">
            <label>Fecha de Emisión:</label>
            <span>${new Date(invoice.issueDate || invoice.invoiceDate).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">N°</th>
              <th style="width: 30%; text-align: left;">Producto</th>
              <th style="width: 10%; text-align: center;">Cantidad</th>
              <th style="width: 13%; text-align: right;">Precio Unit.</th>
              <th style="width: 22%; text-align: left;">Impuestos</th>
              <th style="width: 15%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-box">
            <div class="total-row">
              <label>Subtotal:</label>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <label>Impuestos:</label>
              <span>$${taxTotal.toFixed(2)}</span>
            </div>
            <div class="total-row grand">
              <label>TOTAL:</label>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Gracias por su compra</p>
          <p>Esta es una factura generada automáticamente por el sistema</p>
        </div>
      </div>

      <button class="print-button" onclick="window.print()">Imprimir / Descargar PDF</button>
    </body>
    </html>
  `;

  printWindow!.document.write(content);
  printWindow!.document.close();
}

  getClientName(id: number): string {
    const client = this.clients.find(c => c.id === id);
    return client ? `${client.firstName} ${client.lastName}` : '';
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