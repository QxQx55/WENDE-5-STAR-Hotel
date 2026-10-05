-- Create payment_status enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'CANCELLED', 'REFUNDED');
  END IF;
END $$;

-- Create payment_gateway enum for Ethiopian payment providers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_gateway') THEN
    CREATE TYPE payment_gateway AS ENUM ('telebirr', 'cbe_birr', 'mpesa', 'cbe_bank', 'dashen_bank', 'awash_bank', 'cash', 'card');
  END IF;
END $$;