// Interfaz para Clientes
export interface Client {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz para Productos
export interface Product {
  id?: number;
  name: string;
  price: number;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz para Impuestos
export interface Tax {
  id?: number;
  name: string;
  currentRate: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaz para Detalles de Invoice
export interface InvoiceItem {
  id?: number;
  invoiceId?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  taxId: number;
  subtotal?: number;
  tax?: number;
  total?: number;
}

// Interfaz para Facturas/Invoices
export interface Invoice {
  id?: number;
  clientId: number;
  invoiceDate: string;
  items: InvoiceItem[];
  subtotal?: number;
  totalTax?: number;
  total?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Respuesta genérica de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}