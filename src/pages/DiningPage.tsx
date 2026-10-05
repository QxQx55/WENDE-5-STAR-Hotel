import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  UtensilsCrossed, Clock, Users, Calendar, Star, Wine, ChefHat, Sparkles,
  ArrowRight, Phone, MapPin, Loader2
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

const diningAreas = [
  {
    id: 'main',
    name: 'Main Restaurant',
    description: 'Experience fine dining with our international cuisine and traditional Ethiopian dishes',
    image: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=800',
    capacity: 80,
    cuisine: 'International & Ethiopian',
    hours: '7:00 AM - 10:30 PM',
    priceRange: '$$'
  },
  {
    id: 'rooftop',
    name: 'Rooftop Terrace',
    description: 'Dine under the stars with panoramic city views and premium service',
    image: 'https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=800',
    capacity: 40,
    cuisine: 'Grill & BBQ',
    hours: '6:00 PM - 11:00 PM',
    priceRange: '$$$'
  },
  {
    id: 'cafe',
    name: 'Garden Cafe',
    description: 'Casual dining with fresh pastries, artisan coffee, and light meals',
    image: 'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=800',
    capacity: 50,
    cuisine: 'Cafe & Bakery',
    hours: '6:30 AM - 9:00 PM',
    priceRange: '$'
  },
  {
    id: 'private',
    name: 'Private Dining Room',
    description: 'Exclusive space for special occasions and business dinners',
    image: 'https://images.pexels.com/photos/2789352/pexels-photo-2789352.jpeg?auto=compress&cs=tinysrgb&w=800',
    capacity: 20,
    cuisine: 'Custom Menu',
    hours: 'By Reservation Only',
    priceRange: '$$$$'
  }
];

const timeSlots = [
  '12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

const occasions = [
  'Casual Dining', 'Birthday', 'Anniversary', 'Date Night', 'Business Meeting', 'Family Gathering', 'Other Celebration'
];

export function DiningPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [reservation, setReservation] = useState({
    dining_area: '',
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

  const handleReserve = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Navigate to booking page with state
      navigate('/booking', {
        state: {
          type: 'table',
          ...reservation,
          deposit_amount: 500
        }
      });
    } catch (error) {
      console.error('Reservation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = reservation.date && reservation.time && reservation.guests &&
    reservation.guest_name && reservation.guest_email && reservation.guest_phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <SafeImage
          src="https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Fine Dining"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed className="w-8 h-8 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Dining Experience</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">Reserve Your Table</h1>
          <p className="text-xl text-slate-300 max-w-2xl">From traditional Ethiopian cuisine to international flavors, experience dining at its finest.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Dining Areas */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Select Dining Area</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {diningAreas.map(area => (
                <DiningAreaCard
                  key={area.id}
                  area={area}
                  isSelected={selectedArea === area.id}
                  onSelect={() => {
                    setSelectedArea(area.id);
                    setReservation({ ...reservation, dining_area: area.name });
                  }}
                  onView={() => navigate(`/dining/${area.id}`)}
                />
              ))}
            </div>

            {/* Menu Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-emerald-500" /> Featured Dishes
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { name: 'Doro Wat', desc: 'Traditional spicy chicken stew', price: 'ETB 350' },
                  { name: 'Tibs', desc: 'Sautéed beef with spices', price: 'ETB 420' },
                  { name: 'Kitfo', desc: 'Ethiopian minced beef tartare', price: 'ETB 480' },
                ].map(dish => (
                  <div key={dish.name} className="bg-slate-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-slate-900">{dish.name}</h4>
                    <p className="text-sm text-slate-500">{dish.desc}</p>
                    <p className="text-emerald-600 font-medium mt-2">{dish.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reservation Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 rounded-t-2xl text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Make a Reservation
                </h3>
                <p className="text-emerald-100 text-sm mt-1">Book your table in minutes</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Contact Details */}
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Dietary requirements, seating preferences..."
                  />
                </div>

                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <p className="text-sm text-emerald-700">
                    <strong>Note:</strong> A deposit of ETB 500 is required to confirm your reservation.
                  </p>
                </div>

                <button
                  onClick={handleReserve}
                  disabled={!isFormValid || loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reserve Table <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiningAreaCard({ area, isSelected, onSelect, onView }: {
  area: typeof diningAreas[0];
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:shadow-md border border-slate-100'
      }`}
    >
      <div className="relative h-32 overflow-hidden">
        <SafeImage src={area.image} alt={area.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        <div className="absolute bottom-2 left-3">
          <h3 className="font-semibold text-white">{area.name}</h3>
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full">
            <Sparkles className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-slate-500 mb-2">{area.cuisine}</p>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {area.hours}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {area.capacity} seats</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-emerald-600 font-medium">{area.priceRange}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1"
          >
            Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiningPage;
