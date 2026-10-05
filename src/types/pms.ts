export type PmsRole = 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'finance';
export type PaymentGateway = 'telebirr' | 'cbe_birr' | 'mpesa' | 'cbe_bank' | 'dashen_bank' | 'awash_bank' | 'cash' | 'card';
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY' | 'CLEANING' | 'MAINTENANCE';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type FolioStatus = 'OPEN' | 'SETTLED' | 'TRANSFERRED';
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'CANCELLED';
export type PaymentMethodType = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'mobile_money' | 'other';
export type HousekeepingTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'INSPECTED' | 'COMPLETED' | 'CANCELLED';
export type HousekeepingPriority = 'low' | 'normal' | 'high' | 'urgent';
export type HousekeepingReason = 'checkout' | 'maintenance' | 'turnover' | 'deep_clean' | 'other';
export type ChargeType = 'room' | 'service' | 'tax' | 'service_charge' | 'other';
export type ServiceCategory = 'spa' | 'dining' | 'gym' | 'laundry' | 'room_service' | 'activities' | 'transport' | 'other';
export type IdType = 'Passport' | 'License' | 'National ID' | 'Other';

// New types for 5-star modules
export type MaintenancePriority = 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
export type MaintenanceStatus = 'pending' | 'assigned' | 'in_progress' | 'parts_ordered' | 'completed' | 'cancelled';
export type AssetType = 'hvac' | 'plumbing' | 'electrical' | 'furniture' | 'appliance' | 'safety' | 'other';
export type EventStatus = 'inquiry' | 'provisional' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type EventType = 'wedding' | 'conference' | 'meeting' | 'banquet' | 'party' | 'exhibition' | 'other';

// =====================================================
// CORE PMS INTERFACES
// =====================================================

