export interface Appointment {
  id: string;
  contactId?: string;
  assignedTo: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  locationText?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reminderMinutes: number;
}
