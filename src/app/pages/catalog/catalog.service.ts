import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CatalogCategory, Product, PaginatedResponse, ApiResponse } from '../../shared/types';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  getCategories() { return this.http.get<ApiResponse<CatalogCategory[]>>('/catalog/categories'); }
  createCategory(dto: Partial<CatalogCategory>) { return this.http.post<ApiResponse<CatalogCategory>>('/catalog/categories', dto); }
  getProducts(params?: { categoryId?: string; search?: string }) { return this.http.get<PaginatedResponse<Product>>('/catalog/products', { params: params as Record<string, string> }); }
  createProduct(dto: Partial<Product>) { return this.http.post<ApiResponse<Product>>('/catalog/products', dto); }
  updateProduct(id: string, dto: Partial<Product>) { return this.http.put<ApiResponse<Product>>(`/catalog/products/${id}`, dto); }
  deleteProduct(id: string) { return this.http.delete<ApiResponse<null>>(`/catalog/products/${id}`); }
}
