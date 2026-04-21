import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Thermometer, Wind, Droplet, Zap } from 'lucide-react';

const RECOVERY_ZONES = [
  {
    id: 'Sauna',
    name: 'Premium Sauna',
    description: 'Traditional Finnish sauna for detoxification and relaxation',
    icon: Thermometer,
    color: 'from-red-500 to-orange-500',
    accentColor: 'red',
  },
  {
    id: 'Steam Room',
    name: 'Steam Room',
    description: 'Humid steam therapy for respiratory health',
    icon: Wind,
    color: 'from-blue-500 to-cyan-500',
    accentColor: 'blue',
  },
  {
    id: 'Ice Bath',
    name: 'Cryotherapy Ice Bath',
    description: 'Cold immersion for muscle recovery and circulation',
    icon: Droplet,
    color: 'from-cyan-500 to-blue-500',
    accentColor: 'cyan',
  },
  {
    id: 'Relaxation Pod',
    name: 'Relaxation Pod',
    description: 'Sensory deprivation pod with meditation support',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    accentColor: 'purple',
  },
];

export default function RecoveryZone() {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    zoneType: '',
    date: '',
    time: '',
    duration: 30,
  });

  useEffect(() => {
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  const fetchMyBookings = async () => {
    try {
      const { data } = await supabase
        .from('recovery_zone_bookings')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'Confirmed')
        .order('booking_date', { ascending: false });

      setMyBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const bookZone = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingForm.zoneType || !bookingForm.date || !bookingForm.time) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('recovery_zone_bookings')
        .insert([
          {
            user_id: user?.id,
            zone_type: bookingForm.zoneType,
            booking_date: bookingForm.date,
            start_time: bookingForm.time,
            duration_minutes: bookingForm.duration,
            status: 'Confirmed',
          },
        ]);

      if (error) throw error;

      alert('Recovery zone booked successfully!');
      setBookingForm({ zoneType: '', date: '', time: '', duration: 30 });
      fetchMyBookings();
    } catch (error) {
      console.error('Error booking zone:', error);
      alert('Failed to book recovery zone. Please try again.');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('recovery_zone_bookings')
        .update({ status: 'Cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      alert('Booking cancelled');
      fetchMyBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading recovery zones...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-white mb-6">Recovery Zones</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RECOVERY_ZONES.map((zone) => {
              const Icon = zone.icon;
              return (
                <div
                  key={zone.id}
                  className={`bg-gradient-to-br ${zone.color} p-6 rounded-xl border border-white/10 hover:border-white/30 transition-all hover:shadow-lg hover:shadow-white/10 cursor-pointer group`}
                  onClick={() => setBookingForm({ ...bookingForm, zoneType: zone.id })}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30 transition">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{zone.name}</h3>
                    </div>
                  </div>

                  <p className="text-white/80 text-sm leading-relaxed">{zone.description}</p>

                  <button className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2 rounded-lg transition">
                    Book Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 h-fit">
          <h3 className="text-xl font-bold text-white mb-6">Quick Book</h3>

          <form onSubmit={bookZone} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Zone</label>
              <select
                value={bookingForm.zoneType}
                onChange={(e) => setBookingForm({ ...bookingForm, zoneType: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-amber-400 outline-none"
              >
                <option value="">Select a zone</option>
                {RECOVERY_ZONES.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
              <input
                type="date"
                required
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
              <input
                type="time"
                required
                value={bookingForm.time}
                onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Duration (minutes)</label>
              <input
                type="number"
                min="15"
                max="120"
                value={bookingForm.duration}
                onChange={(e) => setBookingForm({ ...bookingForm, duration: parseInt(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-amber-400 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold py-2 rounded-lg hover:from-amber-500 hover:to-orange-600 transition"
            >
              Book Zone
            </button>
          </form>
        </div>
      </div>

      {myBookings.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">My Bookings</h2>

          <div className="grid gap-4">
            {myBookings.map((booking) => {
              const zone = RECOVERY_ZONES.find((z) => z.id === booking.zone_type);
              return (
                <div
                  key={booking.id}
                  className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-white font-semibold">{zone?.name}</h3>
                    <p className="text-sm text-slate-400">
                      {booking.booking_date} at {booking.start_time} ({booking.duration_minutes} mins)
                    </p>
                  </div>

                  <button
                    onClick={() => cancelBooking(booking.id)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
