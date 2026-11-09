import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Appointment, PaginatedResponse, ApiResponse } from '../../shared/types';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private http = inject(HttpClient);
  list(params?: { from?: string; to?: string }) {
    let p = new HttpParams();
    if (params?.from) p = p.set('from', params.from);
    if (params?.to) p = p.set('to', params.to);
    return this.http.get<PaginatedResponse<Appointment>>('/agenda/appointments', { params: p });
  }
  create(dto: Partial<Appointment>) { return this.http.post<ApiResponse<Appointment>>('/agenda/appointments', dto); }
  update(id: string, dto: Partial<Appointment>) { return this.http.put<ApiResponse<Appointment>>(`/agenda/appointments/${id}`, dto); }
  remove(id: string) { return this.http.delete<ApiResponse<null>>(`/agenda/appointments/${id}`); }
}
