-- Dining Venues Table
CREATE TABLE IF NOT EXISTS pms_dining_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'restaurant',
  description TEXT,
  capacity INTEGER DEFAULT 50,
  min_spend_per_person INTEGER DEFAULT 0,
  opening_time TEXT DEFAULT '07:00',
  closing_time TEXT DEFAULT '22:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parking Spots Table
CREATE TABLE IF NOT EXISTS pms_parking_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'standard',
  price_per_hour INTEGER DEFAULT 50,
  price_per_day INTEGER DEFAULT 300,
  is_covered BOOLEAN DEFAULT false,
  has_ev_charger BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Gym/Spa Classes Table
CREATE TABLE IF NOT EXISTS pms_gym_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instructor TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'yoga',
  schedule_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER DEFAULT 20,
  price INTEGER DEFAULT 200,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Update pms_services to include additional fields if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pms_services' AND column_name = 'description') THEN
    ALTER TABLE pms_services ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pms_services' AND column_name = 'duration_minutes') THEN
    ALTER TABLE pms_services ADD COLUMN duration_minutes INTEGER;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE pms_dining_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_parking_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_gym_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pms_dining_venues
CREATE POLICY "admin_manage_dining_venues" ON pms_dining_venues
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for pms_parking_spots
CREATE POLICY "admin_manage_parking_spots" ON pms_parking_spots
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for pms_gym_classes
CREATE POLICY "admin_manage_gym_classes" ON pms_gym_classes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Add sort_order to pms_room_types if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pms_room_types' AND column_name = 'sort_order') THEN
    ALTER TABLE pms_room_types ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pms_room_types' AND column_name = 'image_url') THEN
    ALTER TABLE pms_room_types ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dining_venues_active ON pms_dining_venues(is_active);
CREATE INDEX IF NOT EXISTS idx_parking_spots_active ON pms_parking_spots(is_active);
CREATE INDEX IF NOT EXISTS idx_gym_classes_active ON pms_gym_classes(is_active);
CREATE INDEX IF NOT EXISTS idx_services_category ON pms_services(category);