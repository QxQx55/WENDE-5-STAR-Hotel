/*
  # Create portfolio tables for hotel showcase

  1. New Tables
    - `portfolio_rooms`
      - `id` (uuid, primary key)
      - `name` (text) - Room type name (e.g., "Deluxe Suite")
      - `description` (text) - Room description
      - `image_url` (text) - Image URL for the room
      - `amenities` (text array) - List of amenities in the room
      - `capacity` (integer) - Max guests
      - `price_per_night` (decimal) - Nightly rate
      - `created_at` (timestamp)
    
    - `portfolio_amenities`
      - `id` (uuid, primary key)
      - `name` (text) - Amenity name
      - `description` (text) - Amenity description
      - `icon_name` (text) - Lucide icon name for display
      - `image_url` (text) - Image URL
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Create policy for public read access
*/

CREATE TABLE IF NOT EXISTS portfolio_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  amenities text[] DEFAULT '{}',
  capacity integer DEFAULT 2,
  price_per_night decimal(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portfolio_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_rooms are public"
  ON portfolio_rooms
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "portfolio_amenities are public"
  ON portfolio_amenities
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert sample data
INSERT INTO portfolio_rooms (name, description, image_url, amenities, capacity, price_per_night) VALUES
(
  'Deluxe Suite',
  'Experience luxury in our spacious Deluxe Suite with panoramic city views, premium bedding, and a marble-appointed bathroom. Perfect for discerning travelers.',
  'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg',
  ARRAY['King Bed', '55-inch Smart TV', 'Marble Bathroom', 'Walk-in Closet', 'City View', 'Mini Bar'],
  2,
  299.00
),
(
  'Ocean View Room',
  'Wake up to stunning ocean views from your private balcony. Our Ocean View rooms feature premium furnishings and direct access to the beach.',
  'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg',
  ARRAY['Ocean View', 'Private Balcony', 'Beach Access', 'Modern Amenities', 'WiFi', 'Safe'],
  2,
  249.00
),
(
  'Family Suite',
  'Spacious accommodations for the whole family. Multiple bedrooms and living areas make this the ideal home away from home.',
  'https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg',
  ARRAY['Multiple Bedrooms', 'Living Area', 'Kitchen', 'Game Console', 'Large Bathroom', 'Family-Friendly'],
  4,
  399.00
),
(
  'Premium Room',
  'Elegant and comfortable, our Premium Rooms offer everything you need for a perfect stay with contemporary design and top-tier amenities.',
  'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg',
  ARRAY['Queen Bed', 'Work Desk', 'Modern Bathroom', 'Free WiFi', 'Premium Toiletries', 'Climate Control'],
  2,
  179.00
);

INSERT INTO portfolio_amenities (name, description, icon_name, image_url) VALUES
(
  'World-Class Spa',
  'Rejuvenate your mind and body at our luxurious spa featuring professional therapists and premium wellness treatments.',
  'Flower2',
  'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg'
),
(
  'Fine Dining',
  'Indulge in exquisite cuisine at our award-winning restaurants with world-renowned chefs and extensive wine collections.',
  'UtensilsCrossed',
  'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg'
),
(
  'Fitness Center',
  'Stay fit during your stay with our state-of-the-art gym equipment, personal trainers, and yoga classes available daily.',
  'Zap',
  'https://images.pexels.com/photos/2347468/pexels-photo-2347468.jpeg'
),
(
  'Swimming Pool',
  'Relax by our Olympic-sized pool with infinity views, heated water, and poolside service available 24/7.',
  'Waves',
  'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg'
),
(
  'Business Center',
  'Fully equipped with high-speed internet, private meeting rooms, and professional support staff for all your business needs.',
  'Briefcase',
  'https://images.pexels.com/photos/3862632/pexels-photo-3862632.jpeg'
),
(
  'Concierge Service',
  'Our dedicated concierge team is available 24/7 to arrange restaurant reservations, tours, transportation, and more.',
  'Info',
  'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg'
);