export interface Order {
  id: string;
  code: string;
  contactId?: string;
  tableId?: string;
  status: 'draft' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'refunded';
  channel: 'in_store' | 'online' | 'phone' | 'app';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items?: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}
