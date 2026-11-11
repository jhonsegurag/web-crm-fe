import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Order, OrderItem, AddItemRequest, PaginatedResponse, ApiResponse } from '../../shared/types';

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

  updateStatus(id: string, status: string) {
    return this.http.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
  }

  addItem(orderId: string, dto: AddItemRequest) {
    return this.http.post<ApiResponse<OrderItem>>(`/orders/${orderId}/items`, dto);
  }

  updateItem(orderId: string, itemId: string, dto: Partial<AddItemRequest>) {
    return this.http.put<ApiResponse<OrderItem>>(`/orders/${orderId}/items/${itemId}`, dto);
  }

  removeItem(orderId: string, itemId: string) {
    return this.http.delete<ApiResponse<null>>(`/orders/${orderId}/items/${itemId}`);
  }
}
