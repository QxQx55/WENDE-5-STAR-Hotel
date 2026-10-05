-- Guest Booking System with Ethiopian Payment Gateways

-- Guest bookings for rooms (public-facing)
CREATE TABLE guest_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_nationality TEXT DEFAULT 'Ethiopian',
  id_type TEXT DEFAULT 'National ID',
  id_number TEXT,
  room_type_id UUID REFERENCES pms_room_types(id) ON DELETE SET NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_guests INTEGER DEFAULT 1,
  number_of_rooms INTEGER DEFAULT 1,
  special_requests TEXT,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status payment_status DEFAULT 'PENDING',
  payment_gateway payment_gateway,
  payment_reference TEXT,
  booking_reference TEXT UNIQUE DEFAULT 'BK' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0'),
  status reservation_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT valid_guests CHECK (number_of_guests > 0),
  CONSTRAINT valid_rooms CHECK (number_of_rooms > 0)
);

-- Restaurant/Table reservations
CREATE TABLE table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  number_of_guests INTEGER DEFAULT 2,
  table_number TEXT,
  special_requests TEXT,
  occasion TEXT,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  payment_status payment_status DEFAULT 'PENDING',
  payment_gateway payment_gateway,
  payment_reference TEXT,
  reservation_reference TEXT UNIQUE DEFAULT 'TB' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0'),
  status reservation_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_party_size CHECK (number_of_guests > 0 AND number_of_guests <= 20)
);

-- Payment transactions log
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES guest_bookings(id) ON DELETE SET NULL,
  table_reservation_id UUID REFERENCES table_reservations(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'ETB',
  gateway payment_gateway NOT NULL,
  transaction_reference TEXT UNIQUE,
  phone_number TEXT,
  account_number TEXT,
  status payment_status DEFAULT 'PENDING',
  gateway_response JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- RLS Policies for guest_bookings
ALTER TABLE guest_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_bookings_select_public" ON guest_bookings FOR SELECT
  TO public USING (true);

CREATE POLICY "guest_bookings_insert_authenticated" ON guest_bookings FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "guest_bookings_all_staff" ON guest_bookings FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk', 'finance'))
  );

-- RLS Policies for table_reservations
ALTER TABLE table_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "table_reservations_select_public" ON table_reservations FOR SELECT
  TO public USING (true);

CREATE POLICY "table_reservations_insert_authenticated" ON table_reservations FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "table_reservations_all_staff" ON table_reservations FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'front_desk', 'finance'))
  );

-- RLS Policies for payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_transactions_select_own" ON payment_transactions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "payment_transactions_insert_authenticated" ON payment_transactions FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "payment_transactions_all_staff" ON payment_transactions FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'finance'))
  );

-- Indexes for performance
CREATE INDEX idx_guest_bookings_status ON guest_bookings(status);
CREATE INDEX idx_guest_bookings_dates ON guest_bookings(check_in_date, check_out_date);
CREATE INDEX idx_guest_bookings_reference ON guest_bookings(booking_reference);
CREATE INDEX idx_table_reservations_date ON table_reservations(reservation_date);
CREATE INDEX idx_table_reservations_status ON table_reservations(status);
CREATE INDEX idx_payment_transactions_gateway ON payment_transactions(gateway);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Trigger to update timestamps
CREATE TRIGGER guest_bookings_updated_at
  BEFORE UPDATE ON guest_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER table_reservations_updated_at
  BEFORE UPDATE ON table_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();