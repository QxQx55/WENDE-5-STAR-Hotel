import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, CheckCircle2, AlertCircle, User, Calendar, Bed } from 'lucide-react';

type Task = {
  id: string;
  task_description: string;
  status: string;
  priority: string;
  due_date: string | null;
  room_id: string | null;
  assigned_at: string;
};

type Booking = {
  id: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  special_requests: string | null;
};

export default function StaffDashboard() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending_tasks: 0,
    in_progress_tasks: 0,
    completed_tasks: 0,
    today_check_ins: 0,
    today_check_outs: 0,
  });

  useEffect(() => {
    fetchStaffData();
  }, [profile?.id]);

  const fetchStaffData = async () => {
    if (!profile?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch staff tasks
      const tasksResponse = await supabase
        .from('staff_tasks')
        .select('*')
        .eq('staff_id', profile.id)
        .order('assigned_at', { ascending: false });

      // Fetch all bookings for context
      const bookingsResponse = await supabase
        .from('reservations')
        .select('*')
        .order('check_in_date', { ascending: false })
        .limit(20);

      if (tasksResponse.data) {
        setTasks(tasksResponse.data);

        const stats = {
          pending_tasks: tasksResponse.data.filter((t) => t.status === 'pending').length,
          in_progress_tasks: tasksResponse.data.filter((t) => t.status === 'in_progress').length,
          completed_tasks: tasksResponse.data.filter((t) => t.status === 'completed').length,
          today_check_ins: bookingsResponse.data?.filter(
            (b) => b.check_in_date === today && b.status === 'Confirmed'
          ).length || 0,
          today_check_outs: bookingsResponse.data?.filter(
            (b) => b.check_out_date === today && b.status === 'Checked-In'
          ).length || 0,
        };

        setStats(stats);
      }

      if (bookingsResponse.data) {
        setBookings(bookingsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await supabase
        .from('staff_tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      fetchStaffData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleBookingStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', bookingId);

      fetchStaffData();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading staff dashboard...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'Confirmed':
      case 'completed':
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Staff Dashboard</h2>
        <p className="text-slate-600 mt-2">Manage tasks and bookings</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-700" />
            <span className="text-xs font-medium text-yellow-700">PENDING</span>
          </div>
          <h3 className="text-2xl font-bold text-yellow-900">{stats.pending_tasks}</h3>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-medium text-blue-700">IN PROGRESS</span>
          </div>
          <h3 className="text-2xl font-bold text-blue-900">{stats.in_progress_tasks}</h3>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-700" />
            <span className="text-xs font-medium text-green-700">COMPLETED</span>
          </div>
          <h3 className="text-2xl font-bold text-green-900">{stats.completed_tasks}</h3>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-medium text-emerald-700">CHECK-INS</span>
          </div>
          <h3 className="text-2xl font-bold text-emerald-900">{stats.today_check_ins}</h3>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bed className="w-4 h-4 text-orange-700" />
            <span className="text-xs font-medium text-orange-700">CHECK-OUTS</span>
          </div>
          <h3 className="text-2xl font-bold text-orange-900">{stats.today_check_outs}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-4">My Tasks</h3>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No tasks assigned</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{task.task_description}</h4>
                      {task.due_date && (
                        <p className="text-xs text-slate-500 mt-1">Due: {task.due_date}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold capitalize ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium capitalize px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Recent Bookings</h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bookings.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No bookings</p>
            ) : (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">Booking #{booking.id.slice(0, 8)}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {booking.check_in_date} → {booking.check_out_date}
                      </p>
                      {booking.special_requests && (
                        <p className="text-xs text-slate-600 mt-1 italic">"{booking.special_requests}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <select
                      value={booking.status}
                      onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Checked-In">Checked In</option>
                      <option value="Checked-Out">Checked Out</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
