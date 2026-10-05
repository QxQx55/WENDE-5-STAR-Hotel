import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roomService } from '../services/supabase';
import type { Room } from '../types';
import { ArrowRight, Bed, DollarSign, Loader, MapPin, Users } from 'lucide-react';

export function RoomsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [priceRange, setPriceRange] = useState('');

  useEffect(() => {
    let active = true;

    const loadRooms = async () => {
      try {
        const data = await roomService.getRooms();
        if (active) {
          setRooms(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load rooms');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadRooms();
    return () => {
      active = false;
    };
  }, []);

  const roomTypes = useMemo(() => [...new Set(rooms.map((room) => room.room_type))], [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (selectedType && room.room_type !== selectedType) return false;
      if (priceRange === 'budget' && room.price_per_night > 200) return false;
      if (priceRange === 'mid' && (room.price_per_night < 200 || room.price_per_night > 400)) return false;
      if (priceRange === 'luxury' && room.price_per_night < 400) return false;
      return true;
    });
  }, [rooms, selectedType, priceRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Luxury room"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/50" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">Our Rooms</h1>
          <p className="text-xl text-slate-300 max-w-xl">
            Discover the perfect room for your stay. Every room is designed for comfort, privacy, and a memorable visit.
          </p>
        </div>
      </section>

      <section className="sticky top-16 z-30 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Room Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Any Price</option>
                <option value="budget">Budget ($0 - $200)</option>
                <option value="mid">Mid-Range ($200 - $400)</option>
                <option value="luxury">Luxury ($400+)</option>
              </select>
            </div>

            <div className="text-sm text-slate-500 self-end pb-2">{filteredRooms.length} rooms available</div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto">
        {error && (
          <div role="alert" className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg">
            <p>Error loading rooms: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition overflow-hidden">
                {room.image_url ? (
                  <img src={room.image_url} alt={`${room.room_type} room ${room.room_number}`} className="h-52 w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                    <Bed className="h-12 w-12 text-slate-400" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">Room {room.room_number}</h3>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">{room.room_type}</span>
                  </div>

                  {room.description && <p className="text-sm text-slate-600 mb-4">{room.description}</p>}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      Up to {room.max_occupancy} guests
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DollarSign className="w-4 h-4" />
                      ${Number(room.price_per_night).toFixed(2)}/night
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      Floor {room.floor}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        user
                          ? `/bookings?room=${encodeURIComponent(room.id)}`
                          : `/login?next=${encodeURIComponent(`/bookings?room=${room.id}`)}`
                      )
                    }
                    className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                      room.status === 'Available'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                    disabled={room.status !== 'Available'}
                  >
                    {room.status === 'Available' ? 'Book Now' : 'Not Available'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-slate-500">
              <Bed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700">No rooms match your filters</h3>
              <p>Try adjusting your filters to see more options.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