export interface PmsGuest {
  id: string;
  email?: string;
  phone: string;
  first_name: string;
  last_name: string;
  id_number: string;
  id_type?: IdType;
  nationality?: string;
  is_vip?: boolean;
  total_stays?: number;
  total_spent?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PmsRoomType {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  max_occupancy: number;
  amenities: string[];
  image_url?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at: string;
}

export interface PmsRoom {
  id: string;
  room_number: string;
  room_type_id: string;
  floor: number;
  status: RoomStatus;
  last_cleaned_at?: string;
  notes?: string;
  created_at: string;
  room_type?: PmsRoomType;
}

export interface PmsReservation {
  id: string;
  guest_id: string;
  room_type_id: string;
  assigned_room_id?: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  status: ReservationStatus;
  special_requests?: string;
  base_rate: number;
  total_nights?: number;
  created_at: string;
  guest?: PmsGuest;
  room_type?: PmsRoomType;
  assigned_room?: PmsRoom;
}

export interface PmsFolio {
  id: string;
  guest_id: string;
  reservation_id: string;
  status: FolioStatus;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  created_at: string;
  guest?: PmsGuest;
  charges?: PmsFolioCharge[];
  payments?: PmsPayment[];
}

export interface PmsFolioCharge {
  id: string;
  folio_id: string;
  charge_type: ChargeType;
  description: string;
  amount: number;
  quantity: number;
  created_at: string;
}

export interface PmsPayment {
  id: string;
  folio_id: string;
  amount: number;
  payment_method: PaymentMethodType;
  reference_number?: string;
  status: PaymentStatus;
  created_at: string;
}

export interface PmsService {
  id: string;
  name: string;
  category: ServiceCategory;
  description?: string;
  price: number;
  duration_minutes?: number;
  image_url?: string;
  max_capacity?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PmsHousekeepingTask {
  id: string;
  room_id: string;
  task_status: HousekeepingTaskStatus;
  reason: HousekeepingReason;
  assigned_to?: string;
  priority: HousekeepingPriority;
  notes?: string;
  created_at: string;
  room?: PmsRoom;
}

export interface PmsDashboardStats {
  rooms: { total: number; available: number; occupied: number; dirty: number; cleaning: number; maintenance: number };
  reservations: { pending: number; checkedIn: number };
  housekeeping: { pending: number; inProgress: number };
  occupancyRate: number;
}

// =====================================================
// MAINTENANCE MODULE
// =====================================================

export interface PmsMaintenanceRequest {
  id: string;
  room_id?: string;
  asset_id?: string;
  reported_by?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  location?: string;
  estimated_cost?: number;
  actual_cost?: number;
  parts_required?: string[];
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  room?: PmsRoom;
}

export interface PmsPreventiveMaintenance {
  id: string;
  asset_id?: string;
  title: string;
  description?: string;
  frequency: string;
  last_performed?: string;
  next_due?: string;
  assigned_role?: string;
  checklist?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PmsMaintenanceAsset {
  id: string;
  room_id?: string;
  name: string;
  asset_type: AssetType;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  location?: string;
  status: string;
  last_inspection?: string;
  next_inspection?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  room?: PmsRoom;
}

// =====================================================
// LOYALTY MODULE
// =====================================================

export interface PmsLoyaltyTier {
  id: string;
  name: string;
  code: string;
  min_points: number;
  max_points?: number;
  benefits?: Record<string, unknown>;
  points_multiplier: number;
  color: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface PmsLoyaltyMember {
  id: string;
  guest_id: string;
  member_number: string;
  tier_id?: string;
  total_points: number;
  available_points: number;
  lifetime_points: number;
  joined_at: string;
  tier_updated_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
  guest?: PmsGuest;
  tier?: PmsLoyaltyTier;
}

export interface PmsLoyaltyTransaction {
  id: string;
  member_id: string;
  reservation_id?: string;
  type: string;
  points: number;
  description?: string;
  reference?: string;
  expires_at?: string;
  created_at: string;
}

export interface PmsLoyaltyReward {
  id: string;
  name: string;
  description?: string;
  category?: string;
  points_cost: number;
  value_amount?: number;
  available_quantity?: number;
  expiry_days?: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// EVENTS & BANQUETS MODULE
// =====================================================

export interface PmsEventSpace {
  id: string;
  name: string;
  code?: string;
  type: string;
  capacity_theater: number;
  capacity_banquet: number;
  capacity_classroom: number;
  capacity_u_shape: number;
  area_sqm?: number;
  floor?: number;
  base_hourly_rate?: number;
  base_half_day_rate?: number;
  base_full_day_rate?: number;
  amenities?: string[];
  image_urls?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PmsEvent {
  id: string;
  event_number: string;
  title: string;
  event_type: EventType;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  client_company?: string;
  space_id?: string;
  start_datetime: string;
  end_datetime: string;
  setup_start?: string;
  teardown_end?: string;
  expected_guests: number;
  setup_style?: string;
  status: EventStatus;
  total_amount: number;
  deposit_amount: number;
  deposit_paid: boolean;
  special_requirements?: string;
  internal_notes?: string;
  assigned_coordinator?: string;
  created_at: string;
  updated_at: string;
  space?: PmsEventSpace;
}

export interface PmsBanquetOrder {
  id: string;
  event_id: string;
  order_number: string;
  menu_items?: Record<string, unknown>;
  beverage_package?: string;
  dietary_requirements?: string;
  setup_notes?: string;
  service_style?: string;
  staff_required: number;
  equipment_needed?: string[];
  approved_by?: string;
  approved_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
  event?: PmsEvent;
}

export interface PmsCateringMenu {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price_per_person?: number;
  min_guests: number;
  items?: Record<string, unknown>;
  dietary_options?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CHANNEL MANAGEMENT
// =====================================================

export interface PmsChannel {
  id: string;
  name: string;
  code: string;
  type: string;
  commission_rate: number;
  is_active: boolean;
  connection_settings?: Record<string, unknown>;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PmsChannelMapping {
  id: string;
  channel_id: string;
  room_type_id: string;
  channel_room_type_code: string;
  channel_rate_code?: string;
  is_active: boolean;
  created_at: string;
  channel?: PmsChannel;
  room_type?: PmsRoomType;
}

// =====================================================
// GUEST CRM
// =====================================================

export interface PmsGuestPreference {
  id: string;
  guest_id: string;
  category: string;
  preference_key: string;
  preference_value?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PmsGuestCommunication {
  id: string;
  guest_id: string;
  reservation_id?: string;
  type: string;
  direction: string;
  subject?: string;
  message?: string;
  template_used?: string;
  sent_by?: string;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  status: string;
  created_at: string;
}

export interface PmsGuestNote {
  id: string;
  guest_id: string;
  author_id?: string;
  note_type: string;
  content: string;
  is_important: boolean;
  created_at: string;
}

// =====================================================
// NIGHT AUDIT
// =====================================================

export interface PmsDailyAudit {
  id: string;
  audit_date: string;
  opened_by?: string;
  opened_at: string;
  closed_by?: string;
  closed_at?: string;
  status: string;
  room_revenue: number;
  food_revenue: number;
  beverage_revenue: number;
  spa_revenue: number;
  other_revenue: number;
  total_revenue: number;
  vat_amount: number;
  service_charge: number;
  other_taxes: number;
  cash_collected: number;
  card_payments: number;
  mobile_payments: number;
  bank_transfers: number;
  pending_payments: number;
  rooms_occupied: number;
  rooms_available: number;
  occupancy_rate: number;
  adr: number;
  revpar: number;
  arrivals: number;
  departures: number;
  stay_overs: number;
  notes?: string;
  discrepancies?: string[];
  created_at: string;
  updated_at: string;
}

export interface PmsNightAuditLog {
  id: string;
  audit_id: string;
  action: string;
  description?: string;
  performed_by?: string;
  performed_at: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
}

// =====================================================
// INVENTORY MANAGEMENT
// =====================================================

export interface PmsInventoryCategory {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
  sort_order: number;
  created_at: string;
}

export interface PmsInventoryItem {
  id: string;
  sku?: string;
  name: string;
  category_id?: string;
  unit_of_measure: string;
  unit_cost?: number;
  selling_price?: number;
  current_stock: number;
  reorder_level: number;
  reorder_quantity: number;
  preferred_supplier_id?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: PmsInventoryCategory;
}

export interface PmsSupplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PmsInventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: string;
  quantity: number;
  unit_cost?: number;
  reference?: string;
  notes?: string;
  performed_by?: string;
  performed_at: string;
  created_at: string;
  item?: PmsInventoryItem;
}

export interface PmsPurchaseOrder {
  id: string;
  po_number: string;
  supplier_id?: string;
  status: string;
  total_amount: number;
  expected_delivery?: string;
  received_date?: string;
  notes?: string;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  supplier?: PmsSupplier;
  items?: PmsPurchaseOrderItem[];
}

export interface PmsPurchaseOrderItem {
  id: string;
  po_id: string;
  item_id?: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  received_quantity: number;
  notes?: string;
  created_at: string;
  item?: PmsInventoryItem;
}

// =====================================================
// STAFF MANAGEMENT
// =====================================================

export interface PmsDepartment {
  id: string;
  name: string;
  code?: string;
  manager_id?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface PmsStaffSchedule {
  id: string;
  staff_id: string;
  department_id?: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  break_minutes: number;
  notes?: string;
  is_approved: boolean;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  department?: PmsDepartment;
}

export interface PmsTimeEntry {
  id: string;
  staff_id: string;
  schedule_id?: string;
  clock_in: string;
  clock_out?: string;
  break_minutes: number;
  overtime_minutes: number;
  notes?: string;
  ip_address?: string;
  device_info?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// RATE MANAGEMENT
// =====================================================

export interface PmsRatePlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  room_type_id?: string;
  base_rate: number;
  meal_plan: string;
  cancellation_policy?: string;
  min_nights: number;
  max_nights?: number;
  advance_purchase_days?: number;
  deposit_required: number;
  is_member_only: boolean;
  is_corporate: boolean;
  valid_from?: string;
  valid_to?: string;
  booking_window_start?: number;
  booking_window_end?: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  room_type?: PmsRoomType;
}

export interface PmsRateRestriction {
  id: string;
  rate_plan_id: string;
  room_type_id: string;
  restriction_type: string;
  start_date: string;
  end_date: string;
  value?: number;
  days_of_week?: number[];
  reason?: string;
  created_by?: string;
  created_at: string;
  rate_plan?: PmsRatePlan;
  room_type?: PmsRoomType;
}

export interface PmsDerivedRate {
  id: string;
  parent_rate_plan_id: string;
  child_rate_plan_id: string;
  adjustment_type: string;
  adjustment_value: number;
  created_at: string;
}

// =====================================================
// MOBILE KEY & GUEST REQUESTS
// =====================================================

export interface PmsMobileKey {
  id: string;
  reservation_id: string;
  room_id?: string;
  guest_id: string;
  key_code: string;
  device_id?: string;
  device_type?: string;
  issued_at: string;
  expires_at: string;
  activated_at?: string;
  revoked_at?: string;
  status: string;
  access_count: number;
  last_access?: string;
  created_at: string;
  updated_at: string;
  reservation?: PmsReservation;
  room?: PmsRoom;
  guest?: PmsGuest;
}

export interface PmsGuestRequest {
  id: string;
  reservation_id?: string;
  guest_id: string;
  request_type: string;
  description: string;
  priority: string;
  status: string;
  assigned_to?: string;
  acknowledged_at?: string;
  completed_at?: string;
  guest_rating?: number;
  guest_feedback?: string;
  created_at: string;
  updated_at: string;
  guest?: PmsGuest;
  reservation?: PmsReservation;
}

// =====================================================
// POS MODULE
// =====================================================

export interface PmsPosTerminal {
  id: string;
  terminal_code: string;
  name: string;
  location?: string;
  outlet_id?: string;
  is_active: boolean;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

export interface PmsPosTransaction {
  id: string;
  transaction_number: string;
  terminal_id?: string;
  folio_id?: string;
  guest_id?: string;
  reservation_id?: string;
  items: Record<string, unknown>[];
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  total_amount: number;
  payment_method?: PaymentMethodType;
  payment_status: PaymentStatus;
  posted_to_folio: boolean;
  cash_received?: number;
  change_given?: number;
  server_id?: string;
  transaction_time: string;
  cancelled_at?: string;
  cancelled_by?: string;
  notes?: string;
  created_at: string;
  terminal?: PmsPosTerminal;
  guest?: PmsGuest;
}

// =====================================================
// GUEST BOOKING TYPES (Public-facing)
// =====================================================

export interface GuestBooking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_nationality?: string;
  id_type?: string;
  id_number?: string;
  room_type_id?: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  number_of_rooms: number;
  special_requests?: string;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_gateway?: PaymentGateway;
  payment_reference?: string;
  booking_reference: string;
  status: ReservationStatus;
  created_at: string;
  room_type?: PmsRoomType;
}

export interface TableReservation {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  reservation_date: string;
  reservation_time: string;
  number_of_guests: number;
  table_number?: string;
  special_requests?: string;
  occasion?: string;
  deposit_amount: number;
  payment_status: PaymentStatus;
  payment_gateway?: PaymentGateway;
  payment_reference?: string;
  reservation_reference: string;
  status: ReservationStatus;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  booking_id?: string;
  table_reservation_id?: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  transaction_reference?: string;
  phone_number?: string;
  account_number?: string;
  status: PaymentStatus;
  gateway_response?: Record<string, unknown>;
  verified_at?: string;
  created_at: string;
}

// =====================================================
// ETHIOPIAN PAYMENT GATEWAY INFO
// =====================================================

export interface PaymentGatewayInfo {
  id: PaymentGateway;
  name: string;
  type: 'mobile_money' | 'bank' | 'card' | 'cash';
  logo?: string;
  color: string;
  instructions: string;
}
