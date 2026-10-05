/*
# 5-Star Hotel PMS - Enum Types and Missing Modules

Creates all required enum types and the comprehensive modules for a five-star hotel.

## Enum Types Created
- maintenance_priority, maintenance_status, asset_type
- event_status, event_type
- payment_method (if not exists)

## Then creates all tables for:
1. Maintenance & Engineering
2. Loyalty Program
3. Events & Banquets
4. Channel Management
5. Guest CRM Enhancements
6. Night Audit
7. Inventory Management
8. Staff Management
9. Rate Management Enhancements
10. Mobile Key & Guest Requests
11. POS Integration
*/

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE maintenance_priority AS ENUM ('low', 'normal', 'high', 'urgent', 'emergency');
CREATE TYPE maintenance_status AS ENUM ('pending', 'assigned', 'in_progress', 'parts_ordered', 'completed', 'cancelled');
CREATE TYPE asset_type AS ENUM ('hvac', 'plumbing', 'electrical', 'furniture', 'appliance', 'safety', 'other');
CREATE TYPE event_status AS ENUM ('inquiry', 'provisional', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE event_type AS ENUM ('wedding', 'conference', 'meeting', 'banquet', 'party', 'exhibition', 'other');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_money', 'other');
  END IF;
END $$;

-- =====================================================
-- 1. MAINTENANCE & ENGINEERING MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES pms_rooms(id) ON DELETE SET NULL,
  asset_id UUID,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority maintenance_priority DEFAULT 'normal',
  status maintenance_status DEFAULT 'pending',
  location TEXT,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  parts_required TEXT[],
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_preventive_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  last_performed DATE,
  next_due DATE,
  assigned_role TEXT,
  checklist JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_maintenance_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES pms_rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  asset_type asset_type DEFAULT 'other',
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  location TEXT,
  status TEXT DEFAULT 'operational',
  last_inspection DATE,
  next_inspection DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. LOYALTY PROGRAM MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  min_points INTEGER DEFAULT 0,
  max_points INTEGER,
  benefits JSONB,
  points_multiplier DECIMAL(3,2) DEFAULT 1.0,
  color TEXT DEFAULT 'slate',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_loyalty_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES pms_guests(id) ON DELETE CASCADE,
  member_number TEXT UNIQUE NOT NULL DEFAULT 'LY' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 100000)::text, 5, '0'),
  tier_id UUID REFERENCES pms_loyalty_tiers(id) ON DELETE SET NULL,
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  tier_updated_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES pms_loyalty_members(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES pms_reservations(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  reference TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  points_cost INTEGER NOT NULL,
  value_amount DECIMAL(10,2),
  available_quantity INTEGER,
  expiry_days INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. EVENTS & BANQUETS MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_event_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT DEFAULT 'ballroom',
  capacity_theater INTEGER DEFAULT 100,
  capacity_banquet INTEGER DEFAULT 80,
  capacity_classroom INTEGER DEFAULT 50,
  capacity_u_shape INTEGER DEFAULT 30,
  area_sqm DECIMAL(10,2),
  floor INTEGER,
  base_hourly_rate DECIMAL(10,2),
  base_half_day_rate DECIMAL(10,2),
  base_full_day_rate DECIMAL(10,2),
  amenities TEXT[],
  image_urls TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_number TEXT UNIQUE NOT NULL DEFAULT 'EV' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0'),
  title TEXT NOT NULL,
  event_type event_type DEFAULT 'other',
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_company TEXT,
  space_id UUID REFERENCES pms_event_spaces(id) ON DELETE SET NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  setup_start TIMESTAMPTZ,
  teardown_end TIMESTAMPTZ,
  expected_guests INTEGER DEFAULT 0,
  setup_style TEXT DEFAULT 'banquet',
  status event_status DEFAULT 'inquiry',
  total_amount DECIMAL(12,2) DEFAULT 0,
  deposit_amount DECIMAL(12,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  special_requirements TEXT,
  internal_notes TEXT,
  assigned_coordinator UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_banquet_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES pms_events(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL DEFAULT 'BEO' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 1000)::text, 3, '0'),
  menu_items JSONB,
  beverage_package TEXT,
  dietary_requirements TEXT,
  setup_notes TEXT,
  service_style TEXT DEFAULT 'plated',
  staff_required INTEGER DEFAULT 0,
  equipment_needed TEXT[],
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_catering_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price_per_person DECIMAL(10,2),
  min_guests INTEGER DEFAULT 10,
  items JSONB,
  dietary_options TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. CHANNEL MANAGEMENT MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'ota',
  commission_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  connection_settings JSONB,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_channel_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES pms_channels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES pms_room_types(id) ON DELETE CASCADE,
  channel_room_type_code TEXT NOT NULL,
  channel_rate_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. GUEST CRM ENHANCEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_guest_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES pms_guests(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(guest_id, category, preference_key)
);

CREATE TABLE IF NOT EXISTS pms_guest_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES pms_guests(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES pms_reservations(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound',
  subject TEXT,
  message TEXT,
  template_used TEXT,
  sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_guest_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES pms_guests(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note_type TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. NIGHT AUDIT MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_daily_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_date DATE NOT NULL UNIQUE,
  opened_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'open',
  room_revenue DECIMAL(12,2) DEFAULT 0,
  food_revenue DECIMAL(12,2) DEFAULT 0,
  beverage_revenue DECIMAL(12,2) DEFAULT 0,
  spa_revenue DECIMAL(12,2) DEFAULT 0,
  other_revenue DECIMAL(12,2) DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  vat_amount DECIMAL(12,2) DEFAULT 0,
  service_charge DECIMAL(12,2) DEFAULT 0,
  other_taxes DECIMAL(12,2) DEFAULT 0,
  cash_collected DECIMAL(12,2) DEFAULT 0,
  card_payments DECIMAL(12,2) DEFAULT 0,
  mobile_payments DECIMAL(12,2) DEFAULT 0,
  bank_transfers DECIMAL(12,2) DEFAULT 0,
  pending_payments DECIMAL(12,2) DEFAULT 0,
  rooms_occupied INTEGER DEFAULT 0,
  rooms_available INTEGER DEFAULT 0,
  occupancy_rate DECIMAL(5,2) DEFAULT 0,
  adr DECIMAL(10,2) DEFAULT 0,
  revpar DECIMAL(10,2) DEFAULT 0,
  arrivals INTEGER DEFAULT 0,
  departures INTEGER DEFAULT 0,
  stay_overs INTEGER DEFAULT 0,
  notes TEXT,
  discrepancies TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_night_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES pms_daily_audits(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ DEFAULT now(),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. INVENTORY MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES pms_inventory_categories(id) ON DELETE SET NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES pms_inventory_categories(id) ON DELETE SET NULL,
  unit_of_measure TEXT DEFAULT 'each',
  unit_cost DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  current_stock DECIMAL(10,2) DEFAULT 0,
  reorder_level DECIMAL(10,2) DEFAULT 10,
  reorder_quantity DECIMAL(10,2) DEFAULT 50,
  preferred_supplier_id UUID,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES pms_inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference TEXT,
  notes TEXT,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL DEFAULT 'PO' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0'),
  supplier_id UUID REFERENCES pms_suppliers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  total_amount DECIMAL(12,2) DEFAULT 0,
  expected_delivery DATE,
  received_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES pms_purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES pms_inventory_items(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  received_quantity DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. STAFF MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES pms_departments(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  break_minutes INTEGER DEFAULT 60,
  notes TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES pms_staff_schedules(id) ON DELETE SET NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  notes TEXT,
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 9. RATE MANAGEMENT ENHANCEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  room_type_id UUID REFERENCES pms_room_types(id) ON DELETE CASCADE,
  base_rate DECIMAL(10,2) NOT NULL,
  meal_plan TEXT DEFAULT 'room_only',
  cancellation_policy TEXT,
  min_nights INTEGER DEFAULT 1,
  max_nights INTEGER,
  advance_purchase_days INTEGER,
  deposit_required DECIMAL(5,2) DEFAULT 0,
  is_member_only BOOLEAN DEFAULT false,
  is_corporate BOOLEAN DEFAULT false,
  valid_from DATE,
  valid_to DATE,
  booking_window_start INTEGER,
  booking_window_end INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_rate_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_plan_id UUID REFERENCES pms_rate_plans(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES pms_room_types(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  value INTEGER,
  days_of_week INTEGER[],
  reason TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_derived_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_rate_plan_id UUID REFERENCES pms_rate_plans(id) ON DELETE CASCADE,
  child_rate_plan_id UUID REFERENCES pms_rate_plans(id) ON DELETE CASCADE,
  adjustment_type TEXT DEFAULT 'offset',
  adjustment_value DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. MOBILE KEY & GUEST REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_mobile_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES pms_reservations(id) ON DELETE CASCADE,
  room_id UUID REFERENCES pms_rooms(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES pms_guests(id) ON DELETE CASCADE,
  key_code TEXT UNIQUE NOT NULL,
  device_id TEXT,
  device_type TEXT,
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  access_count INTEGER DEFAULT 0,
  last_access TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_guest_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES pms_reservations(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES pms_guests(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  guest_rating INTEGER,
  guest_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 11. POS MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS pms_pos_terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  outlet_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pms_pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT UNIQUE NOT NULL DEFAULT 'TXN' || to_char(now(), 'YYYYMMDDHH24MISS') || lpad(floor(random() * 1000)::text, 3, '0'),
  terminal_id UUID REFERENCES pms_pos_terminals(id) ON DELETE SET NULL,
  folio_id UUID REFERENCES pms_folios(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES pms_guests(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES pms_reservations(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  service_charge DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  payment_method payment_method,
  payment_status payment_status DEFAULT 'PENDING',
  posted_to_folio BOOLEAN DEFAULT false,
  cash_received DECIMAL(12,2),
  change_given DECIMAL(12,2),
  server_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  transaction_time TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_maintenance_room ON pms_maintenance_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON pms_maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON pms_maintenance_requests(priority);

CREATE INDEX IF NOT EXISTS idx_loyalty_member_guest ON pms_loyalty_members(guest_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_member_number ON pms_loyalty_members(member_number);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_member ON pms_loyalty_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_trans_type ON pms_loyalty_transactions(type);

CREATE INDEX IF NOT EXISTS idx_events_space ON pms_events(space_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON pms_events(status);
CREATE INDEX IF NOT EXISTS idx_events_dates ON pms_events(start_datetime, end_datetime);

CREATE INDEX IF NOT EXISTS idx_channel_active ON pms_channels(is_active);
CREATE INDEX IF NOT EXISTS idx_channel_mapping ON pms_channel_mappings(channel_id, room_type_id);

CREATE INDEX IF NOT EXISTS idx_guest_prefs_guest ON pms_guest_preferences(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_comm_guest ON pms_guest_communications(guest_id);

CREATE INDEX IF NOT EXISTS idx_daily_audit_date ON pms_daily_audits(audit_date);
CREATE INDEX IF NOT EXISTS idx_night_audit_log ON pms_night_audit_log(audit_id);

CREATE INDEX IF NOT EXISTS idx_inventory_item_cat ON pms_inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_trans_item ON pms_inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_trans_type ON pms_inventory_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_staff_schedule_staff ON pms_staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedule_date ON pms_staff_schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_staff ON pms_time_entries(staff_id);

CREATE INDEX IF NOT EXISTS idx_rate_plans_room ON pms_rate_plans(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rate_restrictions ON pms_rate_restrictions(room_type_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_mobile_key_res ON pms_mobile_keys(reservation_id);
CREATE INDEX IF NOT EXISTS idx_mobile_key_status ON pms_mobile_keys(status);
CREATE INDEX IF NOT EXISTS idx_guest_requests_status ON pms_guest_requests(status);

CREATE INDEX IF NOT EXISTS idx_pos_trans_terminal ON pms_pos_transactions(terminal_id);
CREATE INDEX IF NOT EXISTS idx_pos_trans_folio ON pms_pos_transactions(folio_id);
CREATE INDEX IF NOT EXISTS idx_pos_trans_time ON pms_pos_transactions(transaction_time);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Maintenance
ALTER TABLE pms_maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_preventive_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_maintenance_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_maintenance_all" ON pms_maintenance_requests;
CREATE POLICY "staff_maintenance_all" ON pms_maintenance_requests FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'housekeeping'))
  );

DROP POLICY IF EXISTS "staff_pm_all" ON pms_preventive_maintenance;
CREATE POLICY "staff_pm_all" ON pms_preventive_maintenance FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "staff_assets_all" ON pms_maintenance_assets;
CREATE POLICY "staff_assets_all" ON pms_maintenance_assets FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Loyalty
ALTER TABLE pms_loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_loyalty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_loyalty_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyalty_tiers_read" ON pms_loyalty_tiers;
CREATE POLICY "loyalty_tiers_read" ON pms_loyalty_tiers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "staff_loyalty_tiers_manage" ON pms_loyalty_tiers;
CREATE POLICY "staff_loyalty_tiers_manage" ON pms_loyalty_tiers FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "loyalty_members_public_read" ON pms_loyalty_members;
CREATE POLICY "loyalty_members_public_read" ON pms_loyalty_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "staff_loyalty_members_manage" ON pms_loyalty_members;
CREATE POLICY "staff_loyalty_members_manage" ON pms_loyalty_members FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk'))
  );

DROP POLICY IF EXISTS "loyalty_trans_read" ON pms_loyalty_transactions;
CREATE POLICY "loyalty_trans_read" ON pms_loyalty_transactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_loyalty_trans_manage" ON pms_loyalty_transactions;
CREATE POLICY "staff_loyalty_trans_manage" ON pms_loyalty_transactions FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk'))
  );

DROP POLICY IF EXISTS "loyalty_rewards_read" ON pms_loyalty_rewards;
CREATE POLICY "loyalty_rewards_read" ON pms_loyalty_rewards FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "staff_loyalty_rewards_manage" ON pms_loyalty_rewards;
CREATE POLICY "staff_loyalty_rewards_manage" ON pms_loyalty_rewards FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Events
ALTER TABLE pms_event_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_banquet_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_catering_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_spaces_read" ON pms_event_spaces;
CREATE POLICY "event_spaces_read" ON pms_event_spaces FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "staff_event_spaces_all" ON pms_event_spaces;
CREATE POLICY "staff_event_spaces_all" ON pms_event_spaces FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "events_select" ON pms_events;
CREATE POLICY "events_select" ON pms_events FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "events_insert" ON pms_events;
CREATE POLICY "events_insert" ON pms_events FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staff_events_manage" ON pms_events;
CREATE POLICY "staff_events_manage" ON pms_events FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk'))
  );

DROP POLICY IF EXISTS "staff_banquet_all" ON pms_banquet_orders;
CREATE POLICY "staff_banquet_all" ON pms_banquet_orders FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk'))
  );

DROP POLICY IF EXISTS "catering_menus_read" ON pms_catering_menus;
CREATE POLICY "catering_menus_read" ON pms_catering_menus FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "staff_catering_manage" ON pms_catering_menus;
CREATE POLICY "staff_catering_manage" ON pms_catering_menus FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Channels
ALTER TABLE pms_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_channel_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_channels_all" ON pms_channels;
CREATE POLICY "staff_channels_all" ON pms_channels FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "staff_channel_mappings_all" ON pms_channel_mappings;
CREATE POLICY "staff_channel_mappings_all" ON pms_channel_mappings FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Guest CRM
ALTER TABLE pms_guest_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_guest_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_guest_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_guest_prefs_all" ON pms_guest_preferences;
CREATE POLICY "staff_guest_prefs_all" ON pms_guest_preferences FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk'))
  );

DROP POLICY IF EXISTS "staff_guest_comm_all" ON pms_guest_communications;
CREATE POLICY "staff_guest_comm_all" ON pms_guest_communications FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk'))
  );

DROP POLICY IF EXISTS "staff_guest_notes_all" ON pms_guest_notes;
CREATE POLICY "staff_guest_notes_all" ON pms_guest_notes FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk'))
  );

-- Night Audit
ALTER TABLE pms_daily_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_night_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_daily_audit_all" ON pms_daily_audits;
CREATE POLICY "staff_daily_audit_all" ON pms_daily_audits FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'finance'))
  );

DROP POLICY IF EXISTS "staff_night_audit_log_read" ON pms_night_audit_log;
CREATE POLICY "staff_night_audit_log_read" ON pms_night_audit_log FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'finance'))
  );

-- Inventory
ALTER TABLE pms_inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_inventory_all" ON pms_inventory_categories;
CREATE POLICY "staff_inventory_all" ON pms_inventory_categories FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "staff_inventory_items_all" ON pms_inventory_items;
CREATE POLICY "staff_inventory_items_all" ON pms_inventory_items FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "staff_suppliers_all" ON pms_suppliers;
CREATE POLICY "staff_suppliers_all" ON pms_suppliers FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "staff_inventory_trans_all" ON pms_inventory_transactions;
CREATE POLICY "staff_inventory_trans_all" ON pms_inventory_transactions FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "staff_po_all" ON pms_purchase_orders;
CREATE POLICY "staff_po_all" ON pms_purchase_orders FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "staff_po_items_all" ON pms_purchase_order_items;
CREATE POLICY "staff_po_items_all" ON pms_purchase_order_items FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Staff Management
ALTER TABLE pms_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_departments_read" ON pms_departments;
CREATE POLICY "staff_departments_read" ON pms_departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_departments_manage" ON pms_departments;
CREATE POLICY "staff_departments_manage" ON pms_departments FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "schedules_own_read" ON pms_staff_schedules;
CREATE POLICY "schedules_own_read" ON pms_staff_schedules FOR SELECT
  TO authenticated USING (staff_id = auth.uid());

DROP POLICY IF EXISTS "schedules_manage" ON pms_staff_schedules;
CREATE POLICY "schedules_manage" ON pms_staff_schedules FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "time_entries_own" ON pms_time_entries;
CREATE POLICY "time_entries_own" ON pms_time_entries FOR SELECT
  TO authenticated USING (staff_id = auth.uid());

DROP POLICY IF EXISTS "time_entries_manage" ON pms_time_entries;
CREATE POLICY "time_entries_manage" ON pms_time_entries FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Rate Management
ALTER TABLE pms_rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_rate_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_derived_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rate_plans_read" ON pms_rate_plans;
CREATE POLICY "rate_plans_read" ON pms_rate_plans FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "rate_plans_manage" ON pms_rate_plans;
CREATE POLICY "rate_plans_manage" ON pms_rate_plans FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "rate_restrictions_all" ON pms_rate_restrictions;
CREATE POLICY "rate_restrictions_all" ON pms_rate_restrictions FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "derived_rates_all" ON pms_derived_rates;
CREATE POLICY "derived_rates_all" ON pms_derived_rates FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Mobile Key & Guest Requests
ALTER TABLE pms_mobile_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_guest_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mobile_keys_manage" ON pms_mobile_keys;
CREATE POLICY "mobile_keys_manage" ON pms_mobile_keys FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk'))
  );

DROP POLICY IF EXISTS "guest_requests_read" ON pms_guest_requests;
CREATE POLICY "guest_requests_read" ON pms_guest_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "guest_requests_insert" ON pms_guest_requests;
CREATE POLICY "guest_requests_insert" ON pms_guest_requests FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "guest_requests_manage" ON pms_guest_requests;
CREATE POLICY "guest_requests_manage" ON pms_guest_requests FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk', 'housekeeping'))
  );

-- POS
ALTER TABLE pms_pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_pos_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pos_terminals_all" ON pms_pos_terminals;
CREATE POLICY "pos_terminals_all" ON pms_pos_terminals FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "pos_trans_read" ON pms_pos_transactions;
CREATE POLICY "pos_trans_read" ON pms_pos_transactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "pos_trans_insert" ON pms_pos_transactions;
CREATE POLICY "pos_trans_insert" ON pms_pos_transactions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "pos_trans_manage" ON pms_pos_transactions;
CREATE POLICY "pos_trans_manage" ON pms_pos_transactions FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk'))
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'pms_maintenance_requests', 'pms_preventive_maintenance', 'pms_maintenance_assets',
    'pms_loyalty_members', 'pms_loyalty_rewards', 'pms_event_spaces', 'pms_events',
    'pms_banquet_orders', 'pms_catering_menus', 'pms_channels',
    'pms_guest_preferences', 'pms_daily_audits', 'pms_inventory_items',
    'pms_suppliers', 'pms_purchase_orders', 'pms_staff_schedules',
    'pms_time_entries', 'pms_rate_plans', 'pms_mobile_keys',
    'pms_guest_requests', 'pms_pos_terminals'
  ]) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS %I_updated_at ON %I;
      CREATE TRIGGER %I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', t, t, t, t);
  END LOOP;
END $$;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default loyalty tiers
INSERT INTO pms_loyalty_tiers (name, code, min_points, max_points, benefits, points_multiplier, color, icon, sort_order)
VALUES
  ('Silver', 'SLV', 0, 9999, '{"late_checkout": "2pm", "welcome_drink": true}'::jsonb, 1.0, 'slate', 'medal', 1),
  ('Gold', 'GLD', 10000, 24999, '{"late_checkout": "4pm", "welcome_drink": true, "room_upgrade": "subject_to_availability", "gym_access": true}'::jsonb, 1.25, 'amber', 'award', 2),
  ('Platinum', 'PLT', 25000, 49999, '{"late_checkout": "6pm", "welcome_drink": true, "room_upgrade": "guaranteed", "gym_access": true, "spa_discount": 20, "early_checkin": "subject_to_availability"}'::jsonb, 1.5, 'cyan', 'gem', 3),
  ('Diamond', 'DIA', 50000, NULL, '{"late_checkout": "free", "welcome_drink": true, "room_upgrade": "guaranteed", "gym_access": true, "spa_discount": 30, "early_checkin": "guaranteed", "personalized_concierge": true, "airport_transfer": true}'::jsonb, 2.0, 'violet', 'crown', 4)
ON CONFLICT (code) DO NOTHING;

-- Insert default departments
INSERT INTO pms_departments (name, code)
VALUES
  ('Front Desk', 'FD'),
  ('Housekeeping', 'HK'),
  ('Maintenance', 'MT'),
  ('Food & Beverage', 'FNB'),
  ('Spa & Wellness', 'SPA'),
  ('Security', 'SEC'),
  ('Finance', 'FIN'),
  ('Human Resources', 'HR'),
  ('Sales & Marketing', 'SM'),
  ('Events', 'EV')
ON CONFLICT (code) DO NOTHING;

-- Insert default channels
INSERT INTO pms_channels (name, code, type, commission_rate)
VALUES
  ('Direct Website', 'DIRECT', 'direct', 0),
  ('Corporate Rate', 'CORP', 'corporate', 0),
  ('Booking.com', 'BOOKING', 'ota', 15.00),
  ('Expedia', 'EXPEDIA', 'ota', 18.00),
  ('Airbnb', 'AIRBNB', 'ota', 14.00),
  ('Hotels.com', 'HOTELS', 'ota', 16.00),
  ('Agoda', 'AGODA', 'ota', 15.00),
  ('Amadeus GDS', 'AMADEUS', 'gds', 10.00),
  ('Sabre GDS', 'SABRE', 'gds', 10.00),
  ('Travel Agent', 'TA', 'wholesaler', 12.00)
ON CONFLICT (code) DO NOTHING;
