/*
  # Fix Remaining Foreign Key Indexes

  1. Add Indexes for Unindexed Foreign Keys
    - Add index on `invoices.reservation_id` for FK performance
    - Add index on `payments.invoice_id` for FK performance
    - Add index on `reservation_services.reservation_id` for FK performance
    - Add index on `reservations.guest_id` for FK performance
    - Add index on `reservations.room_id` for FK performance
    
  2. Clean Up Unused Indexes
    - Drop `idx_payments_received_by` (unused)
    - Drop `idx_reservation_services_service_id` (unused)
    - Drop `idx_reservations_created_by` (unused)
*/

-- Add indexes for unindexed foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'invoices' AND indexname = 'idx_invoices_reservation_id'
  ) THEN
    CREATE INDEX idx_invoices_reservation_id ON invoices(reservation_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'payments' AND indexname = 'idx_payments_invoice_id'
  ) THEN
    CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'reservation_services' AND indexname = 'idx_reservation_services_reservation_id'
  ) THEN
    CREATE INDEX idx_reservation_services_reservation_id ON reservation_services(reservation_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'reservations' AND indexname = 'idx_reservations_guest_id'
  ) THEN
    CREATE INDEX idx_reservations_guest_id ON reservations(guest_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'reservations' AND indexname = 'idx_reservations_room_id'
  ) THEN
    CREATE INDEX idx_reservations_room_id ON reservations(room_id);
  END IF;
END $$;

-- Drop unused indexes
DROP INDEX IF EXISTS idx_payments_received_by;
DROP INDEX IF EXISTS idx_reservation_services_service_id;
DROP INDEX IF EXISTS idx_reservations_created_by;
