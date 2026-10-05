import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import {
  Bed, Users, Calendar, DollarSign, TrendingUp, TrendingDown,
  CheckCircle, AlertTriangle, Sparkles, Receipt,
  Activity, RefreshCw, ChevronRight, UserCheck, LogOut,
  Bell, Settings, Download
} from 'lucide-react';

interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  dirtyRooms: number;
  totalGuests: number;
  activeReservations: number;
  checkInsToday: number;
  checkOutsToday: number;
  totalRevenue: number;
  pendingPayments: number;
  occupancyRate: number;
  activeServiceBookings: number;
}

interface RecentActivity {
  id: string;
  type: 'reservation' | 'check_in' | 'check_out' | 'payment' | 'service' | 'room';
  message: string;
  timestamp: string;
  icon: React.ElementType;
  color: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface ServiceCategoryStats {
  category: string;
  count: number;
  revenue: number;
  color: string;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500',
  OCCUPIED: 'bg-blue-500',
  DIRTY: 'bg-red-500',
  CLEANING: 'bg-yellow-500',
  MAINTENANCE: 'bg-slate-500',
  RESERVED: 'bg-amber-500',
};

const CATEGORY_COLORS: Record<string, string> = {
  spa: 'bg-pink-500',
  dining: 'bg-amber-500',
  gym: 'bg-emerald-500',
  bars: 'bg-purple-500',
  parking: 'bg-blue-500',
  laundry: 'bg-cyan-500',
  room_service: 'bg-orange-500',
  activities: 'bg-rose-500',
  transport: 'bg-slate-500',
  other: 'bg-gray-500',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    dirtyRooms: 0,
    totalGuests: 0,
    activeReservations: 0,
    checkInsToday: 0,
    checkOutsToday: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    occupancyRate: 0,
    activeServiceBookings: 0,
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceCategoryStats[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadDashboardData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Parallel data fetching
      const [
        roomsRes,
        guestsRes,
        reservationsRes,
        paymentsRes,
        serviceBookingsRes,
        servicesRes,
      ] = await Promise.all([
        supabase.from('pms_rooms').select('id, status'),
        supabase.from('pms_guests').select('id', { count: 'exact' }),
        supabase.from('pms_reservations').select('id, status, check_in_date, check_out_date'),
        supabase.from('pms_payments').select('amount, created_at'),
        supabase.from('pms_service_bookings').select('id, status, total_amount'),
        supabase.from('pms_services').select('id, category'),
      ]);

      // Room stats
      const rooms = (roomsRes.data ?? []) as Array<{ id: string; status: string }>;
      const totalRooms = rooms.length;
      const availableRooms = rooms.filter((room: { status: string }) => room.status === 'AVAILABLE').length;
      const occupiedRooms = rooms.filter((room: { status: string }) => room.status === 'OCCUPIED').length;
      const dirtyRooms = rooms.filter((room: { status: string }) => room.status === 'DIRTY').length;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Guest stats
      const totalGuests = guestsRes.count || 0;

      // Reservation stats
      const reservations = (reservationsRes.data ?? []) as Array<{ status: string; check_in_date: string; check_out_date: string }>;
      const activeReservations = reservations.filter((reservation: { status: string }) =>
        ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(reservation.status)
      ).length;
      const checkInsToday = reservations.filter((reservation: { check_in_date: string; status: string }) =>
        reservation.check_in_date === today && ['CONFIRMED', 'PENDING'].includes(reservation.status)
      ).length;
      const checkOutsToday = reservations.filter((reservation: { check_out_date: string; status: string }) =>
        reservation.check_out_date === today && reservation.status === 'CHECKED_IN'
      ).length;

      // Payment stats
      const payments = (paymentsRes.data ?? []) as Array<{ amount: number; created_at?: string }>;
      const totalRevenue = payments.reduce((sum: number, payment: { amount: number }) => sum + (payment.amount || 0), 0);
      const pendingPayments = payments.filter((payment: { amount: number }) => payment.amount > 0).reduce((sum: number, payment: { amount: number }) => sum + (payment.amount || 0), 0);

      // Service booking stats
      const serviceBookings = (serviceBookingsRes.data ?? []) as Array<{ status: string; total_amount?: number; service_id?: string }>;
      const activeServiceBookings = serviceBookings.filter((booking: { status: string }) =>
        ['reserved', 'confirmed', 'in_progress'].includes(booking.status)
      ).length;

      // Service category stats
      const services = (servicesRes.data ?? []) as Array<{ id: string; category: string }>;
      const categoryMap: Record<string, { count: number; revenue: number }> = {};
      serviceBookings.forEach((booking: { service_id?: string; total_amount?: number }) => {
        const service = services.find((item: { id: string }) => item.id === booking.service_id);
        if (service) {
          if (!categoryMap[service.category]) {
            categoryMap[service.category] = { count: 0, revenue: 0 };
          }
          categoryMap[service.category].count++;
          categoryMap[service.category].revenue += booking.total_amount || 0;
        }
      });

      const serviceCategoryStats: ServiceCategoryStats[] = Object.entries(categoryMap)
        .map(([category, data]) => ({
          category,
          count: data.count,
          revenue: data.revenue,
          color: CATEGORY_COLORS[category] || 'bg-gray-500',
        }))
        .sort((a, b) => b.count - a.count);

      // Generate revenue data for last 7 days
      const last7Days: RevenueData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayPayments = payments.filter((payment: { created_at?: string }) => payment.created_at?.startsWith(dateStr));
        last7Days.push({
          date: dateStr,
          revenue: dayPayments.reduce((sum: number, payment: { amount: number }) => sum + (payment.amount || 0), 0),
          bookings: 0,
        });
      }

      // Generate recent activities
      const activities: RecentActivity[] = [];

      // Add recent reservations
      if (reservations.length > 0) {
        activities.push({
          id: '1',
          type: 'reservation',
          message: `${activeReservations} active reservations in the system`,
          timestamp: today,
          icon: Calendar,
          color: 'text-blue-600',
        });
      }

      // Add room status alerts
      if (dirtyRooms > 0) {
        activities.push({
          id: '2',
          type: 'room',
          message: `${dirtyRooms} rooms need cleaning`,
          timestamp: today,
          icon: AlertTriangle,
          color: 'text-amber-600',
        });
      }

      // Add check-in alerts
      if (checkInsToday > 0) {
        activities.push({
          id: '3',
          type: 'check_in',
          message: `${checkInsToday} guests checking in today`,
          timestamp: today,
          icon: UserCheck,
          color: 'text-emerald-600',
        });
      }

      // Add check-out alerts
      if (checkOutsToday > 0) {
        activities.push({
          id: '4',
          type: 'check_out',
          message: `${checkOutsToday} guests checking out today`,
          timestamp: today,
          icon: LogOut,
          color: 'text-red-600',
        });
      }

      // Add service bookings
      if (activeServiceBookings > 0) {
        activities.push({
          id: '5',
          type: 'service',
          message: `${activeServiceBookings} active service bookings`,
          timestamp: today,
          icon: Sparkles,
          color: 'text-purple-600',
        });
      }

      setStats({
        totalRooms,
        availableRooms,
        occupiedRooms,
        dirtyRooms,
        totalGuests,
        activeReservations,
        checkInsToday,
        checkOutsToday,
        totalRevenue,
        pendingPayments,
        occupancyRate,
        activeServiceBookings,
      });
      setRevenueData(last7Days);
      setServiceStats(serviceCategoryStats);
      setRecentActivities(activities);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time subscription
  useEffect(() => {
    loadDashboardData();

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pms_rooms' },
        () => loadDashboardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pms_reservations' },
        () => loadDashboardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pms_service_bookings' },
        () => loadDashboardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pms_payments' },
        () => loadDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);

  return (
    <div className="min-h-screen bg-slate-50 -m-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, {profile?.full_name || 'Admin'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Live
          </span>
          <span className="text-xs text-slate-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={loadDashboardData}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Occupancy"
          value={`${stats.occupancyRate}%`}
          icon={TrendingUp}
          color="bg-blue-500"
          trend={stats.occupancyRate > 70 ? 'up' : 'down'}
        />
        <StatCard
          label="Available Rooms"
          value={stats.availableRooms}
          icon={Bed}
          color="bg-emerald-500"
          subtext={`of ${stats.totalRooms} total`}
        />
        <StatCard
          label="Occupied"
          value={stats.occupiedRooms}
          icon={UserCheck}
          color="bg-blue-600"
        />
        <StatCard
          label="Dirty Rooms"
          value={stats.dirtyRooms}
          icon={AlertTriangle}
          color="bg-amber-500"
          alert={stats.dirtyRooms > 5}
        />
        <StatCard
          label="Active Bookings"
          value={stats.activeReservations}
          icon={Calendar}
          color="bg-purple-500"
        />
        <StatCard
          label="Service Bookings"
          value={stats.activeServiceBookings}
          icon={Sparkles}
          color="bg-pink-500"
          onClick={() => navigate('/pms')}
        />
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Today's Check-ins</h3>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.checkInsToday}</p>
          <p className="text-sm text-slate-500 mt-1">guests arriving</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Today's Check-outs</h3>
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.checkOutsToday}</p>
          <p className="text-sm text-slate-500 mt-1">guests departing</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Total Revenue</h3>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ETB {stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500 mt-1">all time</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">Revenue Trend (Last 7 Days)</h3>
            <button className="text-sm text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
          <div className="h-64 flex items-end gap-2">
            {revenueData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all hover:from-amber-600 hover:to-amber-500"
                  style={{
                    height: `${(day.revenue / maxRevenue) * 100}%`,
                    minHeight: day.revenue > 0 ? '20px' : '4px'
                  }}
                />
                <span className="text-xs text-slate-400">
                  {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  ETB {day.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
            <Bell className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-slate-50 ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{activity.message}</p>
                    <p className="text-xs text-slate-400">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Room Status Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">Room Status Overview</h3>
          <button
            onClick={() => navigate('/pms')}
            className="text-sm text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(STATUS_COLORS).map(([status, color]) => {
            const count = status === 'AVAILABLE' ? stats.availableRooms :
                          status === 'OCCUPIED' ? stats.occupiedRooms :
                          status === 'DIRTY' ? stats.dirtyRooms : 0;
            return (
              <div key={status} className="relative">
                <div className={`h-24 rounded-lg ${color} opacity-80 flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-white">{count}</span>
                </div>
                <p className="text-xs text-center mt-2 text-slate-600">
                  {status.replace(/_/g, ' ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Categories */}
      {serviceStats.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">Service Performance</h3>
            <button
              onClick={() => navigate('/services')}
              className="text-sm text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
            >
              View All Services <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {serviceStats.slice(0, 5).map((stat, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-4 hover:shadow-md transition">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-slate-900 capitalize">
                  {stat.category.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-slate-500">{stat.count} bookings</p>
                <p className="text-sm font-medium text-amber-600 mt-1">
                  ETB {stat.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <QuickAction
          icon={Bed}
          label="Rooms"
          onClick={() => navigate('/pms')}
          color="bg-blue-500"
        />
        <QuickAction
          icon={Calendar}
          label="Reservations"
          onClick={() => navigate('/pms')}
          color="bg-purple-500"
        />
        <QuickAction
          icon={Users}
          label="Guests"
          onClick={() => navigate('/pms')}
          color="bg-emerald-500"
        />
        <QuickAction
          icon={Sparkles}
          label="Services"
          onClick={() => navigate('/services')}
          color="bg-pink-500"
        />
        <QuickAction
          icon={Receipt}
          label="Billing"
          onClick={() => navigate('/pms')}
          color="bg-amber-500"
        />
        <QuickAction
          icon={Settings}
          label="Settings"
          onClick={() => navigate('/pms')}
          color="bg-slate-500"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
  trend,
  alert,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtext?: string;
  trend?: 'up' | 'down';
  alert?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition' : ''} ${alert ? 'border-amber-300 bg-amber-50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center text-xs ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-amber-200 transition-all flex flex-col items-center gap-2 group"
    >
      <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </button>
  );
}
