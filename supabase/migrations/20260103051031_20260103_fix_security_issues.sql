/*
  # Fix Security and Performance Issues

  1. Index Foreign Keys
    - Add index on `payments.received_by` for FK performance
    - Add index on `reservation_services.service_id` for FK performance
    - Add index on `reservations.created_by` for FK performance
    
  2. Optimize RLS Policies
    - Update `profiles` table RLS policies to use `(select auth.uid())` instead of `auth.uid()` for better performance
    
  3. Clean Up Unused Indexes
    - Drop indexes that have not been used by the query planner
    - Reduce index maintenance overhead and storage usage
*/

-- Add indexes for unindexed foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'payments' AND indexname = 'idx_payments_received_by'
  ) THEN
    CREATE INDEX idx_payments_received_by ON payments(received_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'reservation_services' AND indexname = 'idx_reservation_services_service_id'
  ) THEN
    CREATE INDEX idx_reservation_services_service_id ON reservation_services(service_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'reservations' AND indexname = 'idx_reservations_created_by'
  ) THEN
    CREATE INDEX idx_reservations_created_by ON reservations(created_by);
  END IF;
END $$;

-- Drop unused indexes
DROP INDEX IF EXISTS idx_guests_id_number;
DROP INDEX IF EXISTS idx_guests_phone;
DROP INDEX IF EXISTS idx_rooms_status;
DROP INDEX IF EXISTS idx_reservations_guest_id;
DROP INDEX IF EXISTS idx_reservations_room_id;
DROP INDEX IF EXISTS idx_reservations_dates;
DROP INDEX IF EXISTS idx_reservation_services_reservation_id;
DROP INDEX IF EXISTS idx_invoices_reservation_id;
DROP INDEX IF EXISTS idx_payments_invoice_id;

-- Optimize RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));
