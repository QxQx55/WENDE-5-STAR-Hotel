import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Bed, Users, Calendar, Sparkles, Receipt, CreditCard,
  ClipboardList, BarChart3, Shield, ChevronRight, Loader, CheckCircle2,
  Clock, XCircle, UserCheck, LogOut, ArrowRight, Plus, Eye, X, RefreshCw,
  AlertTriangle, Search, DollarSign, Settings, Package, Save, Trash2, Edit2,
  Wrench, Key, Award, Gift, LayoutGrid, Clock3, TrendingUp, Box, UsersRound,
  Radio, ShoppingCart
} from 'lucide-react';
import type { PmsGuest, PmsRoom, PmsRoomType, PmsReservation, PmsFolio, PmsPayment, PmsService, PmsHousekeepingTask, PmsDashboardStats, RoomStatus, HousekeepingTaskStatus, PaymentMethod } from '../types/pms';
import { dashboardService, guestService, roomService, roomTypeService, reservationService, housekeepingService, folioService, paymentService, serviceService } from '../services/pms-api';
import { supabase } from '../services/supabase';
import HousekeepingDashboard from './pms/HousekeepingDashboard';
import FrontDeskOperations from './pms/FrontDeskOperations';
import MaintenanceDashboard from './pms/MaintenanceDashboard';
import { SafeImage } from './SafeImage';

type TabId = 'dashboard' | 'frontdesk' | 'rooms' | 'guests' | 'reservations' | 'housekeeping' | 'maintenance' | 'billing' | 'payments' | 'audit' | 'roomtypes' | 'services' | 'dining' | 'parking' | 'bars' | 'gym' | 'loyalty' | 'events' | 'audit_night' | 'rates' | 'inventory' | 'staff' | 'channels' | 'pos' | 'settings';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800', OCCUPIED: 'bg-blue-100 text-blue-800', RESERVED: 'bg-amber-100 text-amber-800',
  DIRTY: 'bg-red-100 text-red-800', CLEANING: 'bg-yellow-100 text-yellow-800', MAINTENANCE: 'bg-slate-100 text-slate-800',
  PENDING: 'bg-yellow-100 text-yellow-800', CONFIRMED: 'bg-blue-100 text-blue-800', CHECKED_IN: 'bg-emerald-100 text-emerald-800',
  CHECKED_OUT: 'bg-slate-100 text-slate-800', CANCELLED: 'bg-red-100 text-red-800', OPEN: 'bg-blue-100 text-blue-800',
  SETTLED: 'bg-emerald-100 text-emerald-800', VERIFIED: 'bg-emerald-100 text-emerald-800', IN_PROGRESS: 'bg-blue-100 text-blue-800', COMPLETED: 'bg-emerald-100 text-emerald-800',
};

