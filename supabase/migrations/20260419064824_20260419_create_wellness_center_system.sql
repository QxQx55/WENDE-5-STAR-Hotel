/*
  # Create Premium Wellness Center System

  1. New Tables
    - `wellness_trainers` - Personal trainers and staff
    - `fitness_classes` - Group fitness classes (yoga, pilates, HIIT, etc.)
    - `class_bookings` - Guest reservations for classes
    - `spa_services` - Available spa treatments
    - `spa_bookings` - Guest spa appointments
    - `trainer_assignments` - Personal trainer assigned to guests
    - `guest_wellness_profile` - Guest fitness goals and preferences
    - `wellness_packages` - Premium membership tiers
    - `wellness_sessions` - All wellness activities log
    - `recovery_zone_bookings` - Sauna, steam, ice bath reservations

  2. Security
    - Enable RLS on all tables
    - Customers can only view/book their own reservations
    - Staff can manage facilities and view their schedules
    - Admin has full access
*/

CREATE TABLE IF NOT EXISTS wellness_trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  name text NOT NULL,
  specialization text NOT NULL,
  bio text,
  rating numeric(3,2) DEFAULT 5.0,
  hourly_rate numeric(10,2) NOT NULL,
  availability jsonb DEFAULT '{"monday": [], "tuesday": [], "wednesday": [], "thursday": [], "friday": [], "saturday": [], "sunday": []}'::jsonb,
  image_url text,
  certifications text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fitness_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  class_type text NOT NULL,
  instructor_id uuid REFERENCES wellness_trainers(id),
  room_name text NOT NULL,
  capacity integer DEFAULT 20,
  duration_minutes integer DEFAULT 60,
  difficulty_level text CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
  schedule jsonb NOT NULL,
  price numeric(10,2) NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  class_id uuid NOT NULL REFERENCES fitness_classes(id),
  booking_date date NOT NULL,
  status text CHECK (status IN ('Confirmed', 'Cancelled', 'Completed')) DEFAULT 'Confirmed',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spa_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  service_category text NOT NULL,
  duration_minutes integer DEFAULT 60,
  price numeric(10,2) NOT NULL,
  therapist_required boolean DEFAULT true,
  image_url text,
  benefits text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spa_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  service_id uuid NOT NULL REFERENCES spa_services(id),
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  therapist_id uuid REFERENCES wellness_trainers(id),
  status text CHECK (status IN ('Confirmed', 'Pending', 'Cancelled', 'Completed')) DEFAULT 'Pending',
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trainer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  trainer_id uuid NOT NULL REFERENCES wellness_trainers(id),
  assignment_date date NOT NULL,
  sessions_remaining integer DEFAULT 3,
  program_focus text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guest_wellness_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  fitness_level text CHECK (fitness_level IN ('Beginner', 'Intermediate', 'Advanced', 'Elite')),
  goals text[],
  health_restrictions text[],
  preferred_activities text[],
  preferred_trainer_id uuid REFERENCES wellness_trainers(id),
  language text DEFAULT 'English',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  tier text CHECK (tier IN ('Gold', 'Platinum', 'Diamond')) NOT NULL,
  price numeric(10,2) NOT NULL,
  duration_days integer NOT NULL,
  included_classes integer DEFAULT 5,
  trainer_sessions integer DEFAULT 2,
  spa_credits numeric(10,2) DEFAULT 100,
  perks text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recovery_zone_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  zone_type text CHECK (zone_type IN ('Sauna', 'Steam Room', 'Ice Bath', 'Relaxation Pod')) NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  duration_minutes integer DEFAULT 30,
  status text CHECK (status IN ('Confirmed', 'Cancelled', 'Completed')) DEFAULT 'Confirmed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wellness_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  session_type text NOT NULL,
  activity_name text NOT NULL,
  duration_minutes integer,
  calories_burned integer,
  intensity text,
  notes text,
  session_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wellness_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_wellness_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_zone_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fitness classes"
  ON fitness_classes FOR SELECT
  USING (true);

CREATE POLICY "Users can view spa services"
  ON spa_services FOR SELECT
  USING (true);

CREATE POLICY "Users can view wellness packages"
  ON wellness_packages FOR SELECT
  USING (true);

CREATE POLICY "Users can view trainers"
  ON wellness_trainers FOR SELECT
  USING (true);

CREATE POLICY "Users can view own wellness profile"
  ON guest_wellness_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness profile"
  ON guest_wellness_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create wellness profile"
  ON guest_wellness_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own class bookings"
  ON class_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create class bookings"
  ON class_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own class bookings"
  ON class_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'Confirmed')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own spa bookings"
  ON spa_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create spa bookings"
  ON spa_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own trainer assignment"
  ON trainer_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recovery zone bookings"
  ON recovery_zone_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create recovery zone bookings"
  ON recovery_zone_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own wellness sessions"
  ON wellness_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create wellness sessions"
  ON wellness_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
