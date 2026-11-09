import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Floor, Room, Table, ApiResponse } from '../../shared/types';

@Injectable({ providedIn: 'root' })
export class MapService {
  private http = inject(HttpClient);
  getFloors() { return this.http.get<ApiResponse<Floor[]>>('/map/floors'); }
  getFloor(id: string) { return this.http.get<ApiResponse<Floor>>(`/map/floors/${id}`); }
  createFloor(dto: Partial<Floor>) { return this.http.post<ApiResponse<Floor>>('/map/floors', dto); }
  updateFloor(id: string, dto: Partial<Floor>) { return this.http.put<ApiResponse<Floor>>(`/map/floors/${id}`, dto); }
  getRooms(floorId: string) { return this.http.get<ApiResponse<Room[]>>(`/map/floors/${floorId}/rooms`); }
  createRoom(floorId: string, dto: Partial<Room>) { return this.http.post<ApiResponse<Room>>(`/map/floors/${floorId}/rooms`, dto); }
  getTables(floorId: string) { return this.http.get<ApiResponse<Table[]>>(`/map/floors/${floorId}/tables`); }
  createTable(floorId: string, dto: Partial<Table>) { return this.http.post<ApiResponse<Table>>(`/map/floors/${floorId}/tables`, dto); }
  updateTable(id: string, dto: Partial<Table>) { return this.http.put<ApiResponse<Table>>(`/map/tables/${id}`, dto); }
}
