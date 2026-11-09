import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResponse, PaginatedResponse } from '../../shared/types';

export interface UserDto { id?: string; email?: string; roleId?: string; isActive?: boolean; }
export interface RoleDto { id?: string; name?: string; permissions?: string[]; }
export interface IntegrationDto { id?: string; type?: string; name?: string; isActive?: boolean; }

@Injectable({ providedIn: 'root' })
export class ConfigurationService {
  private http = inject(HttpClient);
  getUsers() { return this.http.get<PaginatedResponse<UserDto>>('/config/users'); }
  createUser(dto: UserDto & { password: string }) { return this.http.post<ApiResponse<UserDto>>('/config/users', dto); }
  updateUser(id: string, dto: Partial<UserDto>) { return this.http.put<ApiResponse<UserDto>>(`/config/users/${id}`, dto); }
  deleteUser(id: string) { return this.http.delete<ApiResponse<null>>(`/config/users/${id}`); }
  getRoles() { return this.http.get<ApiResponse<RoleDto[]>>('/config/roles'); }
  createRole(dto: RoleDto) { return this.http.post<ApiResponse<RoleDto>>('/config/roles', dto); }
  getIntegrations() { return this.http.get<ApiResponse<IntegrationDto[]>>('/config/integrations'); }
  toggleIntegration(id: string) { return this.http.patch<ApiResponse<IntegrationDto>>(`/config/integrations/${id}/toggle`, {}); }
}
