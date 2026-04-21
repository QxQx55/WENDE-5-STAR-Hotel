import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users, DollarSign, Star, Plus, X } from 'lucide-react';

type Booking = {
  id: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  status: string;
  special_requests: string | null;
};

type Room = {
  id: string;
  room_number: string;
  room_type: string;
  price_per_night: number;
  max_occupancy: number;
  status: string;
  description: string;
};

export default function CustomerDashboard() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingForm, setBookingForm] = useState({
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    special_requests: '',
  });

  useEffect(() => {
    fetchCustomerData();
  }, [profile?.id]);

  const fetchCustomerData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch customer bookings
      const bookingsResponse = await supabase
        .from('reservations')
        .select('*')
        .eq('created_by', profile.id)
        .order('check_in_date', { ascending: false });

      // Fetch available rooms
      const roomsResponse = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'Available')
        .order('room_type', { ascending: true });

      if (bookingsResponse.data) {
        setBookings(bookingsResponse.data);
      }

      if (roomsResponse.data) {
        setRooms(roomsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await supabase
        .from('reservations')
        .update({ status: 'Cancelled' })
        .eq('id', bookingId);

      fetchCustomerData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedRoom || !bookingForm.check_in_date || !bookingForm.check_out_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Create guest record first if needed
      const guestResponse = await supabase
        .from('guests')
        .insert([
          {
            first_name: profile?.full_name?.split(' ')[0] || '',
            last_name: profile?.full_name?.split(' ')[1] || '',
            email: profile?.email,
            phone: profile?.phone,
          },
        ])
        .select();

      const guestId = guestResponse.data?.[0]?.id;

      if (!guestId) throw new Error('Failed to create guest record');

      // Create booking
      await supabase
        .from('reservations')
        .insert([
          {
            guest_id: guestId,
            room_id: selectedRoom.id,
            check_in_date: bookingForm.check_in_date,
            check_out_date: bookingForm.check_out_date,
            number_of_guests: bookingForm.number_of_guests,
            special_requests: bookingForm.special_requests,
            status: 'Pending',
            created_by: profile?.id,
          },
        ]);

      // Reset form
      setShowNewBooking(false);
      setSelectedRoom(null);
      setBookingForm({
        check_in_date: '',
        check_out_date: '',
        number_of_guests: 1,
        special_requests: '',
      });

      fetchCustomerData();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const upcomingBookings = bookings.filter((b) => new Date(b.check_out_date) > new Date());
  const pastBookings = bookings.filter((b) => new Date(b.check_out_date) <= new Date());

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Welcome, {profile?.full_name}</h2>
        <p className="text-slate-600 mt-2">Manage your bookings and explore rooms</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-200 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-blue-900">{upcomingBookings.length}</h3>
          <p className="text-blue-700 text-sm mt-1">Upcoming Bookings</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-200 p-3 rounded-lg">
              <MapPin className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-green-900">{rooms.length}</h3>
          <p className="text-green-700 text-sm mt-1">Available Rooms</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-200 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-700" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-purple-900">{pastBookings.length}</h3>
          <p className="text-purple-700 text-sm mt-1">Past Stays</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Your Bookings</h3>

          {upcomingBookings.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No upcoming bookings</p>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">Booking #{booking.id.slice(0, 8)}</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {booking.check_in_date} to {booking.check_out_date}
                      </p>
                      <p className="text-sm text-slate-600">
                        <Users className="w-4 h-4 inline mr-1" />
                        {booking.number_of_guests} guest{booking.number_of_guests > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded ${
                        booking.status === 'Confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {booking.special_requests && (
                    <p className="text-sm text-slate-600 mb-3 italic">
                      Special requests: {booking.special_requests}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {booking.status === 'Pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Book a Room */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <button
            onClick={() => setShowNewBooking(!showNewBooking)}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-4"
          >
            <Plus className="w-4 h-4" />
            Book a Room
          </button>

          {showNewBooking ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={bookingForm.check_in_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, check_in_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={bookingForm.check_out_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, check_out_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Number of Guests
                </label>
                <input
                  type="number"
                  value={bookingForm.number_of_guests}
                  onChange={(e) => setBookingForm({ ...bookingForm, number_of_guests: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Special Requests
                </label>
                <textarea
                  value={bookingForm.special_requests}
                  onChange={(e) => setBookingForm({ ...bookingForm, special_requests: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special requests?"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Select Room
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full text-left p-2 rounded border ${
                        selectedRoom?.id === room.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-medium text-slate-900">{room.room_type}</p>
                      <p className="text-sm text-slate-600">${room.price_per_night}/night</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateBooking}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Confirm Booking
                </button>
                <button
                  onClick={() => {
                    setShowNewBooking(false);
                    setSelectedRoom(null);
                  }}
                  className="flex-1 bg-slate-300 text-slate-900 py-2 rounded-lg hover:bg-slate-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.slice(0, 3).map((room) => (
                <div key={room.id} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-slate-900">{room.room_type}</h4>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                  <p className="text-sm text-slate-600">
                    <DollarSign className="w-3 h-3 inline" />
                    {room.price_per_night}/night
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div className="mt-8 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Past Stays</h3>
          <div className="space-y-3">
            {pastBookings.map((booking) => (
              <div key={booking.id} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-900">
                      {booking.check_in_date} - {booking.check_out_date}
                    </p>
                    <p className="text-sm text-slate-600">
                      {booking.number_of_guests} guest{booking.number_of_guests > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded bg-slate-200 text-slate-700">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
