import { useState, useEffect } from 'react';
import { supabase, Reservation, Guest, Room } from '../lib/supabase';
import { Plus, Search, Calendar, CheckCircle, XCircle, Clock, DoorOpen, DoorClosed } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ReservationManagement() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    guest_id: '',
    room_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    status: 'Pending' as const,
    special_requests: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reservationsRes, guestsRes, roomsRes] = await Promise.all([
        supabase
          .from('reservations')
          .select('*, guests(*), rooms(*)')
          .order('created_at', { ascending: false }),
        supabase.from('guests').select('*').order('first_name', { ascending: true }),
        supabase.from('rooms').select('*').order('room_number', { ascending: true }),
      ]);

      if (reservationsRes.error) throw reservationsRes.error;
      if (guestsRes.error) throw guestsRes.error;
      if (roomsRes.error) throw roomsRes.error;

      setReservations(reservationsRes.data || []);
      setGuests(guestsRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingReservation) {
        const { error } = await supabase
          .from('reservations')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingReservation.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('reservations').insert([
          {
            ...formData,
            created_by: user?.id,
          },
        ]);
        if (error) throw error;
      }

      setShowModal(false);
      setEditingReservation(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert('Error saving reservation. Please try again.');
    }
  };

  const handleCheckIn = async (reservation: Reservation) => {
    try {
      const { error: resError } = await supabase
        .from('reservations')
        .update({
          status: 'Checked-In',
          actual_check_in: new Date().toISOString(),
        })
        .eq('id', reservation.id);

      if (resError) throw resError;

      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'Occupied' })
        .eq('id', reservation.room_id);

      if (roomError) throw roomError;

      fetchData();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Error during check-in. Please try again.');
    }
  };

  const handleCheckOut = async (reservation: Reservation) => {
    try {
      const { error: resError } = await supabase
        .from('reservations')
        .update({
          status: 'Checked-Out',
          actual_check_out: new Date().toISOString(),
        })
        .eq('id', reservation.id);

      if (resError) throw resError;

      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'Cleaning' })
        .eq('id', reservation.room_id);

      if (roomError) throw roomError;

      fetchData();
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Error during check-out. Please try again.');
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'Cancelled' })
        .eq('id', reservationId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error cancelling reservation. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      guest_id: '',
      room_id: '',
      check_in_date: '',
      check_out_date: '',
      number_of_guests: 1,
      status: 'Pending',
      special_requests: '',
    });
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setFormData({
      guest_id: reservation.guest_id,
      room_id: reservation.room_id,
      check_in_date: reservation.check_in_date,
      check_out_date: reservation.check_out_date,
      number_of_guests: reservation.number_of_guests,
      status: reservation.status as any,
      special_requests: reservation.special_requests || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReservation(null);
    resetForm();
  };

  const filteredReservations = reservations.filter((reservation) => {
    const guest = reservation.guests;
    const room = reservation.rooms;
    const matchesSearch =
      guest?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room?.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'Checked-In':
        return 'bg-green-100 text-green-800';
      case 'Checked-Out':
        return 'bg-slate-100 text-slate-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      case 'Confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'Checked-In':
        return <DoorOpen className="w-4 h-4" />;
      case 'Checked-Out':
        return <DoorClosed className="w-4 h-4" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading reservations...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reservation Management</h2>
          <p className="text-slate-600 mt-1">Manage bookings and check-ins</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition"
        >
          <Plus className="w-5 h-5" />
          New Reservation
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by guest name or room number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Checked-In">Checked-In</option>
          <option value="Checked-Out">Checked-Out</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredReservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {reservation.guests?.first_name} {reservation.guests?.last_name}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                    {getStatusIcon(reservation.status)}
                    {reservation.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-600">
                  <div>
                    <p className="text-slate-500 mb-1">Room</p>
                    <p className="font-medium text-slate-900">
                      {reservation.rooms?.room_number} - {reservation.rooms?.room_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Check-in</p>
                    <p className="font-medium text-slate-900">
                      {new Date(reservation.check_in_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Check-out</p>
                    <p className="font-medium text-slate-900">
                      {new Date(reservation.check_out_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Guests</p>
                    <p className="font-medium text-slate-900">{reservation.number_of_guests}</p>
                  </div>
                </div>

                {reservation.special_requests && (
                  <div className="mt-3 text-sm">
                    <p className="text-slate-500">Special Requests:</p>
                    <p className="text-slate-700">{reservation.special_requests}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {(reservation.status === 'Pending' || reservation.status === 'Confirmed') && (
                  <>
                    <button
                      onClick={() => handleCheckIn(reservation)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      Check-In
                    </button>
                    <button
                      onClick={() => handleEdit(reservation)}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {reservation.status === 'Checked-In' && (
                  <button
                    onClick={() => handleCheckOut(reservation)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm"
                  >
                    Check-Out
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReservations.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          {searchTerm || filterStatus !== 'all'
            ? 'No reservations found matching your filters.'
            : 'No reservations yet. Create your first reservation!'}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">
                {editingReservation ? 'Edit Reservation' : 'New Reservation'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Guest *</label>
                  <select
                    required
                    value={formData.guest_id}
                    onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  >
                    <option value="">Select a guest</option>
                    {guests.map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.first_name} {guest.last_name} - {guest.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Room *</label>
                  <select
                    required
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  >
                    <option value="">Select a room</option>
                    {rooms
                      .filter((room) => room.status === 'Available' || room.id === editingReservation?.room_id)
                      .map((room) => (
                        <option key={room.id} value={room.id}>
                          Room {room.room_number} - {room.room_type} (${room.price_per_night}/night)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Check-in Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Check-out Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.check_out_date}
                    onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Number of Guests *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.number_of_guests}
                    onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'Pending' | 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled',
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Special Requests</label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  rows={3}
                  placeholder="Any special requirements or requests..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  {editingReservation ? 'Update Reservation' : 'Create Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
