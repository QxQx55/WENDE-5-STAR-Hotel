import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Wine, Music, Calendar, Clock, Users, Star, ArrowRight,
  Sparkles, Loader2, Moon, Mic, Martini
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

const bars = [
  {
    id: 'lounge',
    name: 'Sky Lounge Bar',
    description: 'Rooftop bar with panoramic city views and signature cocktails',
    image: 'https://images.pexels.com/photos/3014827/pexels-photo-3014827.jpeg?auto=compress&cs=tinysrgb&w=800',
    hours: '5:00 PM - 1:00 AM',
    vibe: 'Sophisticated & Relaxed',
    capacity: 60,
    minSpend: 500,
    features: ['Premium spirits', 'Craft cocktails', 'Live DJ', 'Outdoor seating']
  },
  {
    id: 'sports',
    name: 'Sports Bar',
    description: 'Watch the game with friends, pub snacks, and cold beers',
    image: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800',
    hours: '12:00 PM - 12:00 AM',
    vibe: 'Lively & Casual',
    capacity: 40,
    minSpend: 300,
    features: ['Big screens', 'Sports packages', 'Pub menu', 'Pool table']
  },
  {
    id: 'jazz',
    name: 'Jazz & Blues Club',
    description: 'Intimate venue with live performances and curated wine list',
    image: 'https://images.pexels.com/photos/2114366/pexels-photo-2114366.jpeg?auto=compress&cs=tinysrgb&w=800',
    hours: '7:00 PM - 2:00 AM',
    vibe: 'Intimate & Cool',
    capacity: 30,
    minSpend: 800,
    features: ['Live jazz', 'Wine cellar', 'Cigar lounge', 'VIP booths']
  },
  {
    id: 'pool',
    name: 'Poolside Bar',
    description: 'Tropical cocktails and light bites by the pool',
    image: 'https://images.pexels.com/photos/165903/pexels-photo-165903.jpeg?auto=compress&cs=tinysrgb&w=800',
    hours: '10:00 AM - 10:00 PM',
    vibe: 'Relaxed & Sunny',
    capacity: 50,
    minSpend: 400,
    features: ['Swimming pool', 'Tropical drinks', 'Shaded cabanas', 'Snack menu']
  }
];

const reservationTypes = [
  { id: 'table', name: 'Table Reservation', desc: 'Reserve a table for your group' },
  { id: 'vip', name: 'VIP Booth', desc: 'Exclusive private seating with bottle service' },
  { id: 'event', name: 'Private Event', desc: 'Book entire bar area for parties/events' }
];

