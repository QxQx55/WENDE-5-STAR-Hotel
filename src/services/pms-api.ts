import type {
  PmsGuest, PmsRoom, PmsRoomType, PmsReservation, PmsFolio,
  PmsFolioCharge, PmsPayment, PmsService, PmsHousekeepingTask,
  PmsDashboardStats, RoomStatus, HousekeepingTaskStatus, PaymentMethod,
} from '../types/pms';
import { supabase } from './supabase';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pms-api`;

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
}

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`);
  return data as T;
}

export const guestService = {
  getAll: () => apiCall<PmsGuest[]>('guests'),
  getById: (id: string) => apiCall<PmsGuest>(`guests/${id}`),
  create: (guest: Partial<PmsGuest>) => apiCall<PmsGuest>('guests', { method: 'POST', body: JSON.stringify(guest) }),
  update: (id: string, updates: Partial<PmsGuest>) => apiCall<PmsGuest>(`guests/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
};

export const roomService = {
  getAll: () => apiCall<PmsRoom[]>('rooms'),
  getById: (id: string) => apiCall<PmsRoom>(`rooms/${id}`),
  updateStatus: (id: string, status: RoomStatus) => apiCall<PmsRoom>(`rooms/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const roomTypeService = { getAll: () => apiCall<PmsRoomType[]>('room-types') };

export const reservationService = {
  getAll: () => apiCall<PmsReservation[]>('reservations'),
  getById: (id: string) => apiCall<PmsReservation>(`reservations/${id}`),
  create: (r: Partial<PmsReservation>) => apiCall<PmsReservation>('reservations', { method: 'POST', body: JSON.stringify(r) }),
  confirm: (id: string) => apiCall<PmsReservation>(`reservations/${id}/confirm`, { method: 'PUT' }),
  cancel: (id: string) => apiCall<PmsReservation>(`reservations/${id}/cancel`, { method: 'PUT' }),
  checkIn: (id: string, roomId: string) => apiCall<PmsReservation>(`reservations/${id}/check-in`, { method: 'PUT', body: JSON.stringify({ assigned_room_id: roomId }) }),
  checkOut: (id: string) => apiCall<PmsReservation>(`reservations/${id}/check-out`, { method: 'PUT' }),
};

export const housekeepingService = {
  getAll: () => apiCall<PmsHousekeepingTask[]>('housekeeping'),
  updateStatus: (id: string, status: HousekeepingTaskStatus) => apiCall<PmsHousekeepingTask>(`housekeeping/${id}`, { method: 'PUT', body: JSON.stringify({ task_status: status }) }),
};

export const folioService = {
  getAll: () => apiCall<PmsFolio[]>('folios'),
  getById: (id: string) => apiCall<PmsFolio>(`folios/${id}`),
  addCharge: (id: string, charge: Partial<PmsFolioCharge>) => apiCall<PmsFolioCharge>(`folios/${id}/charges`, { method: 'POST', body: JSON.stringify(charge) }),
};

export const paymentService = {
  getAll: () => apiCall<PmsPayment[]>('payments'),
  record: (p: { folio_id: string; amount: number; payment_method: PaymentMethod; reference_number?: string }) =>
    apiCall<PmsPayment>('payments', { method: 'POST', body: JSON.stringify(p) }),
};

export const serviceService = { getAll: () => apiCall<PmsService[]>('services') };

export const dashboardService = { getStats: () => apiCall<PmsDashboardStats>('dashboard') };

export const auditService = {
  getAll: (filters?: { resource_type?: string; action?: string }) => {
    const params = new URLSearchParams();
    if (filters?.resource_type) params.set('resource_type', filters.resource_type);
    if (filters?.action) params.set('action', filters.action);
    return apiCall<PmsAuditLogEntry[]>(`audit-logs?${params.toString()}`);
  },
};

interface PmsAuditLogEntry {
  id: string;
  action: string;
  resource_type: string;
  details?: string;
  created_at: string;
  user?: { full_name: string };
}
