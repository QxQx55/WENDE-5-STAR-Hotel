import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Car, Calendar, Clock, Shield, CreditCard, ArrowRight, Check,
  Loader2, MapPin, Zap, Valet
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

const parkingTypes = [
  {
    id: 'self',
    name: 'Self Parking',
    description: 'Convenient self-parking with 24/7 security surveillance',
    pricePerHour: 50,
    pricePerDay: 300,
    image: 'https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=600',
    features: ['Covered parking', 'Security cameras', 'Ground level access']
  },
  {
    id: 'valet',
    name: 'Valet Parking',
    description: 'Premium valet service with car wash and detailing options',
    pricePerHour: 100,
    pricePerDay: 600,
    image: 'https://images.pexels.com/photos/1704652/pexels-photo-1704652.jpeg?auto=compress&cs=tinysrgb&w=600',
    features: ['Valet service', 'Car wash available', 'Priority pickup']
  },
  {
    id: 'ev',
    name: 'EV Charging',
    description: 'Reserved spots with electric vehicle charging stations',
    pricePerHour: 70,
    pricePerDay: 400,
    image: 'https://images.pexels.com/photos/4570991/pexels-photo-4570991.jpeg?auto=compress&cs=tinysrgb&w=600',
    features: ['EV charging', 'Type 2 & CCS', 'Green energy']
  }
];

const availabilitySlots = [
  { time: '08:00 - 12:00', available: 15, total: 50 },
  { time: '12:00 - 16:00', available: 8, total: 50 },
  { time: '16:00 - 20:00', available: 3, total: 50 },
  { time: '20:00 - 00:00', available: 25, total: 50 },
];

export function ParkingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('self');
  const [loading, setLoading] = useState(false);

  const [booking, setBooking] = useState({
    parking_type: 'self',
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

  const parkingType = parkingTypes.find(p => p.id === selectedType);
  const hours = booking.is_daily ? 24 :
    (parseInt(booking.end_time) - parseInt(booking.start_time)) || 12;
  const totalAmount = booking.is_daily ? (parkingType?.pricePerDay || 0) : (parkingType?.pricePerHour || 0) * (hours / 10);

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Create parking reservation
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
          special_requests: `Parking: ${parkingType?.name} | Vehicle: ${booking.vehicle_plate} | Time: ${booking.start_time} - ${booking.end_time}`,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to payment
      navigate('/booking', {
        state: {
          type: 'parking',
          bookingId: data.id,
          amount: totalAmount,
          parkingType: parkingType?.name,
          vehiclePlate: booking.vehicle_plate
        }
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
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[350px] overflow-hidden">
        <SafeImage
          src="https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Parking"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-8 h-8 text-blue-400" />
            <span className="text-blue-400 font-medium">Parking Services</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">Reserve Your Spot</h1>
          <p className="text-xl text-slate-300 max-w-2xl">Secure parking with 24/7 security and multiple options for your convenience.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Parking Options */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Select Parking Type</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {parkingTypes.map(parking => (
                <div
                  key={parking.id}
                  onClick={() => {
                    setSelectedType(parking.id);
                    setBooking({ ...booking, parking_type: parking.id });
                  }}
                  className={`bg-white rounded-xl overflow-hidden cursor-pointer transition-all ${
                    selectedType === parking.id
                      ? 'ring-2 ring-blue-500 shadow-lg'
                      : 'border border-slate-100 hover:shadow-md'
                  }`}
                >
                  <div className="relative h-28 overflow-hidden">
                    <SafeImage src={parking.image} alt={parking.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                    <h3 className="absolute bottom-2 left-3 font-semibold text-white">{parking.name}</h3>
                    {selectedType === parking.id && (
                      <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-slate-500 mb-2">{parking.description}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-blue-600 font-medium text-sm">ETB {parking.pricePerHour}/hr</span>
                        <span className="text-slate-900 font-semibold text-sm ml-2">ETB {parking.pricePerDay}/day</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/parking/${parking.id}`); }}
                        className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                      >
                        Details <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Availability */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" /> Live Availability for Today
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availabilitySlots.map(slot => (
                  <div key={slot.time} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">{slot.time}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${slot.available > 10 ? 'bg-green-500' : slot.available > 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${(slot.available / slot.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{slot.available}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            {parkingType && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-semibold text-slate-900 mb-3">Included with {parkingType.name}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {parkingType.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-blue-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-2xl text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Reserve Parking
                </h3>
                <p className="text-blue-100 text-sm mt-1">Book your spot in advance</p>
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

                {/* Price Summary */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">{booking.is_daily ? 'Daily Rate' : 'Hourly Rate'}</span>
                    <span className="font-medium">ETB {booking.is_daily ? parkingType?.pricePerDay : parkingType?.pricePerHour}/hr</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-blue-600">ETB {totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Reserve Parking <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParkingPage;
