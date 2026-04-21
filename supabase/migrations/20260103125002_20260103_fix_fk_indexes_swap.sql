/*
  # Fix Foreign Key Indexes - Swap Unused Ones

  1. Add Indexes for Remaining Unindexed Foreign Keys
    - Add index on `payments.received_by` for FK performance
    - Add index on `reservation_services.service_id` for FK performance
    - Add index on `reservations.created_by` for FK performance
    
  2. Clean Up Unused Indexes from Previous Migration
    - Drop recently created indexes that are not being used
    - These include: idx_invoices_reservation_id, idx_payments_invoice_id, 
      idx_reservation_services_reservation_id, idx_reservations_guest_id, idx_reservations_room_id
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

-- Drop unused indexes from previous migration
DROP INDEX IF EXISTS idx_invoices_reservation_id;
DROP INDEX IF EXISTS idx_payments_invoice_id;
DROP INDEX IF EXISTS idx_reservation_services_reservation_id;
DROP INDEX IF EXISTS idx_reservations_guest_id;
DROP INDEX IF EXISTS idx_reservations_room_id;
