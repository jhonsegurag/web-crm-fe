import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Contact, CreateContactDto, ContactFilters, PaginatedResponse, ApiResponse } from '../../shared/types';

@Injectable({ providedIn: 'root' })
export class ContactsService {
  private http = inject(HttpClient);

  list(filters?: ContactFilters) {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.page) params = params.set('page', String(filters.page));
    return this.http.get<PaginatedResponse<Contact>>('/contacts', { params });
  }

  get(id: string) {
    return this.http.get<ApiResponse<Contact>>(`/contacts/${id}`);
  }

  create(dto: CreateContactDto) {
    return this.http.post<ApiResponse<Contact>>('/contacts', dto);
  }

  update(id: string, dto: Partial<CreateContactDto>) {
    return this.http.put<ApiResponse<Contact>>(`/contacts/${id}`, dto);
  }

  remove(id: string) {
    return this.http.delete<ApiResponse<null>>(`/contacts/${id}`);
  }
}
