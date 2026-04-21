import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, Sparkles } from 'lucide-react';

interface SpaService {
  id: string;
  name: string;
  description: string;
  service_category: string;
  duration_minutes: number;
  price: number;
  benefits: string[];
}

export default function SpaBooking() {
  const { user } = useAuth();
  const [services, setServices] = useState<SpaService[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [bookingForm, setBookingForm] = useState({
    serviceId: '',
    date: '',
    time: '',
    specialRequests: '',
  });

  useEffect(() => {
    fetchServices();
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      const { data } = await supabase
        .from('spa_services')
        .select('*')
        .order('service_category');

      setServices(data || []);
    } catch (error) {
      console.error('Error fetching spa services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const { data } = await supabase
        .from('spa_bookings')
        .select('*, spa_services(name)')
        .eq('user_id', user?.id)
        .in('status', ['Confirmed', 'Pending']);

      setMyBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const bookService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingForm.serviceId || !bookingForm.date || !bookingForm.time) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('spa_bookings')
        .insert([
          {
            user_id: user?.id,
            service_id: bookingForm.serviceId,
            booking_date: bookingForm.date,
            booking_time: bookingForm.time,
            special_requests: bookingForm.specialRequests,
            status: 'Pending',
          },
        ]);

      if (error) throw error;

      alert('Spa booking requested! Our team will confirm shortly.');
      setBookingForm({ serviceId: '', date: '', time: '', specialRequests: '' });
      fetchMyBookings();
    } catch (error) {
      console.error('Error booking spa service:', error);
      alert('Failed to book spa service. Please try again.');
    }
  };

  const categories = ['all', ...new Set(services.map((s) => s.service_category))];
  const filteredServices = services.filter(
    (s) => selectedCategory === 'all' || s.service_category === selectedCategory
  );

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading spa services...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Premium Spa Services</h2>

            <div className="flex gap-3 mb-8 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    selectedCategory === category
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {category === 'all' ? 'All Services' : category}
                </button>
              ))}
            </div>

            <div className="grid gap-6">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-lg p-6 hover:border-green-400/50 transition-all hover:shadow-lg hover:shadow-green-400/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{service.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">{service.description}</p>
                    </div>
                    <span className="text-green-400 font-bold text-lg">${service.price.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-600">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{service.duration_minutes} mins</span>
                    </div>
                  </div>

                  {service.benefits && service.benefits.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-2">Benefits:</p>
                      <div className="flex flex-wrap gap-2">
                        {service.benefits.map((benefit, idx) => (
                          <span key={idx} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setBookingForm({ ...bookingForm, serviceId: service.id })}
                    className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold py-2 rounded-lg transition-all"
                  >
                    Book Service
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 h-fit">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-400" />
            Book Service
          </h3>

          {bookingForm.serviceId && (
            <form onSubmit={bookService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-green-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                <input
                  type="time"
                  required
                  value={bookingForm.time}
                  onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-green-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Special Requests</label>
                <textarea
                  value={bookingForm.specialRequests}
                  onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                  placeholder="Any special requests or allergies..."
                  rows={3}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-green-400 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold py-2 rounded-lg hover:from-green-500 hover:to-emerald-600 transition"
              >
                Confirm Booking
              </button>
            </form>
          )}

          {!bookingForm.serviceId && (
            <p className="text-slate-400 text-sm text-center py-8">Select a service to book</p>
          )}
        </div>
      </div>

      {myBookings.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">My Spa Bookings</h2>

          <div className="grid gap-4">
            {myBookings.map((booking) => (
              <div key={booking.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold">{booking.spa_services?.name}</h3>
                    <p className="text-sm text-slate-400">
                      {booking.booking_date} at {booking.booking_time}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 capitalize">Status: {booking.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
