/*
  # Clean up duplicate and overly restrictive RLS policies for Rooms

  1. Drop old restrictive policies that require profile checks
  2. Keep simplified policies that only require authentication
*/

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Staff can view all rooms" ON rooms;
DROP POLICY IF EXISTS "Staff can create rooms" ON rooms;
DROP POLICY IF EXISTS "Staff can update rooms" ON rooms;
DROP POLICY IF EXISTS "Staff can delete rooms" ON rooms;
