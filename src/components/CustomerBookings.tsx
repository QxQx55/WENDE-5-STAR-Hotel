import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Loader, MapPin, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import type { Room } from '../types';

type CustomerReservation = {
  id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  status: string;
  special_requests: string | null;
  rooms: Pick<Room, 'room_number' | 'room_type' | 'price_per_night'> | null;
};

const dateValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export default function CustomerBookings() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedRoomId = searchParams.get('room') ?? '';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<CustomerReservation[]>([]);
  const [checkIn, setCheckIn] = useState(() => dateValue(new Date(Date.now() + 86_400_000)));
  const [checkOut, setCheckOut] = useState(() => dateValue(new Date(Date.now() + 2 * 86_400_000)));
  const [roomId, setRoomId] = useState(requestedRoomId);
  const [guestCount, setGuestCount] = useState(1);
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bookingSetupReady, setBookingSetupReady] = useState(false);

  useEffect(() => {
    if (requestedRoomId) setRoomId(requestedRoomId);
  }, [requestedRoomId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const baseRoomsResult = await supabase
          .from('rooms')
          .select('*')
          .eq('status', 'Available')
          .order('room_number');
        if (baseRoomsResult.error) throw baseRoomsResult.error;

        if (checkOut <= checkIn) {
          if (active) {
            setRooms((baseRoomsResult.data ?? []) as Room[]);
            setReservations([]);
            setBookingSetupReady(false);
          }
          return;
        }

        const roomsResult = await supabase.rpc('get_available_rooms', {
          requested_check_in: checkIn,
          requested_check_out: checkOut,
        });
        if (roomsResult.error) {
          const queryError = roomsResult.error as { code?: string; message?: string };
          if (queryError.code === 'PGRST202' || queryError.code === '42883') {
            if (active) {
              setRooms((baseRoomsResult.data ?? []) as Room[]);
              setReservations([]);
              setBookingSetupReady(false);
              setNotice('Room browsing works, but online reservations need the customer-booking database migration applied in Supabase.');
            }
            return;
          }
          throw roomsResult.error;
        }

        let customerReservations: CustomerReservation[] = [];
        const guestResult = await supabase.from('guests').select('id').eq('user_id', user.id).maybeSingle();
        if (guestResult.error) {
          const queryError = guestResult.error as { code?: string };
          if (queryError.code === '42703' || queryError.code === 'PGRST204') {
            if (active) {
              setRooms((roomsResult.data ?? []) as Room[]);
              setReservations([]);
              setBookingSetupReady(false);
              setNotice('Room browsing works, but online reservations need the customer-booking database migration applied in Supabase.');
            }
            return;
          }
          throw guestResult.error;
        }
        if (guestResult.data) {
          const reservationsResult = await supabase
            .from('reservations')
            .select('id, check_in_date, check_out_date, number_of_guests, status, special_requests, rooms(room_number, room_type, price_per_night)')
            .eq('guest_id', guestResult.data.id)
            .order('created_at', { ascending: false });
          if (reservationsResult.error) throw reservationsResult.error;
          customerReservations = (reservationsResult.data ?? []) as CustomerReservation[];
        }

        if (active) {
          setRooms((roomsResult.data ?? []) as Room[]);
          setReservations(customerReservations);
          setBookingSetupReady(true);
          setNotice('');
        }
      } catch (loadError) {
        if (active) {
          const message = typeof loadError === 'object' && loadError !== null && 'message' in loadError
            ? String(loadError.message)
            : 'Unable to load your bookings.';
          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [user, checkIn, checkOut]);

  const selectedRoom = useMemo(() => rooms.find((room) => room.id === roomId) ?? null, [rooms, roomId]);
  const stayNights = Math.max(
    0,
    Math.round((new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86_400_000),
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!user) {
      setError('Please sign in to create a booking.');
      return;
    }
    if (!bookingSetupReady) {
      setError('Online reservations are not enabled yet. Apply the customer-booking migration in Supabase, then reload this page.');
      return;
    }
    if (!selectedRoom) {
      setError('Choose an available room.');
      return;
    }
    if (checkIn < dateValue(new Date()) || checkOut <= checkIn) {
      setError('Choose a future check-in date and a check-out date after check-in.');
      return;
    }
    if (guestCount < 1 || guestCount > selectedRoom.max_occupancy) {
      setError(`This room allows up to ${selectedRoom.max_occupancy} guests.`);
      return;
    }

    setSaving(true);
    try {
      const { data: availableRooms, error: availabilityError } = await supabase.rpc('get_available_rooms', {
        requested_check_in: checkIn,
        requested_check_out: checkOut,
      });
      if (availabilityError) throw availabilityError;
      if (!availableRooms?.some((room: Room) => room.id === selectedRoom.id)) {
        throw new Error('That room is no longer available for the selected dates. Please choose another room or dates.');
      }

      let guestResult = await supabase.from('guests').select('id').eq('user_id', user.id).maybeSingle();
      if (guestResult.error) throw guestResult.error;
      if (!guestResult.data) {
        const nameParts = (profile?.full_name || user.user_metadata?.full_name || 'Hotel Guest').trim().split(/\s+/);
        guestResult = await supabase
          .from('guests')
          .insert([{
            user_id: user.id,
            first_name: nameParts[0] || 'Hotel',
            last_name: nameParts.slice(1).join(' ') || 'Guest',
            email: user.email ?? null,
            phone: phone.trim(),
            id_number: null,
          }])
          .select('id')
          .single();
        if (guestResult.error) throw guestResult.error;
      }

      const { error: bookingError } = await supabase.from('reservations').insert([{
        guest_id: guestResult.data.id,
        room_id: selectedRoom.id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        number_of_guests: guestCount,
        status: 'Pending',
        special_requests: specialRequests.trim() || null,
        created_by: user.id,
      }]);
      if (bookingError) {
        if (bookingError.code === '23P01') {
          throw new Error('That room was just booked for these dates. Please choose another room or dates.');
        }
        throw bookingError;
      }

      setNotice('Your booking request was sent. The hotel will confirm it shortly.');
      setSpecialRequests('');
      const { data: refreshed, error: refreshError } = await supabase
        .from('reservations')
        .select('id, check_in_date, check_out_date, number_of_guests, status, special_requests, rooms(room_number, room_type, price_per_night)')
        .eq('guest_id', guestResult.data.id)
        .order('created_at', { ascending: false });
      if (refreshError) throw refreshError;
      setReservations((refreshed ?? []) as CustomerReservation[]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to create booking.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center"><Loader className="h-8 w-8 animate-spin text-slate-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">Guest portal</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">My bookings</h1>
        <p className="mt-2 text-slate-600">Request a stay and keep track of your reservations.</p>
      </header>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</div>}

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Request a reservation</h2>
            <p className="mt-1 text-sm text-slate-600">A reservation is pending until the hotel confirms it.</p>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Available room
            <select required value={roomId} onChange={(event) => setRoomId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number} · {room.room_type} · ${Number(room.price_per_night).toFixed(2)}/night
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Check-in
              <input type="date" required min={dateValue(new Date())} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Check-out
              <input type="date" required min={checkIn || dateValue(new Date())} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Guests
              <input type="number" required min={1} max={selectedRoom?.max_occupancy ?? 10} value={guestCount} onChange={(event) => setGuestCount(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Contact phone
              <input type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Special requests <span className="font-normal text-slate-500">(optional)</span>
            <textarea rows={3} value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>

          {selectedRoom && stayNights > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4 text-sm">
              <span className="text-slate-600">{stayNights} {stayNights === 1 ? 'night' : 'nights'} · estimated room total</span>
              <span className="font-semibold text-slate-900">${(Number(selectedRoom.price_per_night) * stayNights).toFixed(2)}</span>
            </div>
          )}

          <button type="submit" disabled={saving || !bookingSetupReady || rooms.length === 0} className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'Sending request…' : 'Request booking'}
          </button>
          {rooms.length === 0 && <p className="text-sm text-slate-500">There are no rooms currently marked available.</p>}
        </form>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Reservation history</h2>
            <p className="mt-1 text-sm text-slate-600">Bookings connected to your account.</p>
          </div>
          {reservations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              No reservations yet. Start by requesting your first stay.
            </div>
          ) : reservations.map((reservation) => (
            <article key={reservation.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {reservation.rooms ? `Room ${reservation.rooms.room_number} · ${reservation.rooms.room_type}` : 'Hotel reservation'}
                  </h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="h-4 w-4" />{reservation.check_in_date} – {reservation.check_out_date}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Users className="h-4 w-4" />{reservation.number_of_guests} guests</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">{reservation.status}</span>
              </div>
              {reservation.rooms && (
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-800"><MapPin className="h-4 w-4" />${Number(reservation.rooms.price_per_night).toFixed(2)} per night</p>
              )}
              {reservation.special_requests && <p className="mt-3 text-sm text-slate-600">{reservation.special_requests}</p>}
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}
