import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BedDouble, Calendar, Users, Wifi, Tv, Wind, Coffee, Star, ArrowRight,
  Check, Loader2, Heart, Sparkles, Clock, Phone
} from 'lucide-react';
import type { PmsRoomType } from '../types/pms';
import { SafeImage } from '../components/SafeImage';

const ROOM_IMAGES: Record<string, string> = {
  'Standard': 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Deluxe': 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Suite': 'https://images.pexels.com/photos/210604/pexels-photo-210604.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Executive': 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Presidential': 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
};

export function RoomsBookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<PmsRoomType | null>(null);
  const [loading, setLoading] = useState(true);

  const [booking, setBooking] = useState({
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    number_of_rooms: 1,
  });

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    const { data } = await supabase
      .from('pms_room_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (data) setRoomTypes(data as PmsRoomType[]);
    setLoading(false);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const calculateNights = () => {
    if (!booking.check_in_date || !booking.check_out_date) return 0;
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!selectedRoom) return 0;
    return selectedRoom.base_price * calculateNights() * booking.number_of_rooms;
  };

  const handleProceed = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/booking', {
      state: {
        type: 'room',
        room_type_id: selectedRoom?.id,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        number_of_guests: booking.number_of_guests,
        number_of_rooms: booking.number_of_rooms,
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <SafeImage
          src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Luxury Rooms"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/40" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <BedDouble className="w-8 h-8 text-amber-400" />
            <span className="text-amber-400 font-medium">Accommodations</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">Luxury Rooms & Suites</h1>
          <p className="text-xl text-slate-300 max-w-2xl">Choose from our selection of beautifully appointed rooms, each designed for your comfort and relaxation.</p>
        </div>
      </section>

      {/* Date Selection Bar */}
      <section className="sticky top-16 z-30 bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Check-in Date
              </label>
              <input
                type="date"
                value={booking.check_in_date}
                onChange={e => setBooking({ ...booking, check_in_date: e.target.value })}
                min={minDate}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Check-out Date
              </label>
              <input
                type="date"
                value={booking.check_out_date}
                onChange={e => setBooking({ ...booking, check_out_date: e.target.value })}
                min={booking.check_in_date || minDate}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div className="w-32">
              <label className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
                <Users className="w-3 h-3" /> Guests
              </label>
              <select
                value={booking.number_of_guests}
                onChange={e => setBooking({ ...booking, number_of_guests: parseInt(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
              >
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="w-32">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Rooms</label>
              <select
                value={booking.number_of_rooms}
                onChange={e => setBooking({ ...booking, number_of_rooms: parseInt(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {booking.check_in_date && booking.check_out_date && (
              <div className="bg-amber-50 px-4 py-2 rounded-lg">
                <span className="text-amber-700 font-semibold">{calculateNights()} nights</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Room Types Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roomTypes.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              isSelected={selectedRoom?.id === room.id}
              onSelect={() => setSelectedRoom(room)}
              nights={calculateNights()}
              numRooms={booking.number_of_rooms}
            />
          ))}
        </div>
      </section>

      {/* Selection Summary */}
      {selectedRoom && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SafeImage
                  src={ROOM_IMAGES[selectedRoom.name] || ROOM_IMAGES['Standard']}
                  alt={selectedRoom.name}
                  className="w-20 h-14 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedRoom.name}</h3>
                  <p className="text-sm text-slate-500">{calculateNights()} nights x {booking.number_of_rooms} room(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Total Amount</p>
                  <p className="text-2xl font-bold text-amber-600">ETB {calculateTotal().toLocaleString()}</p>
                </div>
                <button
                  onClick={handleProceed}
                  disabled={!booking.check_in_date || !booking.check_out_date}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Book Now <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomCard({ room, isSelected, onSelect, nights, numRooms }: {
  room: PmsRoomType;
  isSelected: boolean;
  onSelect: () => void;
  nights: number;
  numRooms: number;
}) {
  const image = ROOM_IMAGES[room.name] || ROOM_IMAGES['Standard'];
  const total = room.base_price * nights * numRooms;

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 transition-all cursor-pointer ${
        isSelected ? 'border-amber-500 shadow-xl ring-2 ring-amber-500/20' : 'border-slate-100 hover:border-slate-300 hover:shadow-lg'
      }`}
    >
      <div className="relative h-64 overflow-hidden">
        <SafeImage src={image} alt={room.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur text-slate-900 text-sm font-semibold px-3 py-1 rounded-full">
            ETB {room.base_price.toLocaleString()}/night
          </span>
        </div>
        {isSelected && (
          <div className="absolute top-4 right-4 bg-amber-500 text-white p-2 rounded-full">
            <Check className="w-5 h-5" />
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white mb-1">{room.name}</h3>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Users className="w-4 h-4" /> {room.max_occupancy} guests
            <span className="mx-2">|</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9
          </div>
        </div>
      </div>

      <div className="p-6">
        {room.description && (
          <p className="text-slate-600 text-sm mb-4">{room.description}</p>
        )}

        {room.amenities && room.amenities.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {room.amenities.slice(0, 6).map(amenity => (
                <span key={amenity} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {amenity === 'WiFi' && <Wifi className="w-3 h-3" />}
                  {amenity === 'TV' && <Tv className="w-3 h-3" />}
                  {amenity === 'Air Conditioning' && <Wind className="w-3 h-3" />}
                  {amenity === 'Mini Bar' && <Coffee className="w-3 h-3" />}
                  {amenity === 'Coffee Machine' && <Coffee className="w-3 h-3" />}
                  {!['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Machine'].includes(amenity) && <Sparkles className="w-3 h-3" />}
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 6 && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  +{room.amenities.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {nights > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-slate-600">{nights} night(s) x {numRooms} room(s)</span>
            <span className="text-lg font-bold text-slate-900">ETB {total.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomsBookingPage;
