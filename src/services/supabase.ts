import { createClient } from '@supabase/supabase-js';
import type { Room, Booking, User, Guest, Invoice, Payment, Task, Review } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const HAS_SUPABASE_CONFIG = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const createMockQueryBuilder = <T = any>(initialData: T[] = []) => {
  let data = [...initialData];

  const result: any = {
    data,
    error: null,
    count: data.length,
  };

  result.select = () => {
    result.data = data;
    result.count = data.length;
    return result;
  };

  result.order = () => result;
  result.eq = () => result;
  result.neq = () => result;
  result.lt = () => result;
  result.gt = () => result;
  result.limit = () => result;
  result.maybeSingle = () => ({
    data: data[0] ?? null,
    error: null,
    count: data.length,
  });
  result.single = () => ({
    data: data[0] ?? null,
    error: null,
    count: data.length,
  });
  result.insert = (rows: T[] = []) => {
    data = [...data, ...rows];
    result.data = data;
    result.count = data.length;
    return result;
  };
  result.update = (updates: Partial<T>) => {
    data = data.map((item: any) => ({ ...item, ...updates }));
    result.data = data;
    result.count = data.length;
    return result;
  };
  result.delete = () => {
    data = [];
    result.data = data;
    result.count = 0;
    return result;
  };

  return result;
};

let mockDemoUser: any = null;
const createDemoUser = (
  email: string,
  role: 'customer' | 'staff' | 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'finance' = 'customer'
) => ({
  id: 'demo-user-id',
  email,
  app_metadata: { role },
  user_metadata: { full_name: 'Demo Guest', role },
  role,
  full_name: 'Demo Guest',
});

const mockSupabase = {
  auth: {
    signUp: async (payload: {
      email: string;
      options?: { data?: { role?: 'customer' | 'staff' | 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'finance'; full_name?: string } };
    }) => {
      const role = payload.options?.data?.role ?? 'customer';
      mockDemoUser = createDemoUser(payload.email, role);
      const user = { ...mockDemoUser, user_metadata: { full_name: payload.options?.data?.full_name ?? 'Demo Guest', role } };
      return {
        data: { user, session: { user } },
        error: null,
      };
    },
    signInWithPassword: async (payload: { email: string }) => {
      mockDemoUser = createDemoUser(payload.email, 'customer');
      const user = { ...mockDemoUser, user_metadata: { full_name: 'Demo Guest', role: 'customer' } };
      return {
        data: { user, session: { user } },
        error: null,
      };
    },
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: mockDemoUser ? { user: mockDemoUser } : null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
      error: null,
    }),
  },
  from: () => createMockQueryBuilder(),
  channel: () => ({
    on: () => ({ on: () => ({ on: () => ({ on: () => ({ subscribe: () => ({}) }) }) }) }),
    subscribe: () => ({})
  }),
  removeChannel: () => undefined,
  rpc: async () => ({ data: [], error: null }),
};

export const supabase: any = HAS_SUPABASE_CONFIG ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : mockSupabase;

// Type definitions for response
export type Profile = User;

