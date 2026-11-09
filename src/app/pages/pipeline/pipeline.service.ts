import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PipelineStage, Deal, PaginatedResponse, ApiResponse } from '../../shared/types';

@Injectable({ providedIn: 'root' })
export class PipelineService {
  private http = inject(HttpClient);

  getStages() { return this.http.get<ApiResponse<PipelineStage[]>>('/pipeline/stages'); }
  createStage(dto: Partial<PipelineStage>) { return this.http.post<ApiResponse<PipelineStage>>('/pipeline/stages', dto); }
  updateStage(id: string, dto: Partial<PipelineStage>) { return this.http.put<ApiResponse<PipelineStage>>(`/pipeline/stages/${id}`, dto); }
  deleteStage(id: string) { return this.http.delete<ApiResponse<null>>(`/pipeline/stages/${id}`); }

  getDeals(stageId?: string) {
    const params: Record<string, string> = stageId ? { stageId } : {};
    return this.http.get<PaginatedResponse<Deal>>('/pipeline/deals', { params });
  }
  createDeal(dto: Partial<Deal>) { return this.http.post<ApiResponse<Deal>>('/pipeline/deals', dto); }
  updateDeal(id: string, dto: Partial<Deal>) { return this.http.put<ApiResponse<Deal>>(`/pipeline/deals/${id}`, dto); }
  moveDeal(id: string, stageId: string, position: number) { return this.http.patch<ApiResponse<Deal>>(`/pipeline/deals/${id}/move`, { stageId, position }); }
  deleteDeal(id: string) { return this.http.delete<ApiResponse<null>>(`/pipeline/deals/${id}`); }
}
