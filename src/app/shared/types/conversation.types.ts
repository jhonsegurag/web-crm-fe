export interface Conversation {
  id: string;
  businessId: string;
  contactId?: string;
  channel: 'chat' | 'email' | 'whatsapp' | 'sms';
  subject?: string;
  status: 'open' | 'pending' | 'resolved' | 'archived';
  assignedTo?: string;
  lastMessageAt?: string;
  createdAt: string;
  contact?: { id: string; firstName: string; lastName?: string; email?: string };
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'user' | 'contact' | 'agent';
  senderId?: string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}
