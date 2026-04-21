/*
  # Create Hotel Booking System

  1. New Tables
    - `hotel_rooms`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price_per_night` (numeric)
      - `images` (text array)
      - `is_available` (boolean)
      - `created_at` (timestamp)
    
    - `hotel_bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `room_id` (uuid, foreign key to hotel_rooms)
      - `check_in_date` (date)
      - `check_out_date` (date)
      - `total_price` (numeric)
      - `status` (text: pending | confirmed | cancelled)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Users can only view their own bookings
    - Only admins can modify rooms
    - Only authenticated users can create bookings

  3. Functions
    - Function to check room availability
    - Trigger to prevent double bookings
*/

-- Create hotel_rooms table
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_per_night numeric NOT NULL CHECK (price_per_night > 0),
  images text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create hotel_bookings table
CREATE TABLE IF NOT EXISTS hotel_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  total_price numeric NOT NULL CHECK (total_price > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_user_id ON hotel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_room_id ON hotel_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_dates ON hotel_bookings(room_id, check_in_date, check_out_date);

-- Enable RLS
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hotel_rooms
-- Everyone can view available rooms
CREATE POLICY "Anyone can view available rooms"
  ON hotel_rooms FOR SELECT
  TO public
  USING (is_available = true);

-- Admins can view all rooms
CREATE POLICY "Admins can view all rooms"
  ON hotel_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can create rooms
CREATE POLICY "Admins can create rooms"
  ON hotel_rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update rooms
CREATE POLICY "Admins can update rooms"
  ON hotel_rooms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete rooms
CREATE POLICY "Admins can delete rooms"
  ON hotel_rooms FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for hotel_bookings
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON hotel_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON hotel_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only authenticated users can create bookings
CREATE POLICY "Authenticated users can create bookings"
  ON hotel_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (for cancellation)
CREATE POLICY "Users can update own bookings"
  ON hotel_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any booking
CREATE POLICY "Admins can update any booking"
  ON hotel_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can cancel their own bookings
CREATE POLICY "Users can cancel own bookings"
  ON hotel_bookings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to check if a room is available for given dates
CREATE OR REPLACE FUNCTION is_room_available(
  p_room_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM hotel_bookings
    WHERE room_id = p_room_id
    AND status IN ('pending', 'confirmed')
    AND id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      -- Check for overlapping dates
      (check_in_date < p_check_out_date AND check_out_date > p_check_in_date)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent double booking (trigger)
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if room is available
  IF NOT is_room_available(NEW.room_id, NEW.check_in_date, NEW.check_out_date, NEW.id) THEN
    RAISE EXCEPTION 'Room is not available for the selected dates';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for double booking prevention
DROP TRIGGER IF EXISTS check_room_availability ON hotel_bookings;
CREATE TRIGGER check_room_availability
  BEFORE INSERT OR UPDATE ON hotel_bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_double_booking();

-- Function to calculate total price
CREATE OR REPLACE FUNCTION calculate_booking_total(
  p_room_id uuid,
  p_check_in date,
  p_check_out date
)
RETURNS numeric AS $$
DECLARE
  v_price_per_night numeric;
  v_nights integer;
BEGIN
  -- Get room price
  SELECT price_per_night INTO v_price_per_night
  FROM hotel_rooms
  WHERE id = p_room_id;
  
  -- Calculate number of nights
  v_nights := (p_check_out_date - p_check_in_date)::integer;
  
  -- Return total price
  RETURN v_price_per_night * v_nights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;