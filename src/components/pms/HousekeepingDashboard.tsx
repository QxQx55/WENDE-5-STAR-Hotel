import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import {
  Bed, Brush, AlertTriangle, Clock, CheckCircle, User, RefreshCw, Plus, X,
  Sparkles, Timer, Search
} from 'lucide-react';
import type { PmsRoom, PmsHousekeepingTask } from '../../types/pms';

type TaskFilter = 'all' | 'pending' | 'in_progress' | 'completed';
type RoomFilter = 'all' | 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'MAINTENANCE';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  AVAILABLE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Available' },
  OCCUPIED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Occupied' },
  DIRTY: { bg: 'bg-red-100', text: 'text-red-700', label: 'Dirty' },
  CLEANING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Cleaning' },
  MAINTENANCE: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Maintenance' },
  RESERVED: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Reserved' },
};

const TASK_STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
  INSPECTED: { bg: 'bg-purple-100', text: 'text-purple-700' },
  COMPLETED: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-500' },
};

const PRIORITY_CONFIG: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-slate-100', text: 'text-slate-600' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-600' },
  high: { bg: 'bg-orange-100', text: 'text-orange-600' },
  urgent: { bg: 'bg-red-100', text: 'text-red-600' },
};

export default function HousekeepingDashboard() {
  useAuth();
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [tasks, setTasks] = useState<PmsHousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<PmsRoom | null>(null);
  const [newTask, setNewTask] = useState({
    room_id: '',
    reason: 'checkout' as const,
    priority: 'normal' as const,
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, tasksRes] = await Promise.all([
        supabase
          .from('pms_rooms')
          .select('*, room_type:pms_room_types(*)')
          .order('room_number'),
        supabase
          .from('pms_housekeeping_tasks')
          .select('*, room:pms_rooms(*, room_type:pms_room_types(*))')
          .order('created_at', { ascending: false }),
      ]);

      if (roomsRes.data) setRooms(roomsRes.data as PmsRoom[]);
      if (tasksRes.data) setTasks(tasksRes.data as PmsHousekeepingTask[]);
    } catch (error) {
      console.error('Error loading housekeeping data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('housekeeping-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_rooms' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_housekeeping_tasks' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const filteredRooms = rooms.filter(room => {
    const matchesFilter = roomFilter === 'all' || room.status === roomFilter;
    const matchesSearch = searchQuery === '' || room.room_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredTasks = tasks.filter(task => {
    return taskFilter === 'all' || task.task_status === taskFilter.toUpperCase();
  });

  const updateRoomStatus = async (roomId: string, status: string) => {
    try {
      await supabase
        .from('pms_rooms')
        .update({ status, last_cleaned_at: status === 'AVAILABLE' ? new Date().toISOString() : null })
        .eq('id', roomId);
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await supabase
        .from('pms_housekeeping_tasks')
        .update({ task_status: status })
        .eq('id', taskId);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const createTask = async () => {
    if (!newTask.room_id) return;
    try {
      await supabase.from('pms_housekeeping_tasks').insert({
        room_id: newTask.room_id,
        reason: newTask.reason,
        priority: newTask.priority,
        notes: newTask.notes,
        task_status: 'PENDING',
      });
      setShowTaskModal(false);
      setNewTask({ room_id: '', reason: 'checkout', priority: 'normal', notes: '' });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'AVAILABLE').length,
    occupied: rooms.filter(r => r.status === 'OCCUPIED').length,
    dirty: rooms.filter(r => r.status === 'DIRTY').length,
    cleaning: rooms.filter(r => r.status === 'CLEANING').length,
    maintenance: rooms.filter(r => r.status === 'MAINTENANCE').length,
    pendingTasks: tasks.filter(t => t.task_status === 'PENDING').length,
    inProgressTasks: tasks.filter(t => t.task_status === 'IN_PROGRESS').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Housekeeping Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage room status and cleaning tasks</p>
        </div>
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600 transition"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bed className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-500">Total Rooms</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-slate-500">Available</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-slate-500">Occupied</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.occupied}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-600">Dirty</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.dirty}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Broom className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-slate-500">Cleaning</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.cleaning}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-slate-500">Tasks Pending</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-slate-500">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.inProgressTasks}</p>
        </div>
      </div>

      {/* Room Status Board */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Room Status Board</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['all', 'DIRTY', 'CLEANING', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRoomFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    roomFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredRooms.map((room) => {
            const status = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE;
            const activeTask = tasks.find(t => t.room_id === room.id && !['COMPLETED', 'CANCELLED'].includes(t.task_status));
            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                  room.status === 'DIRTY' ? 'border-red-300 bg-red-50' :
                  room.status === 'CLEANING' ? 'border-yellow-300 bg-yellow-50' :
                  room.status === 'AVAILABLE' ? 'border-emerald-300 bg-emerald-50' :
                  'border-slate-200 bg-white'
                }`}
              >
                {activeTask && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                )}
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">{room.room_number}</p>
                  <p className="text-xs text-slate-500">{room.room_type?.name}</p>
                  <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.text}`}>
                    {room.status === 'DIRTY' && <Sparkles className="w-3 h-3" />}
                    {room.status === 'CLEANING' && <Brush className="w-3 h-3" />}
                    {status.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Cleaning Tasks</h2>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTaskFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition capitalize ${
                  taskFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Broom className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const status = TASK_STATUS_CONFIG[task.task_status] || TASK_STATUS_CONFIG.PENDING;
              const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal;
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      task.room?.status === 'DIRTY' ? 'bg-red-100' : 'bg-slate-100'
                    }`}>
                      <Bed className={`w-6 h-6 ${task.room?.status === 'DIRTY' ? 'text-red-500' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">Room {task.room?.room_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${priority.bg} ${priority.text}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{task.reason.replace('_', ' ')}</p>
                      {task.notes && <p className="text-xs text-slate-400 mt-1">{task.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                      {task.task_status.replace('_', ' ')}
                    </span>
                    {task.task_status === 'PENDING' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600"
                      >
                        Start
                      </button>
                    )}
                    {task.task_status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => {
                          updateTaskStatus(task.id, 'COMPLETED');
                          if (task.room_id) updateRoomStatus(task.room_id, 'AVAILABLE');
                        }}
                        className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRoom(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Room {selectedRoom.room_number}</h3>
                  <p className="text-slate-500">{selectedRoom.room_type?.name}</p>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Current Status</label>
                <div className={`mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ${STATUS_CONFIG[selectedRoom.status]?.bg} ${STATUS_CONFIG[selectedRoom.status]?.text}`}>
                  {STATUS_CONFIG[selectedRoom.status]?.label}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Update Status</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['AVAILABLE', 'DIRTY', 'CLEANING', 'MAINTENANCE'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        updateRoomStatus(selectedRoom.id, status);
                        setSelectedRoom(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                        selectedRoom.status === status
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {STATUS_CONFIG[status]?.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    setNewTask(prev => ({ ...prev, room_id: selectedRoom.id }));
                    setSelectedRoom(null);
                    setShowTaskModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
                >
                  <Plus className="w-4 h-4" /> Create Cleaning Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">New Cleaning Task</h3>
                <button onClick={() => setShowTaskModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Room</label>
                <select
                  value={newTask.room_id}
                  onChange={(e) => setNewTask(prev => ({ ...prev, room_id: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>Room {room.room_number} - {room.room_type?.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Reason</label>
                <select
                  value={newTask.reason}
                  onChange={(e) => setNewTask(prev => ({ ...prev, reason: e.target.value as any }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="checkout">Checkout</option>
                  <option value="turnover">Turnover</option>
                  <option value="deep_clean">Deep Clean</option>
                  <option value="maintenance">After Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Additional instructions..."
                />
              </div>
              <button
                onClick={createTask}
                disabled={!newTask.room_id}
                className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
