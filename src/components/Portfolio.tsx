import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Users, DollarSign, Briefcase, Waves, UtensilsCrossed, Zap, Flower2, Info } from 'lucide-react';

interface PortfolioRoom {
  id: string;
  name: string;
  description: string;
  image_url: string;
  amenities: string[];
  capacity: number;
  price_per_night: number;
}

interface PortfolioAmenity {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  image_url: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  Flower2: <Flower2 className="w-8 h-8" />,
  UtensilsCrossed: <UtensilsCrossed className="w-8 h-8" />,
  Zap: <Zap className="w-8 h-8" />,
  Waves: <Waves className="w-8 h-8" />,
  Briefcase: <Briefcase className="w-8 h-8" />,
  Info: <Info className="w-8 h-8" />,
};

export default function Portfolio({ onLoginClick }: { onLoginClick: () => void }) {
  const [rooms, setRooms] = useState<PortfolioRoom[]>([]);
  const [amenities, setAmenities] = useState<PortfolioAmenity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const [roomsRes, amenitiesRes] = await Promise.all([
        supabase.from('portfolio_rooms').select('*').order('created_at'),
        supabase.from('portfolio_amenities').select('*').order('created_at'),
      ]);

      if (roomsRes.data) setRooms(roomsRes.data);
      if (amenitiesRes.data) setAmenities(amenitiesRes.data);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Luxury Hotel</h1>
          </div>
          <button
            onClick={onLoginClick}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition"
          >
            Staff Login
          </button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Experience Luxury Like Never Before
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Discover our world-class accommodations, premium amenities, and exceptional service designed for the discerning traveler.
            </p>
            <button
              onClick={onLoginClick}
              className="inline-block px-8 py-4 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition"
            >
              Book Your Stay
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Rooms</h2>
            <p className="text-xl text-slate-600">Choose from our carefully curated selection of luxurious rooms</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition">
                <img
                  src={room.image_url}
                  alt={room.name}
                  className="w-full h-64 object-cover hover:scale-105 transition duration-300"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{room.name}</h3>
                  <p className="text-slate-600 mb-4">{room.description}</p>

                  <div className="flex items-center gap-6 mb-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-5 h-5 text-slate-400" />
                      <span>{room.capacity} guests</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <DollarSign className="w-5 h-5 text-slate-400" />
                      <span>${room.price_per_night}/night</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Room Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={onLoginClick}
                    className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition"
                  >
                    Book This Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">World-Class Amenities</h2>
            <p className="text-xl text-slate-600">Enjoy our premium facilities and services designed for your comfort</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {amenities.map((amenity) => (
              <div key={amenity.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition">
                {amenity.image_url ? (
                  <img
                    src={amenity.image_url}
                    alt={amenity.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <div className="text-slate-400">
                      {iconMap[amenity.icon_name]}
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-slate-900">
                      {iconMap[amenity.icon_name]}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{amenity.name}</h3>
                  </div>
                  <p className="text-slate-600">{amenity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-12 text-white text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Book Your Escape?</h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied guests who have experienced the finest in luxury hospitality.
            </p>
            <button
              onClick={onLoginClick}
              className="inline-block px-8 py-4 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition"
            >
              Start Booking Now
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Luxury Hotel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}