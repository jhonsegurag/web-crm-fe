import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../shared/types';

export interface FeatureFlag {
  id: string; key: string; label?: string; description?: string; isEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class LabsService {
  private http = inject(HttpClient);
  getFlags() { return this.http.get<ApiResponse<FeatureFlag[]>>('/labs'); }
  toggle(key: string, isEnabled: boolean) { return this.http.patch<ApiResponse<FeatureFlag>>(`/labs/${key}`, { isEnabled }); }
}
