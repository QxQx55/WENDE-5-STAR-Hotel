import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Bed, Calendar, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';

type DashboardStats = {
  totalGuests: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  activeReservations: number;
  checkInsToday: number;
  checkOutsToday: number;
  totalRevenue: number;
  pendingPayments: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalGuests: 0,
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    activeReservations: 0,
    checkInsToday: 0,
    checkOutsToday: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [guestsRes, roomsRes, reservationsRes, invoicesRes, paymentsRes] = await Promise.all([
        supabase.from('guests').select('id', { count: 'exact' }),
        supabase.from('rooms').select('id, status', { count: 'exact' }),
        supabase.from('reservations').select('*', { count: 'exact' }),
        supabase.from('invoices').select('total_amount, payment_status'),
        supabase.from('payments').select('amount'),
      ]);

      const totalGuests = guestsRes.count || 0;
      const totalRooms = roomsRes.count || 0;
      const availableRooms = roomsRes.data?.filter((r) => r.status === 'Available').length || 0;
      const occupiedRooms = roomsRes.data?.filter((r) => r.status === 'Occupied').length || 0;

      const reservations = reservationsRes.data || [];
      const activeReservations = reservations.filter((r) =>
        ['Pending', 'Confirmed', 'Checked-In'].includes(r.status)
      ).length;

      const checkInsToday = reservations.filter(
        (r) => r.check_in_date === today && r.status === 'Confirmed'
      ).length;

      const checkOutsToday = reservations.filter(
        (r) => r.check_out_date === today && r.status === 'Checked-In'
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
        checkInsToday,
        checkOutsToday,
        totalRevenue,
        pendingPayments,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const { totalGuests, totalRooms, availableRooms, occupiedRooms, activeReservations, checkInsToday, checkOutsToday, totalRevenue, pendingPayments } = stats;
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-600 mt-1">Overview of your hotel operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{totalGuests}</h3>
          <p className="text-slate-600 text-sm mt-1">Total Guests</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Bed className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{availableRooms}/{totalRooms}</h3>
          <p className="text-slate-600 text-sm mt-1">Available Rooms</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{activeReservations}</h3>
          <p className="text-slate-600 text-sm mt-1">Active Reservations</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</h3>
          <p className="text-slate-600 text-sm mt-1">Total Revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-slate-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-semibold text-slate-900">Occupancy Rate</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{occupancyRate}%</span>
            <span className="text-sm text-slate-600">of rooms occupied</span>
          </div>
          <div className="mt-4 bg-slate-100 rounded-full h-2">
            <div
              className="bg-slate-900 h-2 rounded-full transition-all"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Today's Check-ins</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{checkInsToday}</span>
            <span className="text-sm text-slate-600">guests arriving</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Today's Check-outs</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{checkOutsToday}</span>
            <span className="text-sm text-slate-600">guests departing</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Room Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Available</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(availableRooms / totalRooms) * 100}%` }}
                  />
                </div>
                <span className="font-medium text-slate-900 w-12 text-right">{availableRooms}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Occupied</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(occupiedRooms / totalRooms) * 100}%` }}
                  />
                </div>
                <span className="font-medium text-slate-900 w-12 text-right">{occupiedRooms}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Revenue</span>
              <span className="font-medium text-green-600">${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Pending Payments</span>
              <span className="font-medium text-red-600">${pendingPayments.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
