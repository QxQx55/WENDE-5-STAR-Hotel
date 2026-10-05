import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Car, Calendar, Shield, ArrowRight, ArrowLeft, Check,
  Loader2, Heart, MapPin, Zap, ChevronRight, Star, Maximize,
  Ruler, Navigation, Building2, Sun,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

type ParkingSpec = {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  pricePerDay: number;
  image: string;
  spotSize: string;
  totalSpots: number;
  availableSpots: number;
  level: string;
  distanceFromEntrance: string;
  covered: boolean;
  hasEVCharging: boolean;
  has247Security: boolean;
  hasCCTV: boolean;
  heightClearance: string;
  features: string[];
  longDesc: string;
  images: { url: string; label: string; angle: string }[];
};

const parkingTypes: ParkingSpec[] = [
  {
    id: 'self',
    name: 'Self Parking',
    description: 'Convenient self-parking with 24/7 security surveillance',
    pricePerHour: 50,
    pricePerDay: 300,
    image: 'https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=1200',
    spotSize: '2.5m x 5.0m per spot',
    totalSpots: 50,
    availableSpots: 15,
    level: 'Ground Level, P1',
    distanceFromEntrance: '50m from main entrance',
    covered: true,
    hasEVCharging: false,
    has247Security: true,
    hasCCTV: true,
    heightClearance: '2.1m',
    features: ['Covered parking', 'Security cameras', 'Ground level access', '24/7 access'],
    longDesc: 'Our self-parking facility offers 50 secure, covered spots on the ground level. Each spot measures 2.5m x 5.0m with 2.1m height clearance, suitable for sedans, SUVs, and small vans. Easy ground-level access makes it convenient for all vehicle types.',
    images: [
      { url: 'https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Parking Lot', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/209715/pexels-photo-209715.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Parking Spots', angle: 'Aerial view' },
      { url: 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Entrance', angle: 'Entrance view' },
      { url: 'https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Security Area', angle: 'Security view' },
    ],
  },
  {
    id: 'valet',
    name: 'Valet Parking',
    description: 'Premium valet service with car wash and detailing options',
    pricePerHour: 100,
    pricePerDay: 600,
    image: 'https://images.pexels.com/photos/1704652/pexels-photo-1704652.jpeg?auto=compress&cs=tinysrgb&w=1200',
    spotSize: '2.7m x 5.5m per spot',
    totalSpots: 20,
    availableSpots: 8,
    level: 'Underground, B1 (Premium)',
    distanceFromEntrance: 'Drop-off at main entrance',
    covered: true,
    hasEVCharging: false,
    has247Security: true,
    hasCCTV: true,
    heightClearance: '2.3m',
    features: ['Valet service', 'Car wash available', 'Priority pickup', 'Climate-controlled'],
    longDesc: 'Experience the ultimate convenience with our premium valet parking service. Simply drop off your keys at the entrance and our professional valets will park your vehicle in our climate-controlled underground facility. Each spot measures 2.7m x 5.5m with 2.3m height clearance. Car wash and detailing services available upon request.',
    images: [
      { url: 'https://images.pexels.com/photos/1704652/pexels-photo-1704652.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Valet Drop-off', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Premium Spots', angle: 'Underground view' },
      { url: 'https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Parking Area', angle: 'Wide angle' },
      { url: 'https://images.pexels.com/photos/209715/pexels-photo-209715.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Security Gate', angle: 'Entrance view' },
    ],
  },
  {
    id: 'ev',
    name: 'EV Charging',
    description: 'Reserved spots with electric vehicle charging stations',
    pricePerHour: 70,
    pricePerDay: 400,
    image: 'https://images.pexels.com/photos/4570991/pexels-photo-4570991.jpeg?auto=compress&cs=tinysrgb&w=1200',
    spotSize: '2.5m x 5.0m per spot',
    totalSpots: 10,
    availableSpots: 3,
    level: 'Ground Level, P1 - EV Zone',
    distanceFromEntrance: '70m from main entrance',
    covered: true,
    hasEVCharging: true,
    has247Security: true,
    hasCCTV: true,
    heightClearance: '2.1m',
    features: ['EV charging', 'Type 2 & CCS', 'Green energy', 'Reserved spots'],
    longDesc: 'Charge your electric vehicle while you stay with us. Our dedicated EV parking zone features 10 spots with Type 2 and CCS charging stations powered by green energy. Each spot measures 2.5m x 5.0m with 2.1m height clearance. Monitor your charging status via our mobile app.',
    images: [
      { url: 'https://images.pexels.com/photos/4570991/pexels-photo-4570991.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'EV Charging Station', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Charging Spots', angle: 'Side view' },
      { url: 'https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'EV Zone', angle: 'Wide angle' },
      { url: 'https://images.pexels.com/photos/209715/pexels-photo-209715.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Charging Unit', angle: 'Close-up view' },
    ],
  },
];

const availabilitySlots = [
  { time: '08:00 - 12:00', available: 15, total: 50 },
  { time: '12:00 - 16:00', available: 8, total: 50 },
  { time: '16:00 - 20:00', available: 3, total: 50 },
  { time: '20:00 - 00:00', available: 25, total: 50 },
];

export function ParkingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const [booking, setBooking] = useState({
    vehicle_plate: '',
    vehicle_type: 'sedan',
    date: '',
    start_time: '08:00',
    end_time: '20:00',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    is_daily: true,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const parkingType = parkingTypes.find(p => p.id === id);

  if (!parkingType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Parking option not found</h2>
          <button onClick={() => navigate('/parking')} className="mt-4 text-blue-600 font-medium hover:text-blue-700">
            Back to Parking
          </button>
        </div>
      </div>
    );
  }

  const hours = booking.is_daily ? 24 :
    (parseInt(booking.end_time) - parseInt(booking.start_time)) || 12;
  const totalAmount = booking.is_daily
    ? parkingType.pricePerDay
    : Math.round((parkingType.pricePerHour * (hours / 10)) * 10) / 10;

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('guest_bookings')
        .insert({
          guest_name: booking.guest_name,
          guest_email: booking.guest_email,
          guest_phone: booking.guest_phone,
          room_type_id: null,
          check_in_date: booking.date,
          check_out_date: booking.date,
          number_of_guests: 1,
          number_of_rooms: 1,
          special_requests: `Parking: ${parkingType.name} | Vehicle: ${booking.vehicle_plate} | Time: ${booking.start_time} - ${booking.end_time}`,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (error) throw error;
      navigate('/booking', {
        state: { type: 'parking', bookingId: data.id, amount: totalAmount, parkingType: parkingType.name },
      });
    } catch (error) {
      console.error('Parking booking error:', error);
      alert('Failed to book parking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = booking.date && booking.vehicle_plate && booking.guest_name &&
    booking.guest_email && booking.guest_phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button onClick={() => navigate('/parking')} className="hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Parking
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{parkingType.name}</span>
          </div>
        </div>
      </div>

      {/* Gallery - Multiple angles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            <SafeImage src={parkingType.images[activeImage]?.url} alt={`${parkingType.images[activeImage]?.label ?? ''} - ${parkingType.images[activeImage]?.angle ?? ''}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition"
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <div className="absolute bottom-4 left-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm font-semibold text-slate-900">{parkingType.images[activeImage].label}</p>
                <p className="text-xs text-slate-500">{parkingType.images[activeImage].angle}</p>
              </div>
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                {parkingType.availableSpots} spots left
              </span>
              <span className="bg-white/90 text-slate-900 text-sm font-semibold px-4 py-1.5 rounded-full">
                ETB {parkingType.pricePerHour}/hr
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {parkingType.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative h-[115px] lg:h-[118px] rounded-xl overflow-hidden transition-all ${
                  activeImage === i ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
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
                  <h1 className="text-3xl font-bold text-slate-900">{parkingType.name}</h1>
                  <p className="text-lg text-slate-500 mt-1">{parkingType.description}</p>
                </div>
              </div>

              {/* Key specs grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                    <Ruler className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{parkingType.spotSize.split('x')[0].trim()}</p>
                  <p className="text-xs text-slate-500">Spot width</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{parkingType.level.split(',')[0]}</p>
                  <p className="text-xs text-slate-500">{parkingType.level.split(',')[1]?.trim()}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                    <Navigation className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{parkingType.distanceFromEntrance.split('m')[0]}m</p>
                  <p className="text-xs text-slate-500">From entrance</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                    <Maximize className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{parkingType.heightClearance}</p>
                  <p className="text-xs text-slate-500">Height clearance</p>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed mt-4">{parkingType.longDesc}</p>
            </div>

            {/* Spot Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Parking Spot Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Spot Dimensions</p>
                    <p className="text-xs text-slate-500">{parkingType.spotSize}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Level & Location</p>
                    <p className="text-xs text-slate-500">{parkingType.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Distance</p>
                    <p className="text-xs text-slate-500">{parkingType.distanceFromEntrance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Maximize className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Height Clearance</p>
                    <p className="text-xs text-slate-500">{parkingType.heightClearance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Car className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Total Spots</p>
                    <p className="text-xs text-slate-500">{parkingType.totalSpots} spots ({parkingType.availableSpots} available)</p>
                  </div>
                </div>
                {parkingType.covered && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <Sun className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Covered</p>
                      <p className="text-xs text-slate-500">Weather protected</p>
                    </div>
                  </div>
                )}
                {parkingType.hasEVCharging && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">EV Charging</p>
                      <p className="text-xs text-slate-500">Type 2 & CCS connectors</p>
                    </div>
                  </div>
                )}
                {parkingType.has247Security && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">24/7 Security</p>
                      <p className="text-xs text-slate-500">{parkingType.hasCCTV ? 'CCTV monitored' : 'Guard patrol'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Included Features</h2>
              <div className="grid grid-cols-2 gap-4">
                {parkingType.features.map(feature => (
                  <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Availability */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" /> Live Availability for Today
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availabilitySlots.map(slot => (
                  <div key={slot.time} className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-2">{slot.time}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${slot.available > 10 ? 'bg-green-500' : slot.available > 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${(slot.available / slot.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{slot.available}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{slot.available} of {slot.total} spots</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Pricing</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-blue-100 text-sm">Hourly Rate</p>
                  <p className="text-3xl font-bold">ETB {parkingType.pricePerHour}</p>
                  <p className="text-blue-100 text-sm mt-1">per hour</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Daily Rate</p>
                  <p className="text-3xl font-bold">ETB {parkingType.pricePerDay}</p>
                  <p className="text-blue-100 text-sm mt-1">per 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-2xl text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Reserve Parking
                </h3>
                <p className="text-blue-100 text-sm mt-1">{parkingType.name}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={booking.guest_name}
                    onChange={e => setBooking({ ...booking, guest_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Email *</label>
                    <input
                      type="email"
                      value={booking.guest_email}
                      onChange={e => setBooking({ ...booking, guest_email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Phone *</label>
                    <input
                      type="tel"
                      value={booking.guest_phone}
                      onChange={e => setBooking({ ...booking, guest_phone: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="+251..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Vehicle Plate Number *</label>
                  <input
                    type="text"
                    value={booking.vehicle_plate}
                    onChange={e => setBooking({ ...booking, vehicle_plate: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., AA-1234-B"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Vehicle Type</label>
                  <select
                    value={booking.vehicle_type}
                    onChange={e => setBooking({ ...booking, vehicle_type: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sedan">Sedan / SUV</option>
                    <option value="compact">Compact Car</option>
                    <option value="truck">Truck / Van</option>
                    <option value="motorcycle">Motorcycle</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Date *</label>
                  <input
                    type="date"
                    value={booking.date}
                    onChange={e => setBooking({ ...booking, date: e.target.value })}
                    min={minDate}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBooking({ ...booking, is_daily: true })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${booking.is_daily ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Full Day
                  </button>
                  <button
                    onClick={() => setBooking({ ...booking, is_daily: false })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${!booking.is_daily ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Hourly
                  </button>
                </div>

                {!booking.is_daily && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">Start Time</label>
                      <select
                        value={booking.start_time}
                        onChange={e => setBooking({ ...booking, start_time: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="08:00">8:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">End Time</label>
                      <select
                        value={booking.end_time}
                        onChange={e => setBooking({ ...booking, end_time: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">2:00 PM</option>
                        <option value="16:00">4:00 PM</option>
                        <option value="18:00">6:00 PM</option>
                        <option value="20:00">8:00 PM</option>
                        <option value="22:00">10:00 PM</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">{booking.is_daily ? 'Daily Rate' : 'Hourly Rate'}</span>
                    <span className="font-medium">ETB {booking.is_daily ? parkingType.pricePerDay : parkingType.pricePerHour}/hr</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-blue-600">ETB {totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reserve Parking <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ParkingDetailPage;
