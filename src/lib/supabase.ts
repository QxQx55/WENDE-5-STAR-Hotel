import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff';
  created_at: string;
  updated_at: string;
};

export type Guest = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  id_number: string;
  nationality?: string;
  address?: string;
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  room_number: string;
  room_type: 'Standard' | 'Deluxe' | 'Suite' | 'Presidential';
  floor: number;
  price_per_night: number;
  max_occupancy: number;
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
  amenities: string[];
  created_at: string;
  updated_at: string;
};

export type Reservation = {
  id: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  actual_check_in?: string;
  actual_check_out?: string;
  number_of_guests: number;
  status: 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled';
  special_requests?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  guests?: Guest;
  rooms?: Room;
};

export type Service = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: 'Food' | 'Spa' | 'Minibar' | 'Laundry' | 'Other';
  active: boolean;
  created_at: string;
};

export type ReservationService = {
  id: string;
  reservation_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  added_at: string;
  services?: Service;
};

export type Invoice = {
  id: string;
  reservation_id: string;
  invoice_number: string;
  room_charges: number;
  service_charges: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  service_charge_rate: number;
  service_charge_amount: number;
  total_amount: number;
  payment_status: 'Pending' | 'Partial' | 'Paid';
  created_at: string;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: 'Cash' | 'Card' | 'Mobile';
  transaction_reference?: string;
  paid_at: string;
  received_by?: string;
};