// Auth Service
export const authService = {
  async signUp(
    email: string,
    password: string,
    fullName: string,
    role: 'customer' | 'staff' | 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'finance' = 'customer'
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Room Service
export const roomService = {
  async getRooms(): Promise<Room[]> {
    const { data, error } = await supabase.from('rooms').select('*').order('room_number');

    if (error) throw error;
    return data || [];
  },

  async getRoomById(id: string): Promise<Room | null> {
    const { data, error } = await supabase.from('rooms').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAvailableRooms(checkIn: string, checkOut: string): Promise<Room[]> {
    const { data: conflictingReservations, error: reservationError } = await supabase
      .from('reservations')
      .select('room_id')
      .neq('status', 'Cancelled')
      .lt('check_in_date', checkOut)
      .gt('check_out_date', checkIn);

    if (reservationError) throw reservationError;

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'Available')
      .order('room_type');

    if (error) throw error;
    const reservedRoomIds = new Set((conflictingReservations ?? []).map((reservation) => reservation.room_id));
    return (data ?? []).filter((room) => !reservedRoomIds.has(room.id));
  },

  async createRoom(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<Room> {
    const { data, error } = await supabase.from('rooms').insert([room]).select().single();

    if (error) throw error;
    return data;
  },

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRoom(id: string): Promise<void> {
    const { error } = await supabase.from('rooms').delete().eq('id', id);

    if (error) throw error;
  },
};

// Booking Service
export const bookingService = {
  async getBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, room_id(*), guest_id(*)')
      .order('check_in_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, room_id(*), guest_id(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getUserBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, room_id(*), guest_id(*)')
      .eq('created_by', userId)
      .order('check_in_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('reservations')
      .insert([booking])
      .select('*, room_id(*), guest_id(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select('*, room_id(*), guest_id(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async cancelBooking(id: string): Promise<void> {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'Cancelled' })
      .eq('id', id);

    if (error) throw error;
  },
};

// Guest Service
export const guestService = {
  async getGuests(): Promise<Guest[]> {
    const { data, error } = await supabase.from('guests').select('*').order('first_name');

    if (error) throw error;
    return data || [];
  },

  async getGuestById(id: string): Promise<Guest | null> {
    const { data, error } = await supabase.from('guests').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    return data;
  },

  async createGuest(guest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>): Promise<Guest> {
    const { data, error } = await supabase.from('guests').insert([guest]).select().single();

    if (error) throw error;
    return data;
  },

  async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest> {
    const { data, error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// User Service
export const userService = {
  async getProfile(userId: string, fallbackProfile?: Partial<User>): Promise<User | null> {
    if (!HAS_SUPABASE_CONFIG) {
      return {
        id: userId,
        email: fallbackProfile?.email ?? mockDemoUser?.email ?? 'demo@hotel.com',
        full_name: fallbackProfile?.full_name ?? mockDemoUser?.full_name ?? 'Demo Guest',
        role: fallbackProfile?.role ?? mockDemoUser?.role ?? 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User;
    }

    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: any) {
      const message = error?.message ?? '';
      if (message.includes('does not exist') || message.includes('relation "profiles"')) {
        return {
          id: userId,
          email: fallbackProfile?.email ?? 'unknown@hotel.com',
          full_name: fallbackProfile?.full_name ?? 'Hotel Guest',
          role: fallbackProfile?.role ?? 'customer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User;
      }
      throw error;
    }
  },

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');

    if (error) throw error;
    return data || [];
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Invoice Service
export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    return data;
  },

  async getInvoiceByReservation(reservationId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('reservation_id', reservationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at'>): Promise<Invoice> {
    const { data, error } = await supabase.from('invoices').insert([invoice]).select().single();

    if (error) throw error;
    return data;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Payment Service
export const paymentService = {
  async getPayments(): Promise<Payment[]> {
    const { data, error } = await supabase.from('payments').select('*').order('paid_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('paid_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async recordPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const { data, error } = await supabase.from('payments').insert([payment]).select().single();

    if (error) throw error;
    return data;
  },
};

// Task Service
export const taskService = {
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase.from('staff_tasks').select('*').order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTasksByStaff(staffId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('staff_tasks')
      .select('*')
      .eq('staff_id', staffId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTask(task: Omit<Task, 'id' | 'assigned_at'>): Promise<Task> {
    const { data, error } = await supabase.from('staff_tasks').insert([task]).select().single();

    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('staff_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Review Service
export const reviewService = {
  async getReviews(): Promise<Review[]> {
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getReviewsByRoom(roomId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createReview(review: Omit<Review, 'id' | 'created_at' | 'updated_at'>): Promise<Review> {
    const { data, error } = await supabase.from('reviews').insert([review]).select().single();

    if (error) throw error;
    return data;
  },
};