const timeSlots = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export function BarsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedBar, setSelectedBar] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('table');
  const [loading, setLoading] = useState(false);

  const [reservation, setReservation] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    date: '',
    time: '',
    party_size: 4,
    special_requests: '',
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const bar = bars.find(b => b.id === selectedBar);
  const resType = reservationTypes.find(t => t.id === selectedType);
  const deposit = selectedType === 'vip' ? 2000 : selectedType === 'event' ? 5000 : 500;

  const handleSubmit = async () => {
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
          number_of_guests: reservation.party_size,
          special_requests: `${bar?.name} | ${resType?.name}\n${reservation.special_requests}`,
          deposit_amount: deposit,
          occasion: selectedType,
        })
        .select()
        .single();

      if (error) throw error;

      navigate('/booking', {
        state: {
          type: 'bar',
          reservationId: data.id,
          amount: deposit,
          barName: bar?.name
        }
      });
    } catch (error) {
      console.error('Bar reservation error:', error);
      alert('Failed to make reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = selectedBar && reservation.date && reservation.time &&
    reservation.guest_name && reservation.guest_email && reservation.guest_phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-900 to-slate-900 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[350px] overflow-hidden">
        <SafeImage
          src="https://images.pexels.com/photo-3014827/pexels-photo-3014827.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Bars"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Martini className="w-8 h-8 text-amber-400" />
            <span className="text-amber-400 font-medium">Bars & Nightlife</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">Bars & Lounges</h1>
          <p className="text-xl text-slate-300 max-w-2xl">From sophisticated cocktails to lively sports action, find your perfect evening spot.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Bar Selection */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white">Choose Your Venue</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {bars.map(barItem => (
                <BarCard
                  key={barItem.id}
                  bar={barItem}
                  isSelected={selectedBar === barItem.id}
                  onSelect={() => setSelectedBar(barItem.id)}
                />
              ))}
            </div>

            {/* Reservation Type */}
            {selectedBar && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Reservation Type</h3>
                <div className="grid grid-cols-3 gap-3">
                  {reservationTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-lg text-left transition ${
                        selectedType === type.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <p className="font-semibold">{type.name}</p>
                      <p className="text-xs opacity-80">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Drinks */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Wine className="w-5 h-5 text-amber-400" /> Signature Cocktails
              </h3>
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { name: 'Ethiopian Sunrise', price: 'ETB 280', desc: 'Tej & citrus' },
                  { name: 'Addis Mule', price: 'ETB 250', desc: 'Ginger & spice' },
                  { name: 'Blue Nile', price: 'ETB 320', desc: 'Premium gin' },
                  { name: 'Queen of Sheba', price: 'ETB 450', desc: 'Champagne base' },
                ].map(drink => (
                  <div key={drink.name} className="bg-slate-700 rounded-lg p-3 text-center">
                    <p className="font-semibold text-white text-sm">{drink.name}</p>
                    <p className="text-xs text-slate-400">{drink.desc}</p>
                    <p className="text-amber-400 font-medium mt-2">{drink.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reservation Form */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 sticky top-24">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-2xl text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Moon className="w-5 h-5" /> Reserve Your Night
                </h3>
                <p className="text-amber-100 text-sm mt-1">Book ahead for the best experience</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={reservation.guest_name}
                    onChange={e => setReservation({ ...reservation, guest_name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Email *</label>
                    <input
                      type="email"
                      value={reservation.guest_email}
                      onChange={e => setReservation({ ...reservation, guest_email: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Phone *</label>
                    <input
                      type="tel"
                      value={reservation.guest_phone}
                      onChange={e => setReservation({ ...reservation, guest_phone: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500"
                      placeholder="+251..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Date *</label>
                    <input
                      type="date"
                      value={reservation.date}
                      onChange={e => setReservation({ ...reservation, date: e.target.value })}
                      min={minDate}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Time *</label>
                    <select
                      value={reservation.time}
                      onChange={e => setReservation({ ...reservation, time: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Party Size</label>
                  <select
                    value={reservation.party_size}
                    onChange={e => setReservation({ ...reservation, party_size: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-amber-500"
                  >
                    {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n} guests</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Special Requests</label>
                  <textarea
                    value={reservation.special_requests}
                    onChange={e => setReservation({ ...reservation, special_requests: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500"
                    placeholder="Birthday celebration, bottle service requests..."
                  />
                </div>

                {/* Deposit Info */}
                <div className="bg-amber-500/20 rounded-lg p-3 border border-amber-500/30">
                  <p className="text-sm text-amber-200">
                    <strong>Deposit Required:</strong> ETB {deposit.toLocaleString()} (refundable)
                  </p>
                  <p className="text-xs text-amber-300/70 mt-1">Min. spend: ETB {bar?.minSpend || 500}/person</p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reserve Now <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BarCard({ bar, isSelected, onSelect }: {
  bar: typeof bars[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-xl overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-amber-500' : 'hover:ring-1 hover:ring-slate-500'
      }`}
    >
      <div className="relative h-40 overflow-hidden">
        <SafeImage src={bar.image} alt={bar.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white">{bar.name}</h3>
          <p className="text-xs text-slate-300">{bar.vibe}</p>
        </div>
        {isSelected && (
          <div className="absolute top-3 right-3 bg-amber-500 rounded-full p-1">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <div className="bg-slate-800 p-4">
        <p className="text-sm text-slate-400 mb-2">{bar.description}</p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {bar.hours}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {bar.capacity} max</span>
        </div>
      </div>
    </div>
  );
}

export default BarsPage;
