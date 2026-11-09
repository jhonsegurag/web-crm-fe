import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResponse, PaginatedResponse } from '../../shared/types';

export interface AgentConfig {
  id?: string; name?: string; provider?: string; model?: string;
  systemPrompt?: string; temperature?: number; maxTokens?: number; isActive?: boolean;
}

export interface AgentLog {
  id: string; input: string; output?: string; status: string;
  tokensUsed?: number; latencyMs?: number; createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  private http = inject(HttpClient);
  getConfig() { return this.http.get<ApiResponse<AgentConfig>>('/agent/config'); }
  updateConfig(dto: Partial<AgentConfig>) { return this.http.put<ApiResponse<AgentConfig>>('/agent/config', dto); }
  getLogs() { return this.http.get<PaginatedResponse<AgentLog>>('/agent/logs'); }
}
