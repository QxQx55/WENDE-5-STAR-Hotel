import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Bed, Calendar, DollarSign, TrendingUp, AlertCircle, Plus, CreditCard as Edit2, Trash2 } from 'lucide-react';

type AdminStats = {
  totalGuests: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  activeReservations: number;
  totalRevenue: number;
  pendingPayments: number;
  totalUsers: number;
};

type Room = {
  id: string;
  room_number: string;
  room_type: string;
  status: string;
  price_per_night: number;
  max_occupancy: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalGuests: 0,
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    activeReservations: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalUsers: 0,
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_type: 'Standard',
    price_per_night: 0,
    max_occupancy: 2,
    floor: 1,
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [guestsRes, roomsRes, reservationsRes, invoicesRes, paymentsRes, usersRes] = await Promise.all([
        supabase.from('guests').select('id', { count: 'exact' }),
        supabase.from('rooms').select('*'),
        supabase.from('reservations').select('*', { count: 'exact' }),
        supabase.from('invoices').select('total_amount, payment_status'),
        supabase.from('payments').select('amount'),
        supabase.from('profiles').select('id', { count: 'exact' }),
      ]);

      const totalGuests = guestsRes.count || 0;
      const totalUsers = usersRes.count || 0;
      const totalRooms = roomsRes.data?.length || 0;
      const availableRooms = roomsRes.data?.filter((r) => r.status === 'Available').length || 0;
      const occupiedRooms = roomsRes.data?.filter((r) => r.status === 'Occupied').length || 0;

      const reservations = reservationsRes.data || [];
      const activeReservations = reservations.filter((r) =>
        ['Pending', 'Confirmed', 'Checked-In'].includes(r.status)
      ).length;

      const invoices = invoicesRes.data || [];
      const totalRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + p.amount, 0);
      const pendingPayments = invoices
        .filter((inv) => inv.payment_status !== 'Paid')
        .reduce((sum, inv) => sum + inv.total_amount, 0);

      setStats({
        totalGuests,
        totalRooms,
        availableRooms,
        occupiedRooms,
        activeReservations,
        totalRevenue,
        pendingPayments,
        totalUsers,
      });

      if (roomsRes.data) {
        setRooms(roomsRes.data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    try {
      const { error } = await supabase.from('rooms').insert([
        {
          ...newRoom,
          status: 'Available',
        },
      ]);

      if (error) throw error;

      setNewRoom({
        room_number: '',
        room_type: 'Standard',
        price_per_night: 0,
        max_occupancy: 2,
        floor: 1,
      });
      setShowRoomForm(false);
      fetchAdminData();
    } catch (error) {
      console.error('Error adding room:', error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await supabase.from('rooms').delete().eq('id', roomId);
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>;
  }

  const occupancyRate =
    stats.totalRooms > 0 ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Admin Dashboard</h2>
        <p className="text-slate-600 mt-2">Complete hotel management system</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-200 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-blue-900">{stats.totalUsers}</h3>
          <p className="text-blue-700 text-sm mt-1">Total Users</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-200 p-3 rounded-lg">
              <Bed className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-green-900">
            {stats.availableRooms}/{stats.totalRooms}
          </h3>
          <p className="text-green-700 text-sm mt-1">Available Rooms</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-200 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-700" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-purple-900">{stats.activeReservations}</h3>
          <p className="text-purple-700 text-sm mt-1">Active Bookings</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-200 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-amber-700" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-amber-900">${stats.totalRevenue.toFixed(0)}</h3>
          <p className="text-amber-700 text-sm mt-1">Total Revenue</p>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-slate-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-semibold text-slate-900">Occupancy Rate</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-slate-900">{occupancyRate}%</span>
          </div>
          <div className="bg-slate-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Pending Payments</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-600">${stats.pendingPayments.toFixed(0)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Total Guests</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600">{stats.totalGuests}</span>
          </div>
        </div>
      </div>

      {/* Room Management */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Room Management</h3>
          <button
            onClick={() => setShowRoomForm(!showRoomForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>

        {showRoomForm && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Room Number"
                value={newRoom.room_number}
                onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newRoom.room_type}
                onChange={(e) => setNewRoom({ ...newRoom, room_type: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Standard</option>
                <option>Deluxe</option>
                <option>Suite</option>
                <option>Presidential</option>
              </select>
              <input
                type="number"
                placeholder="Price per night"
                value={newRoom.price_per_night}
                onChange={(e) => setNewRoom({ ...newRoom, price_per_night: parseFloat(e.target.value) })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max occupancy"
                value={newRoom.max_occupancy}
                onChange={(e) => setNewRoom({ ...newRoom, max_occupancy: parseInt(e.target.value) })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Floor"
                value={newRoom.floor}
                onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddRoom}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Save Room
              </button>
              <button
                onClick={() => setShowRoomForm(false)}
                className="bg-slate-300 text-slate-900 px-6 py-2 rounded-lg hover:bg-slate-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="pb-3 font-semibold text-slate-900">Room #</th>
                <th className="pb-3 font-semibold text-slate-900">Type</th>
                <th className="pb-3 font-semibold text-slate-900">Status</th>
                <th className="pb-3 font-semibold text-slate-900">Price</th>
                <th className="pb-3 font-semibold text-slate-900">Occupancy</th>
                <th className="pb-3 font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 text-slate-900 font-medium">{room.room_number}</td>
                  <td className="py-3 text-slate-600">{room.room_type}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        room.status === 'Available'
                          ? 'bg-green-100 text-green-700'
                          : room.status === 'Occupied'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {room.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-900">${room.price_per_night.toFixed(2)}</td>
                  <td className="py-3 text-slate-600">{room.max_occupancy}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-700">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
