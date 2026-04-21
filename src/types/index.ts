// User and Authentication Types
export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  bio?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

// Guest Types
export interface Guest {
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
}

// Room Types
export type RoomType = 'Standard' | 'Deluxe' | 'Suite' | 'Presidential';
export type RoomStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';

export interface Room {
  id: string;
  room_number: string;
  room_type: RoomType;
  price_per_night: number;
  status: RoomStatus;
  max_occupancy: number;
  amenities?: string[];
  floor: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Booking Types
export type BookingStatus = 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled';

export interface Booking {
  id: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  status: BookingStatus;
  special_requests?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  room?: Room;
  guest?: Guest;
}

// Invoice Types
export type InvoiceStatus = 'Pending' | 'Partial' | 'Paid';

export interface Invoice {
  id: string;
  reservation_id: string;
  invoice_number: string;
  room_charges: number;
  service_charges: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: InvoiceStatus;
  created_at: string;
}

// Payment Types
export type PaymentMethod = 'Cash' | 'Card' | 'Mobile';

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  paid_at: string;
  received_by?: string;
}

// Task Types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  staff_id: string;
  task_description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  room_id?: string;
  assigned_by?: string;
  assigned_at: string;
  completed_at?: string;
  notes?: string;
}

// Review Types
export interface Review {
  id: string;
  user_id: string;
  room_id: string;
  booking_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

// Hotel Room Types (Simplified for booking system)
export interface HotelRoom {
  id: string;
  name: string;
  description?: string;
  price_per_night: number;
  images: string[];
  is_available: boolean;
  created_at: string;
}

// Hotel Booking Types (Simplified for booking system)
export type HotelBookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface HotelBooking {
  id: string;
  user_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: HotelBookingStatus;
  created_at: string;
  room?: HotelRoom;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
