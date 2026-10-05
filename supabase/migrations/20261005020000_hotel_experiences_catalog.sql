-- Add room photography, a service/food catalog, and customer experience requests.

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS image_url text;

UPDATE public.rooms
SET image_url = CASE room_type
  WHEN 'Standard' THEN 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg'
  WHEN 'Deluxe' THEN 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg'
  WHEN 'Suite' THEN 'https://images.pexels.com/photos/1743231/pexels-photo-1743231.jpeg'
  WHEN 'Presidential' THEN 'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg'
  ELSE 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg'
END
WHERE image_url IS NULL OR image_url = '';

CREATE TABLE IF NOT EXISTS public.hotel_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('service', 'food')),
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  image_url text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hotel_experience_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  booking_type text NOT NULL CHECK (booking_type IN ('parking', 'dining', 'gym', 'vip')),
  catalog_item_id uuid REFERENCES public.hotel_catalog(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  start_time time,
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size > 0),
  vehicle_details text,
  special_requests text,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_experience_bookings_user_date
  ON public.hotel_experience_bookings(user_id, booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_hotel_catalog_item_type_active
  ON public.hotel_catalog(item_type, active);

ALTER TABLE public.hotel_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_experience_bookings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.hotel_catalog TO anon, authenticated;
GRANT SELECT, INSERT ON public.hotel_experience_bookings TO authenticated;

DROP POLICY IF EXISTS "hotel catalog is publicly readable" ON public.hotel_catalog;
CREATE POLICY "hotel catalog is publicly readable"
  ON public.hotel_catalog
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "customers view own experience bookings" ON public.hotel_experience_bookings;
DROP POLICY IF EXISTS "customers create own experience bookings" ON public.hotel_experience_bookings;
DROP POLICY IF EXISTS "staff manage experience bookings" ON public.hotel_experience_bookings;
CREATE POLICY "customers view own experience bookings"
  ON public.hotel_experience_bookings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_hotel_staff());
CREATE POLICY "customers create own experience bookings"
  ON public.hotel_experience_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_customer_guest(guest_id));
CREATE POLICY "staff manage experience bookings"
  ON public.hotel_experience_bookings
  FOR ALL
  TO authenticated
  USING (public.is_hotel_staff())
  WITH CHECK (public.is_hotel_staff());

INSERT INTO public.hotel_catalog (name, description, category, item_type, price, image_url)
SELECT seed.name, seed.description, seed.category, seed.item_type, seed.price, seed.image_url
FROM (VALUES
  ('VIP Arrival & Butler Package', 'Private arrival assistance, welcome amenities, and dedicated butler support during your stay.', 'VIP', 'service', 350.00, 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg'),
  ('Personal Training Session', 'One-on-one coaching with a hotel fitness instructor. Please request a preferred time.', 'Fitness', 'service', 85.00, 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg'),
  ('Spa & Wellness Access', 'Relax with access to selected spa and wellness facilities.', 'Wellness', 'service', 120.00, 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg'),
  ('Airport Transfer', 'Private hotel vehicle transfer. Add flight and arrival details to your request.', 'Transport', 'service', 75.00, 'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg'),
  ('Fresh Seasonal Salad', 'Seasonal greens, roasted vegetables, and house-made citrus dressing.', 'Dining', 'food', 18.00, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'),
  ('Grilled Salmon', 'Herb-grilled salmon served with market vegetables and lemon butter.', 'Main course', 'food', 32.00, 'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg'),
  ('Wagyu Steak', 'Premium grilled steak with truffle potatoes and chef-selected sides.', 'Main course', 'food', 58.00, 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg'),
  ('Breakfast for Two', 'Full breakfast with fresh fruit, pastries, coffee, and made-to-order dishes.', 'Breakfast', 'food', 42.00, 'https://images.pexels.com/photos/139746/pexels-photo-139746.jpeg'),
  ('Chocolate Fondant', 'Warm chocolate fondant with vanilla bean ice cream.', 'Dessert', 'food', 14.00, 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg'),
  ('Fresh Juice & Mocktail', 'Freshly pressed seasonal juice or a handcrafted zero-proof mocktail.', 'Beverage', 'food', 12.00, 'https://images.pexels.com/photos/616833/pexels-photo-616833.jpeg')
) AS seed(name, description, category, item_type, price, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM public.hotel_catalog existing WHERE existing.name = seed.name
);
