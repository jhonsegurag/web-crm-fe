import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Conversation, Message, PaginatedResponse, ApiResponse } from '../../shared/types';

@Injectable({ providedIn: 'root' })
export class InboxService {
  private http = inject(HttpClient);

  listConversations(params?: { status?: string; channel?: string }) {
    let p = new HttpParams();
    if (params?.status) p = p.set('status', params.status);
    if (params?.channel) p = p.set('channel', params.channel);
    return this.http.get<PaginatedResponse<Conversation>>('/inbox/conversations', { params: p });
  }

  getConversation(id: string) {
    return this.http.get<ApiResponse<Conversation>>(`/inbox/conversations/${id}`);
  }

  createConversation(dto: Partial<Conversation>) {
    return this.http.post<ApiResponse<Conversation>>('/inbox/conversations', dto);
  }

  patchConversation(id: string, dto: Partial<Conversation>) {
    return this.http.patch<ApiResponse<Conversation>>(`/inbox/conversations/${id}`, dto);
  }

  getMessages(conversationId: string) {
    return this.http.get<PaginatedResponse<Message>>(`/inbox/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: string, content: string, senderType = 'user') {
    return this.http.post<ApiResponse<Message>>(`/inbox/conversations/${conversationId}/messages`, { content, senderType });
  }
}
