import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import {
  Wrench, AlertTriangle, Clock, CheckCircle, Plus, X, Search, RefreshCw,
  Filter, Edit2, Trash2, Eye, Calendar, User, MapPin
} from 'lucide-react';
import type { PmsMaintenanceRequest, PmsMaintenanceAsset, PmsRoom } from '../../types/pms';

type StatusFilter = 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed';
type PriorityFilter = 'all' | 'low' | 'normal' | 'high' | 'urgent' | 'emergency';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  assigned: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Assigned' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In Progress' },
  parts_ordered: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Parts Ordered' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Cancelled' },
};

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; icon: boolean }> = {
  low: { bg: 'bg-slate-100', text: 'text-slate-600', icon: false },
  normal: { bg: 'bg-blue-100', text: 'text-blue-600', icon: false },
  high: { bg: 'bg-orange-100', text: 'text-orange-600', icon: true },
  urgent: { bg: 'bg-red-100', text: 'text-red-600', icon: true },
  emergency: { bg: 'bg-red-200', text: 'text-red-700', icon: true },
};

const ASSET_TYPE_CONFIG: Record<string, { bg: string; text: string }> = {
  hvac: { bg: 'bg-blue-100', text: 'text-blue-600' },
  plumbing: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
  electrical: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  furniture: { bg: 'bg-amber-100', text: 'text-amber-600' },
  appliance: { bg: 'bg-purple-100', text: 'text-purple-600' },
  safety: { bg: 'bg-red-100', text: 'text-red-600' },
  other: { bg: 'bg-slate-100', text: 'text-slate-600' },
};

export default function MaintenanceDashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<PmsMaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<PmsMaintenanceAsset[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [, setSelectedRequest] = useState<PmsMaintenanceRequest | null>(null);
  const [view, setView] = useState<'requests' | 'assets'>('requests');
  const [newRequest, setNewRequest] = useState({
    room_id: '',
    title: '',
    description: '',
    priority: 'normal' as const,
    location: '',
    estimated_cost: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsRes, assetsRes, roomsRes] = await Promise.all([
        supabase
          .from('pms_maintenance_requests')
          .select('*, room:pms_rooms(*, room_type:pms_room_types(*))')
          .order('created_at', { ascending: false }),
        supabase
          .from('pms_maintenance_assets')
          .select('*, room:pms_rooms(*)')
          .order('name'),
        supabase
          .from('pms_rooms')
          .select('*, room_type:pms_room_types(*)')
          .order('room_number'),
      ]);

      if (requestsRes.data) setRequests(requestsRes.data as PmsMaintenanceRequest[]);
      if (assetsRes.data) setAssets(assetsRes.data as PmsMaintenanceAsset[]);
      if (roomsRes.data) setRooms(roomsRes.data as PmsRoom[]);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('maintenance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_maintenance_requests' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_maintenance_assets' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;
    const matchesSearch = searchQuery === '' ||
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.room?.room_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const createRequest = async () => {
    if (!newRequest.title) return;
    try {
      await supabase.from('pms_maintenance_requests').insert({
        room_id: newRequest.room_id || null,
        title: newRequest.title,
        description: newRequest.description,
        priority: newRequest.priority,
        location: newRequest.location,
        estimated_cost: newRequest.estimated_cost ? parseFloat(newRequest.estimated_cost) : null,
        status: 'pending',
        reported_by: profile?.id ?? null,
      });
      setShowNewRequestModal(false);
      setNewRequest({ room_id: '', title: '', description: '', priority: 'normal', location: '', estimated_cost: '' });
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const updateRequestStatus = async (id: string, status: string) => {
    try {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      await supabase.from('pms_maintenance_requests').update(updates).eq('id', id);
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    urgent: requests.filter(r => ['urgent', 'emergency'].includes(r.priority) && !['completed', 'cancelled'].includes(r.status)).length,
    totalAssets: assets.length,
    operational: assets.filter(a => a.status === 'operational').length,
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
          <h1 className="text-2xl font-bold text-slate-900">Maintenance & Engineering</h1>
          <p className="text-slate-500 mt-1">Track work orders and manage assets</p>
        </div>
        <button
          onClick={() => setShowNewRequestModal(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition"
        >
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/*Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Requests</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4 bg-yellow-50">
          <p className="text-sm text-yellow-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-200 p-4 bg-purple-50">
          <p className="text-sm text-purple-600">In Progress</p>
          <p className="text-2xl font-bold text-purple-700">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4 bg-emerald-50">
          <p className="text-sm text-emerald-600">Completed</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-300 p-4 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600">Urgent</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.urgent}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Assets</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalAssets}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Operational</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.operational}</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setView('requests')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  view === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Work Orders
              </button>
              <button
                onClick={() => setView('assets')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  view === 'assets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Assets
              </button>
            </div>

            {view === 'requests' && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {view === 'requests' && (
          <div className="p-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No maintenance requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => {
                  const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  const priority = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.normal;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition hover:shadow-sm ${
                        ['urgent', 'emergency'].includes(req.priority) && req.status !== 'completed'
                          ? 'border-red-200 bg-red-50'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${priority.bg}`}>
                          {priority.icon ? (
                            <AlertTriangle className={`w-6 h-6 ${priority.text}`} />
                          ) : (
                            <Wrench className={`w-6 h-6 ${priority.text}`} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{req.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${priority.bg} ${priority.text}`}>
                              {req.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            {req.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                Room {req.room.room_number}
                              </span>
                            )}
                            {req.location && <span>{req.location}</span>}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(req.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                        {req.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRequestStatus(req.id, 'in_progress');
                            }}
                            className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600"
                          >
                            Start
                          </button>
                        )}
                        {req.status === 'in_progress' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateRequestStatus(req.id, 'completed');
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
        )}

        {view === 'assets' && (
          <div className="p-4">
            {assets.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No assets registered</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset) => {
                  const typeConfig = ASSET_TYPE_CONFIG[asset.asset_type] || ASSET_TYPE_CONFIG.other;
                  return (
                    <div
                      key={asset.id}
                      className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 cursor-pointer transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}>
                          {asset.asset_type.toUpperCase()}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          asset.status === 'operational' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {asset.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900">{asset.name}</h4>
                      {asset.room && (
                        <p className="text-sm text-slate-500 mt-1">Room {asset.room.room_number}</p>
                      )}
                      {asset.manufacturer && (
                        <p className="text-xs text-slate-400 mt-2">{asset.manufacturer} {asset.model_number}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewRequestModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">New Maintenance Request</h3>
                <button onClick={() => setShowNewRequestModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Brief description of issue"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Room (Optional)</label>
                <select
                  value={newRequest.room_id}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, room_id: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Not room-specific</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>Room {room.room_number} - {room.room_type?.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Location</label>
                <input
                  type="text"
                  value={newRequest.location}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Lobby, Kitchen, Pool Area"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <select
                  value={newRequest.priority}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Detailed description of the issue..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Estimated Cost (ETB)</label>
                <input
                  type="number"
                  value={newRequest.estimated_cost}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, estimated_cost: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>
              <button
                onClick={createRequest}
                disabled={!newRequest.title}
                className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
