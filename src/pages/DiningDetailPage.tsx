import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  UtensilsCrossed, Clock, Users, Calendar, Star, ChefHat,
  ArrowRight, ArrowLeft, Loader2, Heart, MapPin, Check, ChevronRight,
  Armchair, Table, Utensils, Volume2, Car, Sun, Wine,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

type TableSpec = {
  id: string;
  name: string;
  description: string;
  image: string;
  capacity: number;
  tableSize: string;
  location: string;
  tableType: string;
  hasWindow: boolean;
  hasPrivateSpace: boolean;
  hasWineSelection: boolean;
  hasValet: boolean;
  images: { url: string; label: string; angle: string }[];
  menu: { name: string; desc: string; price: string }[];
};

const diningAreas: TableSpec[] = [
  {
    id: 'main',
    name: 'Main Restaurant',
    description: 'Experience fine dining with our international cuisine and traditional Ethiopian dishes',
    image: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=1200',
    capacity: 80,
    tableSize: '2-8 seats per table',
    location: 'Ground Floor, East Wing',
    tableType: 'Round & rectangular tables',
    hasWindow: true,
    hasPrivateSpace: true,
    hasWineSelection: true,
    hasValet: true,
    images: [
      { url: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Main Hall', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Table Setting', angle: 'Table view' },
      { url: 'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Dining Area', angle: 'Wide angle' },
      { url: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Private Booth', angle: 'Booth view' },
    ],
    menu: [
      { name: 'Doro Wat', desc: 'Traditional spicy chicken stew with hard-boiled eggs, served with injera', price: 'ETB 350' },
      { name: 'Tibs', desc: 'Sautéed beef with onions, peppers, and traditional spices', price: 'ETB 420' },
      { name: 'Kitfo', desc: 'Ethiopian minced beef tartare seasoned with mitmita and niter kibbeh', price: 'ETB 480' },
    ],
  },
  {
    id: 'rooftop',
    name: 'Rooftop Terrace',
    description: 'Dine under the stars with panoramic city views and premium service',
    image: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=1200',
    capacity: 40,
    tableSize: '2-6 seats per table',
    location: 'Rooftop, 15th Floor',
    tableType: 'Outdoor tables with umbrellas',
    hasWindow: false,
    hasPrivateSpace: false,
    hasWineSelection: true,
    hasValet: true,
    images: [
      { url: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Terrace Overview', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Table Setup', angle: 'Table view' },
      { url: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'City View', angle: 'Window view' },
      { url: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Bar Area', angle: 'Side view' },
    ],
    menu: [
      { name: 'Grilled Lobster', desc: 'Fresh lobster with garlic butter and herbs', price: 'ETB 1,200' },
      { name: 'BBQ Ribeye', desc: 'Premium ribeye steak with smoky BBQ glaze', price: 'ETB 850' },
      { name: 'Grilled Sea Bass', desc: 'Whole sea bass with lemon and rosemary', price: 'ETB 650' },
    ],
  },
  {
    id: 'cafe',
    name: 'Garden Cafe',
    description: 'Casual dining with fresh pastries, artisan coffee, and light meals',
    image: 'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=1200',
    capacity: 50,
    tableSize: '2-4 seats per table',
    location: 'Garden Level, South Wing',
    tableType: 'Small bistro tables',
    hasWindow: true,
    hasPrivateSpace: false,
    hasWineSelection: false,
    hasValet: false,
    images: [
      { url: 'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Cafe Interior', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Coffee Bar', angle: 'Bar view' },
      { url: 'https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Garden Seating', angle: 'Outdoor view' },
      { url: 'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Pastry Display', angle: 'Counter view' },
    ],
    menu: [
      { name: 'Croissant & Coffee', desc: 'Fresh butter croissant with your choice of coffee', price: 'ETB 120' },
      { name: 'Avocado Toast', desc: 'Sourdough toast with avocado, poached egg, and chili flakes', price: 'ETB 180' },
      { name: 'Fresh Fruit Bowl', desc: 'Seasonal fruits with honey and yogurt', price: 'ETB 150' },
    ],
  },
  {
    id: 'private',
    name: 'Private Dining Room',
    description: 'Exclusive space for special occasions and business dinners',
    image: 'https://images.pexels.com/photos/2789352/pexels-photo-2789352.jpeg?auto=compress&cs=tinysrgb&w=1200',
    capacity: 20,
    tableSize: '10-20 seats (single large table)',
    location: 'Mezzanine Floor, Private Wing',
    tableType: 'Custom configurable table',
    hasWindow: true,
    hasPrivateSpace: true,
    hasWineSelection: true,
    hasValet: true,
    images: [
      { url: 'https://images.pexels.com/photos/2789352/pexels-photo-2789352.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Private Room', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Table Setting', angle: 'Table view' },
      { url: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Ambiance', angle: 'Side view' },
      { url: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Bar Service', angle: 'Bar view' },
    ],
    menu: [
      { name: 'Custom Tasting Menu', desc: '5-course tasting menu designed by our executive chef', price: 'ETB 2,500/person' },
      { name: 'Wine Pairing', desc: 'Sommelier-selected wines to complement each course', price: 'ETB 800/person' },
      { name: 'Private Chef Experience', desc: 'Live cooking demonstration at your table', price: 'ETB 3,500' },
    ],
  },
];

const timeSlots = ['12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
const occasions = ['Casual Dining', 'Birthday', 'Anniversary', 'Date Night', 'Business Meeting', 'Family Gathering', 'Other Celebration'];

export function DiningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const [reservation, setReservation] = useState({
    date: '',
    time: '',
    guests: 2,
    occasion: '',
    special_requests: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const area = diningAreas.find(a => a.id === id);

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <UtensilsCrossed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Dining area not found</h2>
          <button onClick={() => navigate('/dining')} className="mt-4 text-emerald-600 font-medium hover:text-emerald-700">
            Back to Dining
          </button>
        </div>
      </div>
    );
  }

  const deposit = 500;

  const handleReserve = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('table_reservations')
        .insert({
          guest_name: reservation.guest_name,
          guest_email: reservation.guest_email,
          guest_phone: reservation.guest_phone,
          reservation_date: reservation.date,
          reservation_time: reservation.time,
          number_of_guests: reservation.guests,
          occasion: reservation.occasion,
          special_requests: `${area.name} | ${reservation.special_requests}`,
          deposit_amount: deposit,
        })
        .select()
        .single();

      if (error) throw error;
      navigate('/booking', { state: { type: 'table', reservationId: data.id, amount: deposit } });
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Failed to make reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = reservation.date && reservation.time && reservation.guests &&
    reservation.guest_name && reservation.guest_email && reservation.guest_phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button onClick={() => navigate('/dining')} className="hover:text-emerald-600 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Dining
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{area.name}</span>
          </div>
        </div>
      </div>

      {/* Gallery - Multiple angles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            <SafeImage src={area.images[activeImage]?.url} alt={`${area.images[activeImage]?.label ?? ''} - ${area.images[activeImage]?.angle ?? ''}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition"
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <div className="absolute bottom-4 left-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm font-semibold text-slate-900">{area.images[activeImage].label}</p>
                <p className="text-xs text-slate-500">{area.images[activeImage].angle}</p>
              </div>
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-emerald-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                {area.capacity} seats
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {area.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative h-[115px] lg:h-[118px] rounded-xl overflow-hidden transition-all ${
                  activeImage === i ? 'ring-2 ring-emerald-500' : 'opacity-70 hover:opacity-100'
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
                  <h1 className="text-3xl font-bold text-slate-900">{area.name}</h1>
                  <p className="text-lg text-slate-500 mt-1">{area.description}</p>
                </div>
              </div>

              {/* Key specs grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                    <Armchair className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{area.capacity} Chairs</p>
                  <p className="text-xs text-slate-500">Total seating</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                    <Table className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{area.tableSize}</p>
                  <p className="text-xs text-slate-500">{area.tableType}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Location</p>
                  <p className="text-xs text-slate-500">{area.location}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Hours</p>
                  <p className="text-xs text-slate-500">
                    {area.id === 'private' ? 'By reservation' : area.id === 'cafe' ? '6:30 AM - 9 PM' : area.id === 'rooftop' ? '6 PM - 11 PM' : '7 AM - 10:30 PM'}
                  </p>
                </div>
              </div>
            </div>

            {/* Table & Seating Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Table & Seating Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Armchair className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Seating Capacity</p>
                    <p className="text-xs text-slate-500">{area.capacity} chairs total</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Table className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Table Type</p>
                    <p className="text-xs text-slate-500">{area.tableType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Location</p>
                    <p className="text-xs text-slate-500">{area.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Utensils className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Table Size</p>
                    <p className="text-xs text-slate-500">{area.tableSize}</p>
                  </div>
                </div>
                {area.hasWindow && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <Sun className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Window View</p>
                      <p className="text-xs text-slate-500">Natural light & scenery</p>
                    </div>
                  </div>
                )}
                {area.hasPrivateSpace && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Private Booths</p>
                      <p className="text-xs text-slate-500">Available on request</p>
                    </div>
                  </div>
                )}
                {area.hasWineSelection && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Wine className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Wine Selection</p>
                      <p className="text-xs text-slate-500">Curated cellar</p>
                    </div>
                  </div>
                )}
                {area.hasValet && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Car className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Valet Parking</p>
                      <p className="text-xs text-slate-500">Complimentary</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Menu Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-emerald-500" /> Featured Dishes
              </h2>
              <div className="space-y-4">
                {area.menu.map(dish => (
                  <div key={dish.name} className="flex items-start justify-between pb-4 border-b border-slate-100 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{dish.name}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">{dish.desc}</p>
                    </div>
                    <span className="text-emerald-600 font-semibold ml-4 whitespace-nowrap">{dish.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Reservation form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-t-2xl text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Make a Reservation
                </h3>
                <p className="text-emerald-100 text-sm mt-1">Book your table at {area.name}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={reservation.guest_name}
                    onChange={e => setReservation({ ...reservation, guest_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Your full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Email *</label>
                    <input
                      type="email"
                      value={reservation.guest_email}
                      onChange={e => setReservation({ ...reservation, guest_email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Phone *</label>
                    <input
                      type="tel"
                      value={reservation.guest_phone}
                      onChange={e => setReservation({ ...reservation, guest_phone: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="+251 9X XXX XXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Date *</label>
                    <input
                      type="date"
                      value={reservation.date}
                      onChange={e => setReservation({ ...reservation, date: e.target.value })}
                      min={minDate}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Time *</label>
                    <select
                      value={reservation.time}
                      onChange={e => setReservation({ ...reservation, time: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Guests *</label>
                    <select
                      value={reservation.guests}
                      onChange={e => setReservation({ ...reservation, guests: parseInt(e.target.value) })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n} guests</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Occasion</label>
                    <select
                      value={reservation.occasion}
                      onChange={e => setReservation({ ...reservation, occasion: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select occasion</option>
                      {occasions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Special Requests</label>
                  <textarea
                    value={reservation.special_requests}
                    onChange={e => setReservation({ ...reservation, special_requests: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Dietary requirements, seating preferences..."
                  />
                </div>

                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <p className="text-sm text-emerald-700">
                    <strong>Note:</strong> A deposit of ETB {deposit} is required to confirm your reservation.
                  </p>
                </div>

                <button
                  onClick={handleReserve}
                  disabled={!isFormValid || loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reserve Table <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DiningDetailPage;
