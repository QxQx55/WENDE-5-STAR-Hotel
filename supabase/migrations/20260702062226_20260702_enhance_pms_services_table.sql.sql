-- Add missing columns to pms_services table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pms_services' AND column_name = 'image_url') THEN
    ALTER TABLE pms_services ADD COLUMN image_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pms_services' AND column_name = 'max_capacity') THEN
    ALTER TABLE pms_services ADD COLUMN max_capacity INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pms_services' AND column_name = 'created_at') THEN
    ALTER TABLE pms_services ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pms_services' AND column_name = 'updated_at') THEN
    ALTER TABLE pms_services ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;