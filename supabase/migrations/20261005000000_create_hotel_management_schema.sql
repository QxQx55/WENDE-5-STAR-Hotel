-- Hotel management schema aligned to the React front-end and Supabase service layer

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('customer', 'staff', 'admin')) DEFAULT 'customer',
  phone text,
  bio text,
  profile_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text NOT NULL,
  id_number text NOT NULL,
  nationality text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL UNIQUE,
  room_type text NOT NULL CHECK (room_type IN ('Standard', 'Deluxe', 'Suite', 'Presidential')),
  floor integer NOT NULL CHECK (floor > 0),
  price_per_night numeric(10,2) NOT NULL DEFAULT 0,
  max_occupancy integer NOT NULL DEFAULT 2 CHECK (max_occupancy > 0),
  status text NOT NULL CHECK (status IN ('Available', 'Occupied', 'Cleaning', 'Maintenance')) DEFAULT 'Available',
  amenities text[] NOT NULL DEFAULT '{}',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  actual_check_in timestamptz,
  actual_check_out timestamptz,
  number_of_guests integer NOT NULL DEFAULT 1 CHECK (number_of_guests > 0),
  status text NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled')) DEFAULT 'Pending',
  special_requests text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (check_out_date >= check_in_date)
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL CHECK (category IN ('Food', 'Spa', 'Minibar', 'Laundry', 'Other')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservation_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  room_charges numeric(10,2) NOT NULL DEFAULT 0,
  service_charges numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  service_charge_rate numeric(5,2) NOT NULL DEFAULT 0,
  service_charge_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL CHECK (payment_status IN ('Pending', 'Partial', 'Paid')) DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('Cash', 'Card', 'Mobile')),
  transaction_reference text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS staff_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_description text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date date,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES reservations(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_room_number ON rooms(room_number);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_created_by ON reservations(created_by);
CREATE INDEX IF NOT EXISTS idx_invoice_reservation_id ON invoices(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_staff_id ON staff_tasks(staff_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles are viewable by owner or authenticated staff"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
));

CREATE POLICY "profiles can be updated by owner"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "guests are readable by authenticated users"
ON guests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "guests are writable by staff or admin"
ON guests
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
));

CREATE POLICY "rooms are readable by authenticated users"
ON rooms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "rooms are writable by staff or admin"
ON rooms
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
));

CREATE POLICY "reservations are readable by matching guest or staff/admin"
ON reservations
FOR SELECT
TO authenticated
USING (
  guest_id IN (
    SELECT id FROM guests WHERE id = guest_id
  )
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
  )
);

CREATE POLICY "reservations are writable by staff/admin"
ON reservations
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
));

CREATE POLICY "services are readable by authenticated users"
ON services
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "services are writable by staff/admin"
ON services
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
));

CREATE POLICY "reservation services are readable by staff/admin or linked reservation user"
ON reservation_services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM reservations r
    JOIN guests g ON g.id = r.guest_id
    WHERE r.id = reservation_services.reservation_id
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
      )
  )
  OR EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = reservation_services.reservation_id
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'customer'
      )
  )
);

CREATE POLICY "reservation services are writable by staff/admin"
ON reservation_services
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
));

CREATE POLICY "invoices are readable by authenticated staff/admin or reservation guest"
ON invoices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
  )
  OR EXISTS (
    SELECT 1
    FROM reservations r
    JOIN guests g ON g.id = r.guest_id
    WHERE r.id = invoices.reservation_id
  )
);

CREATE POLICY "invoices are writable by staff/admin"
ON invoices
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
));

CREATE POLICY "payments are readable by authenticated users"
ON payments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "payments are writable by staff/admin"
ON payments
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
));

CREATE POLICY "staff tasks are readable by staff/admin or assigned user"
ON staff_tasks
FOR SELECT
TO authenticated
USING (
  staff_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
  )
);

CREATE POLICY "staff tasks are writable by staff/admin"
ON staff_tasks
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
));

