import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../shared/types';

export interface BusinessDto { id?: string; name?: string; slug?: string; timezone?: string; currency?: string; plan?: string; logoUrl?: string; }
export interface LocationDto { id?: string; name?: string; address?: string; city?: string; country?: string; phone?: string; isPrimary?: boolean; }

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private http = inject(HttpClient);
  get() { return this.http.get<ApiResponse<BusinessDto>>('/business'); }
  update(dto: Partial<BusinessDto>) { return this.http.put<ApiResponse<BusinessDto>>('/business', dto); }
  getLocations() { return this.http.get<ApiResponse<LocationDto[]>>('/business/locations'); }
  createLocation(dto: Partial<LocationDto>) { return this.http.post<ApiResponse<LocationDto>>('/business/locations', dto); }
  updateLocation(id: string, dto: Partial<LocationDto>) { return this.http.put<ApiResponse<LocationDto>>(`/business/locations/${id}`, dto); }
  deleteLocation(id: string) { return this.http.delete<ApiResponse<null>>(`/business/locations/${id}`); }
}