function Badge({ status }: { status: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-800'}`}>{status.replace(/_/g, ' ')}</span>;
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
      </div>
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState<PmsDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dashboardService.getStats().then(setStats).catch(console.error).finally(() => setLoading(false)); }, []);
  if (loading) return <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" />;
  if (!stats) return <p className="text-red-500 text-center mt-20">Failed to load dashboard</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Rooms" value={stats.rooms.total} icon={Bed} color="bg-slate-700" />
        <StatCard label="Occupied" value={stats.rooms.occupied} icon={UserCheck} color="bg-blue-600" />
        <StatCard label="Available" value={stats.rooms.available} icon={CheckCircle2} color="bg-emerald-600" />
        <StatCard label="Dirty" value={stats.rooms.dirty} icon={Sparkles} color="bg-amber-600" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cleaning" value={stats.rooms.cleaning} icon={RefreshCw} color="bg-yellow-600" />
        <StatCard label="Maintenance" value={stats.rooms.maintenance} icon={AlertTriangle} color="bg-red-600" />
        <StatCard label="Pending Reservations" value={stats.reservations.pending} icon={Clock} color="bg-orange-600" />
        <StatCard label="Checked In" value={stats.reservations.checkedIn} icon={Calendar} color="bg-emerald-600" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Occupancy Rate: {stats.occupancyRate}%</h3>
        <div className="w-full bg-slate-100 rounded-full h-4"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${stats.occupancyRate}%` }} /></div>
      </div>
    </div>
  );
}

function RoomsTab() {
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { profile } = useAuth();
  const load = useCallback(() => { setLoading(true); roomService.getAll().then(setRooms).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);
  const canUpdate = profile?.role === 'admin' || profile?.role === 'manager';
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Room Status Board</h2>
        <button onClick={load} className="p-2 rounded-lg hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {['all', 'AVAILABLE', 'OCCUPIED', 'DIRTY', 'CLEANING', 'MAINTENANCE'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{s === 'all' ? 'All' : s.replace(/_/g, ' ')}</button>
        ))}
      </div>
      {loading ? <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(room => (
            <div key={room.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-slate-900">Room {room.room_number}</span>
                <Badge status={room.status} />
              </div>
              <p className="text-sm text-slate-500">Floor {room.floor} - {room.room_type?.name}</p>
              <p className="text-sm font-medium text-slate-700">${room.room_type?.base_price || 0}/night</p>
              {canUpdate && (
                <select value={room.status} onChange={async (e) => { try { await roomService.updateStatus(room.id, e.target.value as RoomStatus); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } }} className="w-full mt-3 text-sm border border-slate-200 rounded-lg px-2 py-1.5">
                  {['AVAILABLE', 'OCCUPIED', 'RESERVED', 'DIRTY', 'CLEANING', 'MAINTENANCE'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GuestsTab() {
  const [guests, setGuests] = useState<PmsGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<PmsGuest | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', id_number: '', id_type: 'Passport', nationality: '' });
  const load = useCallback(() => { setLoading(true); guestService.getAll().then(setGuests).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = guests.filter(g => `${g.first_name} ${g.last_name} ${g.email || ''} ${g.phone}`.toLowerCase().includes(search.toLowerCase()));
  const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); try { await guestService.create(form); setShowAdd(false); setForm({ first_name: '', last_name: '', email: '', phone: '', id_number: '', id_type: 'Passport', nationality: '' }); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Guest Management</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"><Plus className="w-4 h-4" /> Add Guest</button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm" /></div>
      {loading ? <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" /> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Contact</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Stays</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">VIP</th><th></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(g => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{g.first_name} {g.last_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{g.email || g.phone}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{g.id_number}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{g.total_stays || 0}</td>
                  <td className="px-4 py-3">{g.is_vip && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">VIP</span>}</td>
                  <td className="px-4 py-3"><button onClick={() => setSelected(g)} className="p-1.5 rounded-lg hover:bg-slate-100"><Eye className="w-4 h-4 text-slate-500" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Guest">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-700">First Name</label><input required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-sm font-medium text-slate-700">Last Name</label><input required value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="text-sm font-medium text-slate-700">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-sm font-medium text-slate-700">Phone</label><input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-700">ID Number</label><input required value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-sm font-medium text-slate-700">ID Type</label><select value={form.id_type} onChange={e => setForm(f => ({ ...f, id_type: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"><option>Passport</option><option>License</option><option>National ID</option></select></div>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800">Create Guest</button>
        </form>
      </Modal>
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Guest Details">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-500">Name:</span><p className="font-medium">{selected.first_name} {selected.last_name}</p></div>
              <div><span className="text-slate-500">Email:</span><p className="font-medium">{selected.email || '—'}</p></div>
              <div><span className="text-slate-500">Phone:</span><p className="font-medium">{selected.phone}</p></div>
              <div><span className="text-slate-500">VIP:</span><p className="font-medium">{selected.is_vip ? 'Yes' : 'No'}</p></div>
              <div><span className="text-slate-500">Total Stays:</span><p className="font-medium">{selected.total_stays || 0}</p></div>
              <div><span className="text-slate-500">Total Spent:</span><p className="font-medium">${selected.total_spent || 0}</p></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ReservationsTab() {
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [guests, setGuests] = useState<PmsGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState<PmsReservation | null>(null);
  const [form, setForm] = useState({ guest_id: '', room_type_id: '', check_in_date: '', check_out_date: '', number_of_guests: 1, special_requests: '' });
  const load = useCallback(() => { setLoading(true); Promise.all([reservationService.getAll(), roomService.getAll(), roomTypeService.getAll(), guestService.getAll()]).then(([r, rm, rt, g]) => { setReservations(r); setRooms(rm); setRoomTypes(rt); setGuests(g); }).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);
  const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); try { await reservationService.create(form); setShowCreate(false); setForm({ guest_id: '', room_type_id: '', check_in_date: '', check_out_date: '', number_of_guests: 1, special_requests: '' }); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } };
  const handleConfirm = async (id: string) => { try { await reservationService.confirm(id); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } };
  const handleCancel = async (id: string) => { if (!confirm('Cancel this reservation?')) return; try { await reservationService.cancel(id); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } };
  const handleCheckIn = async (res: PmsReservation, roomId: string) => { try { await reservationService.checkIn(res.id, roomId); setShowCheckIn(null); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } };
  const handleCheckOut = async (id: string) => { if (!confirm('Check out this guest?')) return; try { await reservationService.checkOut(id); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } };
  const availableRooms = (roomTypeId: string) => rooms.filter(r => r.room_type_id === roomTypeId && ['AVAILABLE', 'RESERVED'].includes(r.status));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Reservations</h2>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"><Plus className="w-4 h-4" /> New Reservation</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {['all', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{s === 'all' ? 'All' : s.replace(/_/g, ' ')}</button>
        ))}
      </div>
      {loading ? <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" /> : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-slate-900">{r.guest?.first_name} {r.guest?.last_name}</span>
                    <Badge status={r.status} />
                    {r.guest?.is_vip && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">VIP</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm text-slate-600">
                    <span>Check-in: <strong className="text-slate-900">{r.check_in_date}</strong></span>
                    <span>Check-out: <strong className="text-slate-900">{r.check_out_date}</strong></span>
                    <span>Room Type: <strong className="text-slate-900">{r.room_type?.name}</strong></span>
                    <span>Rate: <strong className="text-slate-900">${r.base_rate}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'PENDING' && <button onClick={() => handleConfirm(r.id)} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700"><CheckCircle2 className="w-3.5 h-3.5" /> Confirm</button>}
                  {r.status === 'CONFIRMED' && (
                    <>
                      <button onClick={() => setShowCheckIn(r)} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700"><ArrowRight className="w-3.5 h-3.5" /> Check In</button>
                      <button onClick={() => handleCancel(r.id)} className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100"><XCircle className="w-3.5 h-3.5" /> Cancel</button>
                    </>
                  )}
                  {r.status === 'CHECKED_IN' && <button onClick={() => handleCheckOut(r.id)} className="flex items-center gap-1 bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-800"><LogOut className="w-3.5 h-3.5" /> Check Out</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Reservation">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Guest</label><select required value={form.guest_id} onChange={e => setForm(f => ({ ...f, guest_id: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="">Select guest...</option>{guests.map(g => <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>)}</select></div>
          <div><label className="text-sm font-medium text-slate-700">Room Type</label><select required value={form.room_type_id} onChange={e => setForm(f => ({ ...f, room_type_id: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="">Select type...</option>{roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name} - ${rt.base_price}/night</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-700">Check-in</label><input type="date" required value={form.check_in_date} onChange={e => setForm(f => ({ ...f, check_in_date: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-sm font-medium text-slate-700">Check-out</label><input type="date" required value={form.check_out_date} onChange={e => setForm(f => ({ ...f, check_out_date: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800">Create Reservation</button>
        </form>
      </Modal>
      <Modal open={!!showCheckIn} onClose={() => setShowCheckIn(null)} title="Assign Room for Check-In">
        {showCheckIn && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Assign a room for {showCheckIn.guest?.first_name} {showCheckIn.guest?.last_name}</p>
            <div className="space-y-2">
              {availableRooms(showCheckIn.room_type_id).map(room => (
                <button key={room.id} onClick={() => handleCheckIn(showCheckIn, room.id)} className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 hover:border-emerald-400 hover:bg-emerald-50 text-left">
                  <span className="font-medium text-slate-900">Room {room.room_number}</span><span className="text-sm text-slate-500">Floor {room.floor}</span>
                </button>
              ))}
              {availableRooms(showCheckIn.room_type_id).length === 0 && <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3 text-sm"><AlertTriangle className="w-4 h-4" /> No available rooms</div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function HousekeepingTab() {
  const [tasks, setTasks] = useState<PmsHousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const load = useCallback(() => { setLoading(true); housekeepingService.getAll().then(setTasks).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.task_status === filter);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Housekeeping</h2>
        <button onClick={load} className="p-2 rounded-lg hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{s === 'all' ? 'All' : s.replace(/_/g, ' ')}</button>
        ))}
      </div>
      {loading ? <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" /> : (
        <div className="space-y-3">
          {filtered.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-slate-900">Room {task.room?.room_number}</span>
                    <Badge status={task.task_status} />
                  </div>
                  <p className="text-sm text-slate-600">Reason: {task.reason.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {task.task_status === 'PENDING' && <button onClick={async () => { try { await housekeepingService.updateStatus(task.id, 'IN_PROGRESS'); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } }} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700"><ArrowRight className="w-3.5 h-3.5" /> Start</button>}
                  {task.task_status === 'IN_PROGRESS' && <button onClick={async () => { try { await housekeepingService.updateStatus(task.id, 'COMPLETED'); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } }} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BillingTab() {
  const [folios, setFolios] = useState<PmsFolio[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { setLoading(true); folioService.getAll().then(setFolios).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Folio & Billing</h2>
      {loading ? <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" /> : (
        <div className="space-y-3">
          {folios.map(folio => (
            <div key={folio.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-slate-900">{folio.guest?.first_name} {folio.guest?.last_name}</span>
                    <Badge status={folio.status} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm text-slate-600">
                    <span>Subtotal: <strong className="text-slate-900">${folio.subtotal.toFixed(2)}</strong></span>
                    <span>Tax: <strong className="text-slate-900">${folio.tax_amount.toFixed(2)}</strong></span>
                    <span>Total: <strong className="text-slate-900">${folio.total_amount.toFixed(2)}</strong></span>
                    <span>Balance: <strong className={folio.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>${folio.balance.toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentsTab() {
  const [payments, setPayments] = useState<PmsPayment[]>([]);
  const [folios, setFolios] = useState<PmsFolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState({ folio_id: '', amount: 0, payment_method: 'cash' as PaymentMethod, reference_number: '' });
  const load = useCallback(() => { setLoading(true); Promise.all([paymentService.getAll(), folioService.getAll()]).then(([p, f]) => { setPayments(p); setFolios(f); }).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  const openFolios = folios.filter(f => f.balance > 0);
  const handleRecord = async (e: React.FormEvent) => { e.preventDefault(); try { await paymentService.record(form); setShowRecord(false); setForm({ folio_id: '', amount: 0, payment_method: 'cash', reference_number: '' }); load(); } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); } };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Payments</h2>
        <button onClick={() => setShowRecord(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"><CreditCard className="w-4 h-4" /> Record Payment</button>
      </div>
      {loading ? <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" /> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50"><tr><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Method</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">${p.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 capitalize">{p.payment_method}</td>
                  <td className="px-4 py-3"><Badge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showRecord} onClose={() => setShowRecord(false)} title="Record Payment">
        <form onSubmit={handleRecord} className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Folio</label><select required value={form.folio_id} onChange={e => { const f = openFolios.find(x => x.id === e.target.value); setForm(x => ({ ...x, folio_id: e.target.value, amount: f?.balance || 0 })); }} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="">Select folio...</option>{openFolios.map(f => <option key={f.id} value={f.id}>{f.guest?.first_name} {f.guest?.last_name} - Balance: ${f.balance.toFixed(2)}</option>)}</select></div>
          <div><label className="text-sm font-medium text-slate-700">Amount</label><input type="number" step="0.01" min="0.01" required value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-sm font-medium text-slate-700">Payment Method</label><select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value as PaymentMethod }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="cash">Cash</option><option value="credit_card">Credit Card</option><option value="debit_card">Debit Card</option><option value="bank_transfer">Bank Transfer</option></select></div>
          <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800">Record Payment</button>
        </form>
      </Modal>
    </div>
  );
}

function AuditTab() {
  const [logs, setLogs] = useState<{ id: string; action: string; resource_type: string; details?: string; created_at: string; user?: { full_name: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("pms_audit_logs").select("*, user:profiles(full_name)").order("created_at", { ascending: false }).limit(100).then(({ data }) => { setLogs(data || []); }).catch(console.error).finally(() => setLoading(false));
  }, []);
  if (loading) return <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" />;
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Audit Log</h2>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50"><tr><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Time</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">User</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th><th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Details</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{log.user?.full_name || 'System'}</td>
                <td className="px-4 py-3 text-sm"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono">{log.action}</span></td>
                <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{log.details || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoomTypesTab() {
  const [types, setTypes] = useState<PmsRoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PmsRoomType | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    max_occupancy: 2,
    amenities: ['WiFi', 'Air Conditioning', 'TV', 'Mini Bar'],
    image_url: ''
  });
  const [amenityInput, setAmenityInput] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    supabase.from('pms_room_types').select('*').order('sort_order').then(({ data, error }) => {
      if (!error && data) setTypes(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase.from('pms_room_types').update({
          ...form,
          updated_at: new Date().toISOString()
        }).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pms_room_types').insert([{ ...form, is_active: true, sort_order: types.length }]);
        if (error) throw error;
      }
      setShowCreate(false);
      setEditing(null);
      setForm({ name: '', description: '', base_price: 0, max_occupancy: 2, amenities: ['WiFi', 'Air Conditioning', 'TV', 'Mini Bar'], image_url: '' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('pms_room_types').delete().eq('id', id);
      if (error) throw error;
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await supabase.from('pms_room_types').update({ is_active: !current }).eq('id', id);
      load();
    } catch (err) {
      alert('Failed to update');
    }
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !form.amenities.includes(amenityInput.trim())) {
      setForm(f => ({ ...f, amenities: [...f.amenities, amenityInput.trim()] }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setForm(f => ({ ...f, amenities: f.amenities.filter(a => a !== amenity) }));
  };

  if (loading) return <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Room Type Management</h2>
          <p className="text-sm text-slate-500 mt-1">Create and manage room categories with pricing and amenities</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Add Room Type
        </button>
      </div>

      {types.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Bed className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No room types configured yet.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-amber-600 font-medium hover:text-amber-700">Create your first room type</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {types.map(t => (
            <div key={t.id} className={`bg-white rounded-xl border overflow-hidden ${t.is_active === false ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:shadow-lg transition-shadow'}`}>
              <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 relative">
                {t.image_url ? (
                  <SafeImage src={t.image_url} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bed className="w-12 h-12 text-slate-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <button onClick={() => toggleActive(t.id, t.is_active ?? true)} className={`px-2 py-1 rounded-full text-xs font-semibold ${t.is_active !== false ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {t.is_active !== false ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{t.max_occupancy} guests max</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-600">ETB {t.base_price.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">per night</p>
                  </div>
                </div>
                {t.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{t.description}</p>}
                {t.amenities && t.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {t.amenities.slice(0, 4).map(a => (
                      <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                    {t.amenities.length > 4 && <span className="text-xs text-slate-400">+{t.amenities.length - 4}</span>}
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => {
                    setEditing(t);
                    setForm({
                      name: t.name,
                      description: t.description || '',
                      base_price: t.base_price,
                      max_occupancy: t.max_occupancy,
                      amenities: t.amenities || [],
                      image_url: t.image_url || ''
                    });
                  }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(t.id, t.name)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate || !!editing} onClose={() => { setShowCreate(false); setEditing(null); setForm({ name: '', description: '', base_price: 0, max_occupancy: 2, amenities: ['WiFi', 'Air Conditioning', 'TV', 'Mini Bar'], image_url: '' }); }} title={editing ? 'Edit Room Type' : 'New Room Type'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Room Type Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Deluxe Suite, Presidential Suite" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Brief description of this room type" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Image URL (optional)</label>
            <input type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="https://example.com/room-image.jpg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Base Price (ETB) *</label>
              <input type="number" required min="0" value={form.base_price || ''} onChange={e => setForm(f => ({ ...f, base_price: parseInt(e.target.value) || 0 }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Max Occupancy *</label>
              <input type="number" required min="1" max="10" value={form.max_occupancy || ''} onChange={e => setForm(f => ({ ...f, max_occupancy: parseInt(e.target.value) || 2 }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Amenities</label>
            <div className="flex gap-2 mt-1">
              <input value={amenityInput} onChange={e => setAmenityInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Add amenity..." />
              <button type="button" onClick={addAmenity} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.amenities.map(a => (
                <span key={a} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                  {a}
                  <button type="button" onClick={() => removeAmenity(a)} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowCreate(false); setEditing(null); }} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const SERVICE_IMAGES: Record<string, string> = {
  'spa': 'https://images.pexels.com/photos/375797/pexels-photo-375797.jpeg?auto=compress&cs=tinysrgb&w=600',
  'dining': 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=600',
  'gym': 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=600',
  'parking': 'https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=600',
  'bars': 'https://images.pexels.com/photos/3014827/pexels-photo-3014827.jpeg?auto=compress&cs=tinysrgb&w=600',
  'laundry': 'https://images.pexels.com/photos/6194346/pexels-photo-6194346.jpeg?auto=compress&cs=tinysrgb&w=600',
  'room_service': 'https://images.pexels.com/photos/1585829/pexels-photo-1585829.jpeg?auto=compress&cs=tinysrgb&w=600',
  'activities': 'https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg?auto=compress&cs=tinysrgb&w=600',
  'transport': 'https://images.pexels.com/photos/23192/pexels-photo-23192.jpeg?auto=compress&cs=tinysrgb&w=600',
  'other': 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=600',
};

function ServicesTab() {
  const [services, setServices] = useState<PmsService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PmsService | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'spa',
    description: '',
    price: 0,
    duration_minutes: 60,
    image_url: '',
    max_capacity: 1,
    is_active: true
  });

  const SERVICE_CATEGORIES = [
    { id: 'spa', label: 'Spa & Wellness', icon: Sparkles, color: 'pink' },
    { id: 'dining', label: 'Dining', icon: Receipt, color: 'amber' },
    { id: 'gym', label: 'Gym & Fitness', icon: Sparkles, color: 'emerald' },
    { id: 'parking', label: 'Parking', icon: Package, color: 'blue' },
    { id: 'bars', label: 'Bars & Lounges', icon: Receipt, color: 'purple' },
    { id: 'laundry', label: 'Laundry', icon: Sparkles, color: 'cyan' },
    { id: 'room_service', label: 'Room Service', icon: Receipt, color: 'orange' },
    { id: 'activities', label: 'Activities', icon: Sparkles, color: 'rose' },
    { id: 'transport', label: 'Transport', icon: Package, color: 'slate' },
    { id: 'other', label: 'Other', icon: Package, color: 'gray' },
  ];

  const load = useCallback(() => {
    setLoading(true);
    supabase.from('pms_services').select('*').order('category').order('name').then(({ data, error }) => {
      if (!error && data) setServices(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase.from('pms_services').update(form).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pms_services').insert([{ ...form }]);
        if (error) throw error;
      }
      setShowCreate(false);
      setEditing(null);
      setForm({ name: '', category: 'spa', description: '', price: 0, duration_minutes: 60, image_url: '', max_capacity: 1, is_active: true });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await supabase.from('pms_services').delete().eq('id', id);
      load();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await supabase.from('pms_services').update({ is_active: !current }).eq('id', id);
      load();
    } catch (err) {
      alert('Failed to update');
    }
  };

  const filteredServices = services.filter(s => {
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const grouped = filteredServices.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, PmsService[]>);

  const stats = {
    total: services.length,
    active: services.filter(s => s.is_active !== false).length,
    categories: new Set(services.map(s => s.category)).size,
  };

  if (loading) return <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hotel Services</h2>
          <p className="text-sm text-slate-500 mt-1">Manage all services, amenities, and offerings for guests</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100"><Package className="w-5 h-5 text-slate-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Services</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-xs text-slate-500">Active Services</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100"><BarChart3 className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.categories}</p>
              <p className="text-xs text-slate-500">Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterCategory('all')} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${filterCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            All ({services.length})
          </button>
          {SERVICE_CATEGORIES.map(cat => {
            const count = services.filter(s => s.category === cat.id).length;
            if (count === 0) return null;
            return (
              <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${filterCategory === cat.id ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Service Cards by Category */}
      {Object.entries(grouped).map(([category, items]) => {
        const catInfo = SERVICE_CATEGORIES.find(c => c.id === category) || SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1];
        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <catInfo.icon className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">{catInfo.label}</h3>
              <span className="text-sm text-slate-400">({items.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map(s => {
                const imageUrl = s.image_url || SERVICE_IMAGES[s.category] || SERVICE_IMAGES['other'];
                return (
                  <div key={s.id} className={`bg-white rounded-xl border overflow-hidden group ${s.is_active === false ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:shadow-xl hover:border-amber-200'} transition-all duration-300`}>
                    <div className="relative h-36 overflow-hidden">
                      <SafeImage src={imageUrl} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <button onClick={() => toggleActive(s.id, s.is_active ?? true)} className={`px-2 py-1 rounded-full text-xs font-semibold ${s.is_active !== false ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {s.is_active !== false ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <h4 className="font-semibold text-white truncate">{s.name}</h4>
                      </div>
                    </div>
                    <div className="p-4">
                      {s.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{s.description}</p>}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-amber-600">ETB {s.price.toLocaleString()}</span>
                        {s.duration_minutes && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration_minutes} min</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setEditing(s);
                          setForm({
                            name: s.name,
                            category: s.category,
                            description: s.description || '',
                            price: s.price,
                            duration_minutes: s.duration_minutes || 60,
                            image_url: s.image_url || '',
                            max_capacity: s.max_capacity || 1,
                            is_active: s.is_active ?? true
                          });
                        }} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition">
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDelete(s.id, s.name)} className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredServices.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">No services found</p>
          {searchQuery ? (
            <p className="text-sm text-slate-400">Try adjusting your search query</p>
          ) : (
            <button onClick={() => setShowCreate(true)} className="mt-4 text-amber-600 font-medium hover:text-amber-700">Add your first service</button>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal open={showCreate || !!editing} onClose={() => { setShowCreate(false); setEditing(null); setForm({ name: '', category: 'spa', description: '', price: 0, duration_minutes: 60, image_url: '', max_capacity: 1, is_active: true }); }} title={editing ? 'Edit Service' : 'Add New Service'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Service Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Full Body Massage" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Category *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
              {SERVICE_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Detailed description of the service..." />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Image URL (optional)</label>
            <input type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="https://example.com/service-image.jpg" />
            <p className="text-xs text-slate-400 mt-1">Leave empty to use category default image</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Price (ETB) *</label>
              <input type="number" required min="0" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Duration (minutes)</label>
              <input type="number" min="5" value={form.duration_minutes || ''} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Max Capacity</label>
            <input type="number" min="1" value={form.max_capacity || ''} onChange={e => setForm(f => ({ ...f, max_capacity: parseInt(e.target.value) || 1 }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="Maximum participants/guests" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowCreate(false); setEditing(null); }} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:from-amber-600 hover:to-amber-700 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DiningTab() {
  const [venues, setVenues] = useState<DiningVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<DiningVenue | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'restaurant',
    description: '',
    capacity: 50,
    min_spend_per_person: 0,
    opening_time: '07:00',
    closing_time: '22:00',
    is_active: true
  });

  interface DiningVenue {
    id: string;
    name: string;
    type: string;
    description?: string;
    capacity: number;
    min_spend_per_person: number;
    opening_time: string;
    closing_time: string;
    is_active: boolean;
    created_at: string;
  }

  const load = useCallback(() => {
    setLoading(true);
    supabase.from('pms_dining_venues').select('*').order('name').then(({ data, error }) => {
      if (!error && data) setVenues(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase.from('pms_dining_venues').update(form).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pms_dining_venues').insert([form]);
        if (error) throw error;
      }
      setShowCreate(false);
      setEditing(null);
      setForm({ name: '', type: 'restaurant', description: '', capacity: 50, min_spend_per_person: 0, opening_time: '07:00', closing_time: '22:00', is_active: true });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await supabase.from('pms_dining_venues').delete().eq('id', id);
      load();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await supabase.from('pms_dining_venues').update({ is_active: !current }).eq('id', id);
      load();
    } catch (err) {
      alert('Failed');
    }
  };

  if (loading) return <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" />;

  const venueTypes = [
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'bar', label: 'Bar/Lounge' },
    { id: 'cafe', label: 'Cafe' },
    { id: 'rooftop', label: 'Rooftop' },
    { id: 'poolside', label: 'Poolside' },
    { id: 'private_dining', label: 'Private Dining' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dining Venues</h2>
          <p className="text-sm text-slate-500 mt-1">Manage restaurants, bars, cafes and dining areas</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Add Venue
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {venues.map(venue => (
          <div key={venue.id} className={`bg-white rounded-xl border p-4 ${venue.is_active === false ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{venue.name}</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full capitalize">{venue.type}</span>
                </div>
                {venue.description && <p className="text-sm text-slate-500 mt-1">{venue.description}</p>}
              </div>
              <button onClick={() => toggleActive(venue.id, venue.is_active ?? true)} className={`px-2 py-1 rounded-full text-xs font-semibold ${venue.is_active !== false ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {venue.is_active !== false ? 'Active' : 'Inactive'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 text-sm">
              <div>
                <p className="text-slate-400">Capacity</p>
                <p className="font-medium text-slate-900">{venue.capacity} seats</p>
              </div>
              <div>
                <p className="text-slate-400">Hours</p>
                <p className="font-medium text-slate-900">{venue.opening_time} - {venue.closing_time}</p>
              </div>
              <div>
                <p className="text-slate-400">Min Spend</p>
                <p className="font-medium text-amber-600">ETB {venue.min_spend_per_person}/person</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => { setEditing(venue); setForm({ ...venue, description: venue.description || '' }); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleDelete(venue.id, venue.name)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {venues.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No dining venues configured.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-amber-600 font-medium">Add your first venue</button>
        </div>
      )}

      <Modal open={showCreate || !!editing} onClose={() => { setShowCreate(false); setEditing(null); }} title={editing ? 'Edit Venue' : 'Add Dining Venue'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Venue Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g., Sky Lounge Restaurant" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Type *</label>
            <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
              {venueTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Capacity</label>
              <input type="number" required min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 50 }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Opening</label>
              <input type="time" value={form.opening_time} onChange={e => setForm(f => ({ ...f, opening_time: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Closing</label>
              <input type="time" value={form.closing_time} onChange={e => setForm(f => ({ ...f, closing_time: e.target.value }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Min Spend per Person (ETB)</label>
            <input type="number" min="0" value={form.min_spend_per_person} onChange={e => setForm(f => ({ ...f, min_spend_per_person: parseInt(e.target.value) || 0 }))} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setShowCreate(false); setEditing(null); }} className="flex-1 py-2.5 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ParkingTab() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    spot_number: '',
    type: 'standard',
    price_per_hour: 50,
    price_per_day: 300,
    is_covered: false,
    has_ev_charger: false,
    is_active: true
  });

  interface ParkingSpot {
    id: string;
    spot_number: string;
    type: string;
    price_per_hour: number;
    price_per_day: number;
    is_covered: boolean;
    has_ev_charger: boolean;
    is_active: boolean;
  }

  const load = useCallback(() => {
    setLoading(true);
    supabase.from('pms_parking_spots').select('*').order('spot_number').then(({ data, error }) => {
      if (!error && data) setSpots(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('pms_parking_spots').insert([form]);
      setShowCreate(false);
      setForm({ spot_number: '', type: 'standard', price_per_hour: 50, price_per_day: 300, is_covered: false, has_ev_charger: false, is_active: true });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this parking spot?')) return;
    try {
      await supabase.from('pms_parking_spots').delete().eq('id', id);
      load();
    } catch (err) {
      alert('Failed');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await supabase.from('pms_parking_spots').update({ is_active: !current }).eq('id', id);
      load();
    } catch (err) {
      alert('Failed');
    }
  };

  if (loading) return <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Parking Spots</h2>
          <p className="text-sm text-slate-500 mt-1">Manage parking spaces and pricing</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Add Spot
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Spot</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Covered</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">EV</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Hourly</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Daily</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {spots.map(spot => (
              <tr key={spot.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{spot.spot_number}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{spot.type}</td>
                <td className="px-4 py-3">{spot.is_covered ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : '-'}</td>
                <td className="px-4 py-3">{spot.has_ev_charger ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : '-'}</td>
                <td className="px-4 py-3 text-slate-600">ETB {spot.price_per_hour}</td>
                <td className="px-4 py-3 text-slate-600">ETB {spot.price_per_day}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(spot.id, spot.is_active ?? true)} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${spot.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {spot.is_active !== false ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(spot.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Parking Spot">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Spot Number *</label>
              <input required value={form.spot_number} onChange={e => setForm(f => ({ ...f, spot_number: e.target.value.toUpperCase() }))} className="w-full mt-1 border rounded-lg px-3 py-2.5 text-sm" placeholder="A-01" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full mt-1 border rounded-lg px-3 py-2.5 text-sm">
                <option value="standard">Standard</option>
                <option value="compact">Compact</option>
                <option value="large">Large (SUV/Van)</option>
                <option value="disabled">Accessible</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Hourly Rate (ETB)</label>
              <input type="number" min="0" value={form.price_per_hour} onChange={e => setForm(f => ({ ...f, price_per_hour: parseInt(e.target.value) || 0 }))} className="w-full mt-1 border rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Daily Rate (ETB)</label>
              <input type="number" min="0" value={form.price_per_day} onChange={e => setForm(f => ({ ...f, price_per_day: parseInt(e.target.value) || 0 }))} className="w-full mt-1 border rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_covered} onChange={e => setForm(f => ({ ...f, is_covered: e.target.checked }))} className="rounded" />
              <span className="text-sm text-slate-700">Covered</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.has_ev_charger} onChange={e => setForm(f => ({ ...f, has_ev_charger: e.target.checked }))} className="rounded" />
              <span className="text-sm text-slate-700">EV Charger</span>
            </label>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Create Spot
          </button>
        </form>
      </Modal>
    </div>
  );
}

function BarsTab() {
  return DiningTab(); // Similar to dining
}

function GymTab() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    instructor: '',
    schedule_time: '08:00',
    duration_minutes: 60,
    max_participants: 20,
    price: 200,
    type: 'yoga',
    is_active: true
  });

  interface GymClass {
    id: string;
    name: string;
    instructor: string;
    schedule_time: string;
    duration_minutes: number;
    max_participants: number;
    price: number;
    type: string;
    is_active: boolean;
  }

  const load = useCallback(() => {
    setLoading(true);
    supabase.from('pms_gym_classes').select('*').order('schedule_time').then(({ data, error }) => {
      if (!error && data) setClasses(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabase.from('pms_gym_classes').insert([form]);
      setShowCreate(false);
      setForm({ name: '', instructor: '', schedule_time: '08:00', duration_minutes: 60, max_participants: 20, price: 200, type: 'yoga', is_active: true });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    try {
      await supabase.from('pms_gym_classes').delete().eq('id', id);
      load();
    } catch (err) {
      alert('Failed');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await supabase.from('pms_gym_classes').update({ is_active: !current }).eq('id', id);
      load();
    } catch (err) {
      alert('Failed');
    }
  };

  if (loading) return <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" />;

  const classTypes = [
    { id: 'yoga', label: 'Yoga' },
    { id: 'pilates', label: 'Pilates' },
    { id: 'hiit', label: 'HIIT' },
    { id: 'spin', label: 'Spin' },
    { id: 'zumba', label: 'Zumba' },
    { id: 'strength', label: 'Strength' },
    { id: 'boxing', label: 'Boxing' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gym & Spa Classes</h2>
          <p className="text-sm text-slate-500 mt-1">Manage fitness classes and wellness sessions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {classes.map(cls => (
          <div key={cls.id} className={`bg-white rounded-xl border p-4 ${cls.is_active === false ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{cls.name}</h3>
                <p className="text-sm text-slate-500">{cls.instructor}</p>
              </div>
              <button onClick={() => toggleActive(cls.id, cls.is_active ?? true)} className={`px-2 py-1 rounded-full text-xs font-semibold ${cls.is_active !== false ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {cls.is_active !== false ? 'Active' : 'Inactive'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
              <div>
                <p className="text-slate-400">Time</p>
                <p className="font-medium text-slate-900">{cls.schedule_time}</p>
              </div>
              <div>
                <p className="text-slate-400">Duration</p>
                <p className="font-medium text-slate-900">{cls.duration_minutes} min</p>
              </div>
              <div>
                <p className="text-slate-400">Max</p>
                <p className="font-medium text-slate-900">{cls.max_participants}</p>
              </div>
              <div>
                <p className="text-slate-400">Price</p>
                <p className="font-medium text-amber-600">ETB {cls.price}</p>
              </div>
            </div>
            <div className="flex items-center justify-end mt-4">
              <button onClick={() => handleDelete(cls.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No classes configured.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-amber-600 font-medium">Add your first class</button>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Class">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Class Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 border rounded-lg px-3 py-2.5 text-sm" placeholder="Morning Yoga" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Instructor *</label>
              <input required value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} className="w-full mt-1 border rounded-lg px-3 py-2.5 text-sm" placeholder="Instructor name" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm">
                {classTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Time</label>
              <input type="time" value={form.schedule_time} onChange={e => setForm(f => ({ ...f, schedule_time: e.target.value }))} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Duration</label>
              <input type="number" min="15" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Max</label>
              <input type="number" min="1" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: parseInt(e.target.value) || 20 }))} className="w-full mt-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Price (ETB)</label>
            <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))} className="w-full mt-1 border rounded-lg px-3 py-2.5 text-sm" />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Create Class
          </button>
        </form>
      </Modal>
    </div>
  );
}

function SettingsTab() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<{ id: string; full_name: string; email?: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, email, role').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data) setUsers(data);
      setLoading(false);
    });
  }, []);

  const updateRole = async (id: string, newRole: string) => {
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', id);
      setUsers(u => u.map(x => x.id === id ? { ...x, role: newRole } : x));
    } catch (err) {
      alert('Failed to update role');
    }
  };

  if (loading) return <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mt-20" />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Admin Settings</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">User Management</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase pb-3">User</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase pb-3">Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="py-3">
                  <p className="font-medium text-slate-900">{u.full_name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </td>
                <td className="py-3">
                  {u.id === profile?.id ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">{u.role}</span>
                  ) : (
                    <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 text-sm">
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="front_desk">Front Desk</option>
                      <option value="housekeeping">Housekeeping</option>
                      <option value="finance">Finance</option>
                      <option value="customer">Customer</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">System Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Database:</span><span className="ml-2 font-medium text-slate-900">PostgreSQL (Supabase)</span></div>
          <div><span className="text-slate-500">Backend:</span><span className="ml-2 font-medium text-slate-900">Edge Functions</span></div>
          <div><span className="text-slate-500">Frontend:</span><span className="ml-2 font-medium text-slate-900">React + TypeScript</span></div>
          <div><span className="text-slate-500">Version:</span><span className="ml-2 font-medium text-slate-900">1.0.0</span></div>
        </div>
      </div>
    </div>
  );
}

const TABS: { id: TabId; label: string; icon: React.ElementType; roles: string[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'front_desk', 'housekeeping', 'finance'] },
  { id: 'frontdesk', label: 'Front Desk', icon: Key, roles: ['admin', 'manager', 'front_desk'] },
  { id: 'rooms', label: 'Rooms', icon: Bed, roles: ['admin', 'manager', 'front_desk', 'housekeeping'] },
  { id: 'guests', label: 'Guests', icon: Users, roles: ['admin', 'manager', 'front_desk'] },
  { id: 'reservations', label: 'Reservations', icon: Calendar, roles: ['admin', 'manager', 'front_desk'] },
  { id: 'housekeeping', label: 'Housekeeping', icon: Sparkles, roles: ['admin', 'manager', 'housekeeping'] },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'manager', 'housekeeping'] },
  { id: 'loyalty', label: 'Loyalty', icon: Award, roles: ['admin', 'manager', 'front_desk'] },
  { id: 'events', label: 'Events', icon: LayoutGrid, roles: ['admin', 'manager', 'front_desk'] },
  { id: 'billing', label: 'Billing', icon: CreditCard, roles: ['admin', 'manager', 'front_desk', 'finance'] },
  { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'finance'] },
  { id: 'audit_night', label: 'Night Audit', icon: Clock3, roles: ['admin', 'manager', 'finance', 'front_desk'] },
  { id: 'rates', label: 'Rates', icon: TrendingUp, roles: ['admin', 'manager'] },
  { id: 'inventory', label: 'Inventory', icon: Box, roles: ['admin', 'manager'] },
  { id: 'staff', label: 'Staff', icon: UsersRound, roles: ['admin', 'manager'] },
  { id: 'channels', label: 'Channels', icon: Radio, roles: ['admin', 'manager'] },
  { id: 'pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'manager', 'front_desk'] },
  { id: 'roomtypes', label: 'Room Types', icon: Bed, roles: ['admin'] },
  { id: 'services', label: 'All Services', icon: Package, roles: ['admin'] },
  { id: 'dining', label: 'Dining', icon: Receipt, roles: ['admin'] },
  { id: 'parking', label: 'Parking', icon: Package, roles: ['admin'] },
  { id: 'bars', label: 'Bars', icon: Receipt, roles: ['admin'] },
  { id: 'gym', label: 'Gym & Spa', icon: Sparkles, roles: ['admin'] },
  { id: 'audit', label: 'Audit Log', icon: Shield, roles: ['admin', 'manager'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export default function PmsDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const role = profile?.role || 'front_desk';
  const visibleTabs = TABS.filter(t => t.roles.includes(role));
  return (
    <div className="flex min-h-[calc(100vh-8rem)] -m-8">
      <aside className="w-56 bg-slate-900 text-white flex-shrink-0">
        <div className="p-4 border-b border-slate-700"><h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">PMS Modules</h2></div>
        <nav className="p-2 space-y-1">
          {visibleTabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}<ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'frontdesk' && <FrontDeskOperations />}
        {activeTab === 'rooms' && <RoomsTab />}
        {activeTab === 'guests' && <GuestsTab />}
        {activeTab === 'reservations' && <ReservationsTab />}
        {activeTab === 'housekeeping' && <HousekeepingDashboard />}
        {activeTab === 'maintenance' && <MaintenanceDashboard />}
        {activeTab === 'billing' && <BillingTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'roomtypes' && <RoomTypesTab />}
        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'dining' && <DiningTab />}
        {activeTab === 'parking' && <ParkingTab />}
        {activeTab === 'bars' && <BarsTab />}
        {activeTab === 'gym' && <GymTab />}
        {activeTab === 'audit' && <AuditTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}