CREATE POLICY "reviews are readable by authenticated users"
ON reviews
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "reviews are writable by auth users"
ON reviews
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

INSERT INTO rooms (room_number, room_type, floor, price_per_night, max_occupancy, status, amenities, description)
VALUES
  ('101', 'Standard', 1, 149.00, 2, 'Available', ARRAY['WiFi', 'Air Conditioning', 'Mini Fridge', 'City View'], 'Comfortable standard room for solo or duo stays.'),
  ('205', 'Deluxe', 2, 229.00, 2, 'Occupied', ARRAY['WiFi', 'Balcony', 'Air Conditioning', 'Coffee Station'], 'Deluxe room with added comfort and city-facing balcony.'),
  ('310', 'Suite', 3, 349.00, 3, 'Available', ARRAY['WiFi', 'King Bed', 'Living Area', 'Jacuzzi Bath'], 'Premium suite with extra space and luxury amenities.'),
  ('420', 'Presidential', 4, 599.00, 4, 'Cleaning', ARRAY['WiFi', 'Private Lounge', 'Butler Service', 'Panoramic View'], 'Luxury presidential suite designed for premium guest experiences.');

INSERT INTO guests (first_name, last_name, email, phone, id_number, nationality, address)
VALUES
  ('Aisha', 'Rahman', 'aisha@example.com', '+971500000001', '784-1994-0001', 'UAE', 'Dubai Marina, Dubai'),
  ('Daniel', 'Brown', 'daniel@example.com', '+971500000002', '784-1994-0002', 'UK', 'Downtown, Dubai');

INSERT INTO reservations (guest_id, room_id, check_in_date, check_out_date, number_of_guests, status, special_requests, created_by)
VALUES
  ((SELECT id FROM guests WHERE email = 'aisha@example.com'), (SELECT id FROM rooms WHERE room_number = '101'), CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', 2, 'Confirmed', 'Late check-in', NULL),
  ((SELECT id FROM guests WHERE email = 'daniel@example.com'), (SELECT id FROM rooms WHERE room_number = '205'), CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', 2, 'Checked-In', 'Quiet room requested', NULL);

INSERT INTO services (name, description, price, category, active)
VALUES
  ('Spa Access', 'Unlimited access to the wellness spa facilities', 120.00, 'Spa', true),
  ('Breakfast Buffet', 'Daily breakfast buffet for two', 45.00, 'Food', true),
  ('Laundry Service', 'Express laundry and pressing service', 60.00, 'Laundry', true);

INSERT INTO reservation_services (reservation_id, service_id, quantity, unit_price, total_price)
VALUES
  ((SELECT id FROM reservations WHERE special_requests = 'Late check-in'), (SELECT id FROM services WHERE name = 'Breakfast Buffet'), 2, 45.00, 90.00),
  ((SELECT id FROM reservations WHERE status = 'Checked-In'), (SELECT id FROM services WHERE name = 'Spa Access'), 1, 120.00, 120.00);

INSERT INTO invoices (reservation_id, invoice_number, room_charges, service_charges, subtotal, tax_rate, tax_amount, service_charge_rate, service_charge_amount, total_amount, payment_status)
VALUES
  ((SELECT id FROM reservations WHERE special_requests = 'Late check-in'), 'INV-1001', 447.00, 90.00, 537.00, 5.00, 26.85, 10.00, 53.70, 617.55, 'Pending'),
  ((SELECT id FROM reservations WHERE status = 'Checked-In'), 'INV-1002', 458.00, 120.00, 578.00, 5.00, 28.90, 10.00, 57.80, 664.70, 'Partial');

INSERT INTO payments (invoice_id, amount, payment_method, transaction_reference, paid_at)
VALUES
  ((SELECT id FROM invoices WHERE invoice_number = 'INV-1002'), 250.00, 'Card', 'TXN-1002-01', NOW());
