import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import {
  Bed, Users, Wifi, Coffee, Tv, Bath, Wind, Check, ArrowLeft,
  ArrowRight, Loader, Star, Heart, Calendar, Maximize, ChevronRight,
  MapPin, DoorOpen, Sofa, Utensils, Car, Volume2, Sun,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

type RoomTypeWithImage = {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  max_occupancy: number;
  amenities: string[];
  image_url?: string;
  sort_order?: number;
};

type PmsRoom = {
  id: string;
  room_number: string;
  room_type_id: string;
  floor: number;
  status: string;
  notes?: string;
  room_type: RoomTypeWithImage;
};

type RoomSpecs = {
  beds: { count: number; type: string }[];
  size: string;
  view: string;
  location: string;
  bathroom: string;
  hasBalcony: boolean;
  hasDesk: boolean;
  hasMinibar: boolean;
  hasSafe: boolean;
  images: { url: string; label: string; angle: string }[];
};

const ROOM_SPECS: Record<string, RoomSpecs> = {
  'Standard': {
    beds: [{ count: 1, type: 'Queen Bed' }],
    size: '25 m²',
    view: 'City View',
    location: 'Floors 1-3, East Wing',
    bathroom: 'Walk-in shower',
    hasBalcony: false,
    hasDesk: true,
    hasMinibar: false,
    hasSafe: true,
    images: [
      { url: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Bed Area', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Room Overview', angle: 'Wide angle' },
      { url: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Window & Desk', angle: 'Side view' },
      { url: 'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Bathroom', angle: 'Bathroom view' },
    ],
  },
  'Deluxe': {
    beds: [{ count: 1, type: 'King Bed' }],
    size: '35 m²',
    view: 'Pool View',
    location: 'Floors 4-6, West Wing',
    bathroom: 'Bathtub & shower',
    hasBalcony: true,
    hasDesk: true,
    hasMinibar: true,
    hasSafe: true,
    images: [
      { url: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Bed Area', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Bathroom', angle: 'Bathroom view' },
      { url: 'https://images.pexels.com/photos/210604/pexels-photo-210604.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Lounge Area', angle: 'Side view' },
      { url: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Balcony View', angle: 'Balcony view' },
    ],
  },
  'Suite': {
    beds: [{ count: 1, type: 'King Bed' }, { count: 1, type: 'Sofa Bed' }],
    size: '55 m²',
    view: 'Ocean View',
    location: 'Floors 7-9, North Wing',
    bathroom: 'Jacuzzi & rain shower',
    hasBalcony: true,
    hasDesk: true,
    hasMinibar: true,
    hasSafe: true,
    images: [
      { url: 'https://images.pexels.com/photos/210604/pexels-photo-210604.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Living Room', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Bedroom', angle: 'Bedroom view' },
      { url: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Ocean View', angle: 'Window view' },
      { url: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Bathroom', angle: 'Bathroom view' },
    ],
  },
  'Executive': {
    beds: [{ count: 2, type: 'King Bed' }],
    size: '65 m²',
    view: 'Panoramic City View',
    location: 'Floors 10-12, Executive Floor',
    bathroom: 'Double vanity & soaking tub',
    hasBalcony: true,
    hasDesk: true,
    hasMinibar: true,
    hasSafe: true,
    images: [
      { url: 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Master Bedroom', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/210604/pexels-photo-210604.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Living Area', angle: 'Side view' },
      { url: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Second Bedroom', angle: 'Bedroom view' },
      { url: 'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Bathroom', angle: 'Bathroom view' },
    ],
  },
  'Presidential': {
    beds: [{ count: 2, type: 'King Bed' }, { count: 1, type: 'Queen Bed' }],
    size: '120 m²',
    view: '360° Panoramic View',
    location: 'Floor 15, Top Floor - Private Elevator',
    bathroom: 'Jacuzzi, steam room & rain shower',
    hasBalcony: true,
    hasDesk: true,
    hasMinibar: true,
    hasSafe: true,
    images: [
      { url: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Grand Living Room', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Master Bedroom', angle: 'Bedroom view' },
      { url: 'https://images.pexels.com/photos/210604/pexels-photo-210604.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Dining Area', angle: 'Side view' },
      { url: 'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Spa Bathroom', angle: 'Bathroom view' },
    ],
  },
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  'WiFi': Wifi, 'Coffee': Coffee, 'TV': Tv, 'Bathtub': Bath,
  'Air Conditioning': Wind, 'Mini Bar': Coffee, 'Balcony': Sun,
  'Safe': DoorOpen, 'Desk': Sofa, 'Room Service': Utensils,
  'Parking': Car, 'Soundproof': Volume2,
};

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState<PmsRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [booking, setBooking] = useState({
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    number_of_rooms: 1,
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    special_requests: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const { data } = await supabase
          .from('pms_rooms')
          .select('*, room_type:pms_room_types(*)')
          .eq('id', id)
          .single();
        if (data) setRoom(data as PmsRoom);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Bed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Room not found</h2>
          <button onClick={() => navigate('/rooms')} className="mt-4 text-amber-600 font-medium hover:text-amber-700">
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  const typeName = room.room_type?.name || 'Standard';
  const specs = ROOM_SPECS[typeName] || ROOM_SPECS['Standard'];
  const totalBeds = specs.beds.reduce((sum, b) => sum + b.count, 0);

  const calculateTotal = () => {
    if (!booking.check_in_date || !booking.check_out_date) return 0;
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? (room.room_type?.base_price || 0) * nights * booking.number_of_rooms : 0;
  };

  const nights = booking.check_in_date && booking.check_out_date
    ? Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleBook = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const total = calculateTotal();
      const { data, error } = await supabase
        .from('guest_bookings')
        .insert({
          guest_name: booking.guest_name,
          guest_email: booking.guest_email,
          guest_phone: booking.guest_phone,
          room_type_id: room.room_type_id,
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          number_of_guests: booking.number_of_guests,
          number_of_rooms: booking.number_of_rooms,
          special_requests: booking.special_requests,
          total_amount: total,
        })
        .select()
        .single();

      if (error) throw error;
      navigate('/booking', { state: { type: 'room', bookingId: data.id, amount: total } });
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = booking.check_in_date && booking.check_out_date &&
    booking.guest_name && booking.guest_email && booking.guest_phone && nights > 0;

  return (
    <div className="min-h-screen bg-slate-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button onClick={() => navigate('/rooms')} className="hover:text-amber-600 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Rooms
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Room {room.room_number}</span>
          </div>
        </div>
      </div>

      {/* Gallery - Multiple angles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main image */}
          <div className="lg:col-span-3 relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden group">
            <SafeImage
              src={specs.images[activeImage]?.url}
              alt={`${specs.images[activeImage]?.label ?? ''} - ${specs.images[activeImage]?.angle ?? ''}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition"
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            {/* Angle label */}
            <div className="absolute bottom-4 left-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm font-semibold text-slate-900">{specs.images[activeImage].label}</p>
                <p className="text-xs text-slate-500">{specs.images[activeImage].angle}</p>
              </div>
            </div>
            {/* Status badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-emerald-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                Available
              </span>
              <span className="bg-white/90 text-slate-900 text-sm font-semibold px-4 py-1.5 rounded-full">
                Floor {room.floor}
              </span>
            </div>
          </div>

          {/* Thumbnail column - different angles */}
          <div className="flex flex-col gap-3">
            {specs.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative h-[115px] lg:h-[118px] rounded-xl overflow-hidden transition-all ${
                  activeImage === i ? 'ring-2 ring-amber-500' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <SafeImage src={img.url} alt={img.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-1 left-2 right-2">
                  <p className="text-xs text-white font-medium truncate">{img.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header with key specs */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Room {room.room_number}</h1>
                  <p className="text-lg text-slate-500 mt-1">{typeName}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-600">ETB {room.room_type?.base_price?.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">per night</p>
                </div>
              </div>

              {/* Key specs grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                    <Bed className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{totalBeds} {totalBeds === 1 ? 'Bed' : 'Beds'}</p>
                  <p className="text-xs text-slate-500">{specs.beds.map(b => b.type).join(', ')}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{room.room_type?.max_occupancy || 2} Guests</p>
                  <p className="text-xs text-slate-500">Max occupancy</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                    <Maximize className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{specs.size}</p>
                  <p className="text-xs text-slate-500">Room size</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                    <MapPin className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{specs.view}</p>
                  <p className="text-xs text-slate-500">{specs.location}</p>
                </div>
              </div>

              {room.room_type?.description && (
                <p className="text-slate-600 leading-relaxed mt-4">{room.room_type.description}</p>
              )}
            </div>

            {/* Room Layout & Features */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Room Layout & Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Bed className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Sleeping</p>
                    <p className="text-xs text-slate-500">
                      {specs.beds.map(b => `${b.count}x ${b.type}`).join(' + ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Bath className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Bathroom</p>
                    <p className="text-xs text-slate-500">{specs.bathroom}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Location</p>
                    <p className="text-xs text-slate-500">{specs.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Sun className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">View</p>
                    <p className="text-xs text-slate-500">{specs.view}</p>
                  </div>
                </div>
                {specs.hasBalcony && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Private Balcony</p>
                      <p className="text-xs text-slate-500">Outdoor seating area</p>
                    </div>
                  </div>
                )}
                {specs.hasDesk && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Sofa className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Work Desk</p>
                      <p className="text-xs text-slate-500">Ergonomic chair & lamp</p>
                    </div>
                  </div>
                )}
                {specs.hasMinibar && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Coffee className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Mini Bar</p>
                      <p className="text-xs text-slate-500">Complimentary drinks</p>
                    </div>
                  </div>
                )}
                {specs.hasSafe && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <DoorOpen className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">In-room Safe</p>
                      <p className="text-xs text-slate-500">Digital lock</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">All Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(room.room_type?.amenities || []).map((amenity) => {
                  const Icon = AMENITY_ICONS[amenity] || Check;
                  return (
                    <div key={amenity} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-amber-600" />
                      </div>
                      {amenity}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">About This Room</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Room {room.room_number} is a {specs.size} {typeName} room located on floor {room.floor} in the {specs.location}.
                  {' '}It features {totalBeds} {totalBeds === 1 ? 'bed' : 'beds'} ({specs.beds.map(b => b.type).join(', ')})
                  {' '}and can accommodate up to {room.room_type?.max_occupancy || 2} guests.
                </p>
                <p>
                  The room offers a {specs.view.toLowerCase()} with {specs.hasBalcony ? 'a private balcony' : 'large windows'}.
                  {' '}The bathroom includes {specs.bathroom.toLowerCase()}. Every detail has been carefully curated
                  {' '}to ensure a comfortable and memorable stay.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" /> Daily housekeeping
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" /> 24/7 room service
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" /> Complimentary breakfast
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" /> Free cancellation 48h
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 rounded-t-2xl text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Reserve This Room
                </h3>
                <p className="text-amber-100 text-sm mt-1">ETB {room.room_type?.base_price?.toLocaleString()} / night</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={booking.guest_name}
                    onChange={e => setBooking({ ...booking, guest_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Email *</label>
                    <input
                      type="email"
                      value={booking.guest_email}
                      onChange={e => setBooking({ ...booking, guest_email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Phone *</label>
                    <input
                      type="tel"
                      value={booking.guest_phone}
                      onChange={e => setBooking({ ...booking, guest_phone: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                      placeholder="+251 9X XXX XXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Check-in *</label>
                    <input
                      type="date"
                      value={booking.check_in_date}
                      onChange={e => setBooking({ ...booking, check_in_date: e.target.value })}
                      min={minDate}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Check-out *</label>
                    <input
                      type="date"
                      value={booking.check_out_date}
                      onChange={e => setBooking({ ...booking, check_out_date: e.target.value })}
                      min={booking.check_in_date || minDate}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Rooms</label>
                    <select
                      value={booking.number_of_rooms}
                      onChange={e => setBooking({ ...booking, number_of_rooms: parseInt(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Guests</label>
                    <select
                      value={booking.number_of_guests}
                      onChange={e => setBooking({ ...booking, number_of_guests: parseInt(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                    >
                      {Array.from({ length: room.room_type?.max_occupancy || 4 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Special Requests</label>
                  <textarea
                    value={booking.special_requests}
                    onChange={e => setBooking({ ...booking, special_requests: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                    placeholder="Any special requirements..."
                  />
                </div>

                {nights > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        ETB {room.room_type?.base_price?.toLocaleString()} x {nights} {nights === 1 ? 'night' : 'nights'} x {booking.number_of_rooms} {booking.number_of_rooms === 1 ? 'room' : 'rooms'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="font-semibold text-slate-900">Total</span>
                      <span className="text-2xl font-bold text-amber-600">ETB {calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBook}
                  disabled={!isFormValid || submitting}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3.5 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Book Now <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default RoomDetailPage;
