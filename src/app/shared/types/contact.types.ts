export interface Contact {
  id: string;
  businessId: string;
  type: 'customer' | 'lead' | 'supplier';
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  avatarUrl?: string;
  tags?: string[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactDto {
  type: 'customer' | 'lead' | 'supplier';
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface ContactFilters {
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}
