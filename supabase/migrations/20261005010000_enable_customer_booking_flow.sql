-- Connect authenticated customers to their guest record and reservation rows.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE guests
  ALTER COLUMN id_number DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_user_id
  ON guests(user_id)
  WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_hotel_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_hotel_staff() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_customer_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Hotel Guest'),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_hotel_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_hotel_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_customer_profile();

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), 'Hotel Guest'),
  'customer'
FROM auth.users AS u
LEFT JOIN public.profiles AS p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_customer_guest(guest_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.guests
    WHERE id = guest_uuid
      AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_customer_guest(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_available_rooms(
  requested_check_in date,
  requested_check_out date
)
RETURNS SETOF public.rooms
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT room.*
  FROM public.rooms AS room
  WHERE requested_check_out > requested_check_in
    AND room.status = 'Available'
    AND NOT EXISTS (
      SELECT 1
      FROM public.reservations AS reservation
      WHERE reservation.room_id = room.id
        AND reservation.status <> 'Cancelled'
        AND daterange(reservation.check_in_date, reservation.check_out_date, '[)')
            && daterange(requested_check_in, requested_check_out, '[)')
    )
  ORDER BY room.room_number;
$$;

GRANT EXECUTE ON FUNCTION public.get_available_rooms(date, date) TO authenticated;

GRANT SELECT ON rooms, services, reviews TO anon, authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON guests, reservations, reservation_services, invoices, payments, staff_tasks
  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rooms, services TO authenticated;
GRANT INSERT ON reviews TO authenticated;

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_room_stay_no_overlap;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_room_stay_no_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in_date, check_out_date, '[)') WITH &&
  )
  WHERE (status <> 'Cancelled');

DROP POLICY IF EXISTS "profiles are viewable by owner or authenticated staff" ON profiles;
DROP POLICY IF EXISTS "profiles can be updated by owner" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profile owner or staff can view profiles" ON profiles;
DROP POLICY IF EXISTS "profile owner can update safe fields" ON profiles;
CREATE POLICY "profile owner or staff can view profiles"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_hotel_staff());
CREATE POLICY "profile owner can update safe fields"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name, phone, bio, profile_image_url) ON profiles TO authenticated;

DROP POLICY IF EXISTS "guests are readable by authenticated users" ON guests;
DROP POLICY IF EXISTS "guests are writable by staff or admin" ON guests;
DROP POLICY IF EXISTS "guest owner or staff can view guest rows" ON guests;
DROP POLICY IF EXISTS "customer can create own guest row" ON guests;
DROP POLICY IF EXISTS "staff can manage guest rows" ON guests;
CREATE POLICY "guest owner or staff can view guest rows"
  ON guests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_hotel_staff());
CREATE POLICY "customer can create own guest row"
  ON guests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff can manage guest rows"
  ON guests FOR ALL TO authenticated
  USING (public.is_hotel_staff())
  WITH CHECK (public.is_hotel_staff());

DROP POLICY IF EXISTS "rooms are readable by authenticated users" ON rooms;
DROP POLICY IF EXISTS "rooms are readable by anon and authenticated users" ON rooms;
DROP POLICY IF EXISTS "rooms are writable by staff or admin" ON rooms;
DROP POLICY IF EXISTS "rooms are publicly readable" ON rooms;
DROP POLICY IF EXISTS "staff can manage rooms" ON rooms;
CREATE POLICY "rooms are publicly readable"
  ON rooms FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "staff can manage rooms"
  ON rooms FOR ALL TO authenticated
  USING (public.is_hotel_staff())
  WITH CHECK (public.is_hotel_staff());

DROP POLICY IF EXISTS "reservations are readable by matching guest or staff/admin" ON reservations;
DROP POLICY IF EXISTS "reservations are writable by staff/admin" ON reservations;
DROP POLICY IF EXISTS "customer or staff can view reservations" ON reservations;
DROP POLICY IF EXISTS "customer can request own reservation" ON reservations;
DROP POLICY IF EXISTS "staff can manage reservations" ON reservations;
CREATE POLICY "customer or staff can view reservations"
  ON reservations FOR SELECT TO authenticated
  USING (public.is_customer_guest(guest_id) OR public.is_hotel_staff());
CREATE POLICY "customer can request own reservation"
  ON reservations FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND status = 'Pending'
    AND public.is_customer_guest(guest_id)
  );
CREATE POLICY "staff can manage reservations"
  ON reservations FOR ALL TO authenticated
  USING (public.is_hotel_staff())
  WITH CHECK (public.is_hotel_staff());

