import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, Users, Zap } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  class_type: string;
  instructor_id: string;
  room_name: string;
  capacity: number;
  duration_minutes: number;
  difficulty_level: string;
  price: number;
  schedule: any;
}

export default function ClassBooking() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    fetchClasses();
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      const { data } = await supabase
        .from('fitness_classes')
        .select('*')
        .order('name');

      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const { data } = await supabase
        .from('class_bookings')
        .select('*, fitness_classes(name, schedule)')
        .eq('user_id', user?.id)
        .eq('status', 'Confirmed');

      setMyBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const bookClass = async (classId: string) => {
    try {
      const bookingDate = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('class_bookings')
        .insert([
          {
            user_id: user?.id,
            class_id: classId,
            booking_date: bookingDate,
            status: 'Confirmed',
          },
        ]);

      if (error) throw error;

      alert('Class booked successfully!');
      fetchMyBookings();
    } catch (error) {
      console.error('Error booking class:', error);
      alert('Failed to book class. Please try again.');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('class_bookings')
        .update({ status: 'Cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      alert('Booking cancelled');
      fetchMyBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const filteredClasses = classes.filter((c) =>
    selectedDifficulty === 'all' || c.difficulty_level === selectedDifficulty
  );

  if (loading) {
    return <div className="text-center text-slate-400 py-12">Loading classes...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Available Classes</h2>

        <div className="flex gap-3 mb-8">
          {['all', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedDifficulty(level)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                selectedDifficulty === level
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {level === 'all' ? 'All Levels' : level}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-lg p-6 hover:border-amber-400/50 transition-all hover:shadow-lg hover:shadow-amber-400/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{cls.name}</h3>
                  <p className="text-amber-400 text-sm mt-1">{cls.class_type}</p>
                </div>
                <span className="px-3 py-1 bg-slate-600 text-slate-200 text-xs rounded-full">
                  {cls.difficulty_level}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{cls.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">Max {cls.capacity} people</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">${cls.price.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => bookClass(cls.id)}
                className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold py-2 rounded-lg transition-all"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      </div>

      {myBookings.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">My Bookings</h2>

          <div className="space-y-4">
            {myBookings.map((booking) => (
              <div key={booking.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold">{booking.fitness_classes?.name}</h3>
                  <p className="text-sm text-slate-400">{booking.booking_date}</p>
                </div>
                <button
                  onClick={() => cancelBooking(booking.id)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
