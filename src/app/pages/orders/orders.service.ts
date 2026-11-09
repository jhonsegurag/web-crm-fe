import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Order, OrderItem, PaginatedResponse, ApiResponse } from '../../shared/types';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  list(params?: { status?: string; page?: number }) {
    let p = new HttpParams();
    if (params?.status) p = p.set('status', params.status);
    if (params?.page) p = p.set('page', String(params.page));
    return this.http.get<PaginatedResponse<Order>>('/orders', { params: p });
  }
  get(id: string) { return this.http.get<ApiResponse<Order>>(`/orders/${id}`); }
  create(dto: Partial<Order>) { return this.http.post<ApiResponse<Order>>('/orders', dto); }
  updateStatus(id: string, status: string) { return this.http.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }); }
  addItem(orderId: string, productId: string, quantity: number) { return this.http.post<ApiResponse<OrderItem>>(`/orders/${orderId}/items`, { productId, quantity }); }
}
