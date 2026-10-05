import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import {
  UserCheck, LogOut, Key, Search, RefreshCw, Plus, X,
  Phone, Mail, Calendar, Bed, Users,
  FileText, MessageSquare
} from 'lucide-react';
import type { PmsGuest, PmsRoom, PmsReservation } from '../../types/pms';

type ViewMode = 'arrivals' | 'departures' | 'in_house' | 'all';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-emerald-100 text-emerald-700',
  CHECKED_OUT: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-red-100 text-red-500',
};

export default function FrontDeskOperations() {
  useAuth();
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [_guests, setGuests] = useState<PmsGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('arrivals');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<PmsReservation | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [, setShowNewReservationModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, roomsRes, guestsRes] = await Promise.all([
        supabase
          .from('pms_reservations')
          .select('*, guest:pms_guests(*), room_type:pms_room_types(*), assigned_room:pms_rooms(*)')
          .order('check_in_date'),
        supabase
          .from('pms_rooms')
          .select('*, room_type:pms_room_types(*)')
          .order('room_number'),
        supabase
          .from('pms_guests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (resRes.data) setReservations(resRes.data as PmsReservation[]);
      if (roomsRes.data) setRooms(roomsRes.data as PmsRoom[]);
      if (guestsRes.data) setGuests(guestsRes.data as PmsGuest[]);
    } catch (error) {
      console.error('Error loading front desk data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('frontdesk-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_reservations' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_rooms' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pms_guests' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = searchQuery === '' ||
      res.guest?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.guest?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.guest?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.guest?.phone?.includes(searchQuery);

    if (viewMode === 'arrivals') {
      return res.check_in_date === today && ['CONFIRMED', 'PENDING'].includes(res.status);
    }
    if (viewMode === 'departures') {
      return res.check_out_date === today && res.status === 'CHECKED_IN';
    }
    if (viewMode === 'in_house') {
      return res.status === 'CHECKED_IN';
    }
    return matchesSearch;
  });

  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE');

  const handleCheckIn = async (reservation: PmsReservation, roomId: string) => {
    try {
      await Promise.all([
        supabase
          .from('pms_reservations')
          .update({ status: 'CHECKED_IN', assigned_room_id: roomId })
          .eq('id', reservation.id),
        supabase
          .from('pms_rooms')
          .update({ status: 'OCCUPIED' })
          .eq('id', roomId),
      ]);
      setShowCheckInModal(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const handleCheckOut = async (reservation: PmsReservation) => {
    try {
      if (reservation.assigned_room_id) {
        await Promise.all([
          supabase
            .from('pms_reservations')
            .update({ status: 'CHECKED_OUT' })
            .eq('id', reservation.id),
          supabase
            .from('pms_rooms')
            .update({ status: 'DIRTY' })
            .eq('id', reservation.assigned_room_id),
        ]);
      }
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const stats = {
    arrivals: reservations.filter(r => r.check_in_date === today && ['CONFIRMED', 'PENDING'].includes(r.status)).length,
    departures: reservations.filter(r => r.check_out_date === today && r.status === 'CHECKED_IN').length,
    inHouse: reservations.filter(r => r.status === 'CHECKED_IN').length,
    availableRooms: availableRooms.length,
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
          <h1 className="text-2xl font-bold text-slate-900">Front Desk</h1>
          <p className="text-slate-500 mt-1">Manage arrivals, departures, and in-house guests</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewReservationModal(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> New Reservation
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.arrivals}</p>
              <p className="text-sm text-slate-500">Arrivals Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.departures}</p>
              <p className="text-sm text-slate-500">Departures Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.inHouse}</p>
              <p className="text-sm text-slate-500">In House</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bed className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.availableRooms}</p>
              <p className="text-sm text-slate-500">Available Rooms</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {([
              { mode: 'arrivals', label: 'Arrivals', count: stats.arrivals },
              { mode: 'departures', label: 'Departures', count: stats.departures },
              { mode: 'in_house', label: 'In House', count: stats.inHouse },
              { mode: 'all', label: 'All', count: reservations.length },
            ] as const).map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition ${
                  viewMode === tab.mode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  viewMode === tab.mode ? 'bg-slate-100' : 'bg-slate-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No reservations found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReservations.map((res) => (
              <div
                key={res.id}
                onClick={() => setSelectedReservation(res)}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
                    {(res.guest?.first_name?.[0] || 'G')}{(res.guest?.last_name?.[0] || '')}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {res.guest?.first_name} {res.guest?.last_name}
                      {res.status === 'CHECKED_IN' && res.assigned_room && (
                        <span className="ml-2 text-amber-600">Room {res.assigned_room.room_number}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {res.check_in_date} to {res.check_out_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {res.number_of_guests} guest{res.number_of_guests > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5" />
                        {res.room_type?.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[res.status]}`}>
                    {res.status.replace('_', ' ')}
                  </span>
                  {res.status === 'CONFIRMED' && viewMode === 'arrivals' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReservation(res);
                        setShowCheckInModal(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 flex items-center gap-1"
                    >
                      <Key className="w-3.5 h-3.5" /> Check In
                    </button>
                  )}
                  {res.status === 'CHECKED_IN' && viewMode === 'departures' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckOut(res);
                      }}
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Check Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-In Modal */}
      {showCheckInModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCheckInModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Check In Guest</h3>
                <button onClick={() => setShowCheckInModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-semibold text-slate-900">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</p>
                <p className="text-sm text-slate-500">{selectedReservation.room_type?.name}</p>
                <p className="text-sm text-slate-500 mt-1">{selectedReservation.check_in_date} to {selectedReservation.check_out_date}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Assign Room</label>
                <select
                  id="room-select"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  defaultValue=""
                >
                  <option value="" disabled>Select a room</option>
                  {rooms
                    .filter(r => r.status === 'AVAILABLE' && r.room_type_id === selectedReservation.room_type_id)
                    .map(room => (
                      <option key={room.id} value={room.id}>
                        Room {room.room_number} - Floor {room.floor}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const select = document.getElementById('room-select') as HTMLSelectElement;
                    if (select?.value) {
                      handleCheckIn(selectedReservation, select.value);
                    }
                  }}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" /> Complete Check-In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Detail Drawer */}
      {selectedReservation && !showCheckInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50" onClick={() => setSelectedReservation(null)}>
          <div className="bg-white rounded-l-2xl shadow-xl w-full max-w-md h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Reservation Details</h3>
                <button onClick={() => setSelectedReservation(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Guest Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold text-2xl">
                  {(selectedReservation.guest?.first_name?.[0] || 'G')}{(selectedReservation.guest?.last_name?.[0] || '')}
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">{selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Mail className="w-4 h-4" />
                    {selectedReservation.guest?.email || 'No email'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="w-4 h-4" />
                    {selectedReservation.guest?.phone || 'No phone'}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[selectedReservation.status]}`}>
                  {selectedReservation.status.replace('_', ' ')}
                </span>
              </div>

              {/* Reservation Details */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Room Type</span>
                  <span className="font-medium text-slate-900">{selectedReservation.room_type?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room</span>
                  <span className="font-medium text-slate-900">
                    {selectedReservation.assigned_room?.room_number || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check In</span>
                  <span className="font-medium text-slate-900">{selectedReservation.check_in_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check Out</span>
                  <span className="font-medium text-slate-900">{selectedReservation.check_out_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guests</span>
                  <span className="font-medium text-slate-900">{selectedReservation.number_of_guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rate/Night</span>
                  <span className="font-medium text-slate-900">ETB {selectedReservation.base_rate?.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {selectedReservation.status === 'CONFIRMED' && (
                  <button
                    onClick={() => setShowCheckInModal(true)}
                    className="w-full py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" /> Check In
                  </button>
                )}
                {selectedReservation.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => handleCheckOut(selectedReservation)}
                    className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Check Out
                  </button>
                )}
                <button className="w-full py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> View Folio
                </button>
                <button className="w-full py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