DROP POLICY IF EXISTS "services are readable by authenticated users" ON services;
DROP POLICY IF EXISTS "services are readable by anon and authenticated users" ON services;
DROP POLICY IF EXISTS "services are writable by staff/admin" ON services;
DROP POLICY IF EXISTS "services are publicly readable" ON services;
DROP POLICY IF EXISTS "staff can manage services" ON services;
CREATE POLICY "services are publicly readable"
  ON services FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "staff can manage services"
  ON services FOR ALL TO authenticated
  USING (public.is_hotel_staff())
  WITH CHECK (public.is_hotel_staff());

DROP POLICY IF EXISTS "reservation services are readable by staff/admin or linked reservation user" ON reservation_services;
DROP POLICY IF EXISTS "reservation services are writable by staff/admin" ON reservation_services;
DROP POLICY IF EXISTS "customer or staff can view reservation services" ON reservation_services;
DROP POLICY IF EXISTS "staff can manage reservation services" ON reservation_services;
CREATE POLICY "customer or staff can view reservation services"
  ON reservation_services FOR SELECT TO authenticated
  USING (
    public.is_hotel_staff()
    OR EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = reservation_services.reservation_id
        AND public.is_customer_guest(r.guest_id)
    )
  );
CREATE POLICY "staff can manage reservation services"
  ON reservation_services FOR ALL TO authenticated
  USING (public.is_hotel_staff())
  WITH CHECK (public.is_hotel_staff());

DROP POLICY IF EXISTS "invoices are readable by authenticated staff/admin or reservation guest" ON invoices;
DROP POLICY IF EXISTS "invoices are writable by staff/admin" ON invoices;
DROP POLICY IF EXISTS "customer or staff can view invoices" ON invoices;
DROP POLICY IF EXISTS "staff can manage invoices" ON invoices;
CREATE POLICY "customer or staff can view invoices"
  ON invoices FOR SELECT TO authenticated
  USING (
    public.is_hotel_staff()
    OR EXISTS (
      SELECT 1
      FROM public.reservations r
      WHERE r.id = invoices.reservation_id
        AND public.is_customer_guest(r.guest_id)
    )
  );
CREATE POLICY "staff can manage invoices"
  ON invoices FOR ALL TO authenticated
  USING (public.is_hotel_staff())
  WITH CHECK (public.is_hotel_staff());

DROP POLICY IF EXISTS "payments are readable by authenticated users" ON payments;
DROP POLICY IF EXISTS "payments are writable by staff/admin" ON payments;
DROP POLICY IF EXISTS "customer or staff can view payments" ON payments;
DROP POLICY IF EXISTS "staff can manage payments" ON payments;
CREATE POLICY "customer or staff can view payments"
  ON payments FOR SELECT TO authenticated
  USING (
    public.is_hotel_staff()
    OR EXISTS (
      SELECT 1
      FROM public.invoices i
      JOIN public.reservations r ON r.id = i.reservation_id
      WHERE i.id = payments.invoice_id
        AND public.is_customer_guest(r.guest_id)
    )
  );
CREATE POLICY "staff can manage payments"
  ON payments FOR ALL TO authenticated
  USING (public.is_hotel_staff())
  WITH CHECK (public.is_hotel_staff());

DROP POLICY IF EXISTS "staff tasks are readable by staff/admin or assigned user" ON staff_tasks;
DROP POLICY IF EXISTS "staff tasks are writable by staff/admin" ON staff_tasks;
DROP POLICY IF EXISTS "staff can view assigned tasks" ON staff_tasks;
DROP POLICY IF EXISTS "staff can manage tasks" ON staff_tasks;
CREATE POLICY "staff can view assigned tasks"
  ON staff_tasks FOR SELECT TO authenticated
  USING (staff_id = auth.uid() OR public.is_hotel_staff());
CREATE POLICY "staff can manage tasks"
  ON staff_tasks FOR ALL TO authenticated
  USING (public.is_hotel_staff())
  WITH CHECK (public.is_hotel_staff());

DROP POLICY IF EXISTS "reviews are readable by authenticated users" ON reviews;
DROP POLICY IF EXISTS "reviews are readable by anon and authenticated users" ON reviews;
DROP POLICY IF EXISTS "reviews are writable by auth users" ON reviews;
DROP POLICY IF EXISTS "reviews are publicly readable" ON reviews;
DROP POLICY IF EXISTS "customers can write own reviews" ON reviews;
CREATE POLICY "reviews are publicly readable"
  ON reviews FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "customers can write own reviews"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
