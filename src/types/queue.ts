export type TicketStatus = 'waiting' | 'called' | 'completed' | 'skipped';

export interface Clinic {
  id: string;
  name: string;
  roomNumber: string;
  prefix: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  clinicId: string;
  clinicName: string;
  roomNumber: string;
  status: TicketStatus;
  createdAt: number;
  calledAt?: number;
  completedAt?: number;
}

export interface ActiveCall {
  id: string;
  clinicId: string;
  clinicName: string;
  roomNumber: string;
  ticketNumber: string;
  patientName: string;
  calledAt: number;
  expiresAt: number;
}
