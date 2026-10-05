import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Utensils, CarFront, Crown, ConciergeBell, Loader, CalendarDays, Clock3, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

type CatalogItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  item_type: 'service' | 'food';
  price: number;
  image_url: string;
};

type ExperienceBooking = {
  id: string;
  booking_type: string;
  booking_date: string;
  start_time: string | null;
  party_size: number;
  status: string;
  special_requests: string | null;
  hotel_catalog: Pick<CatalogItem, 'name' | 'image_url'> | null;
};

const experiences = [
  { type: 'parking', name: 'Valet & Parking', description: 'Reserve secure valet parking before you arrive.', icon: CarFront, image: 'https://images.pexels.com/photos/1004409/pexels-photo-1004409.jpeg' },
  { type: 'dining', name: 'Restaurant Table', description: 'Book a table for breakfast, lunch, or dinner.', icon: Utensils, image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg' },
  { type: 'gym', name: 'Fitness & Gym', description: 'Reserve a guided workout or personal training session.', icon: Dumbbell, image: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg' },
  { type: 'vip', name: 'VIP Packages', description: 'Request a tailored premium arrival and stay package.', icon: Crown, image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg' },
] as const;

const today = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const errorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return fallback;
};

export default function ExperiencesPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [bookings, setBookings] = useState<ExperienceBooking[]>([]);
  const [bookingType, setBookingType] = useState<string>('dining');
  const [itemId, setItemId] = useState('');
  const [bookingDate, setBookingDate] = useState(today());
  const [startTime, setStartTime] = useState('19:00');
  const [partySize, setPartySize] = useState(2);
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [requests, setRequests] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedExperience = experiences.find((experience) => experience.type === bookingType) ?? experiences[0];
  const foodItems = useMemo(() => catalog.filter((item) => item.item_type === 'food'), [catalog]);
  const serviceItems = useMemo(() => catalog.filter((item) => item.item_type === 'service'), [catalog]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const catalogResult = await supabase.from('hotel_catalog').select('*').eq('active', true).order('item_type').order('name');
        if (catalogResult.error) throw catalogResult.error;

        let customerBookings: ExperienceBooking[] = [];
        if (user) {
          const bookingsResult = await supabase
            .from('hotel_experience_bookings')
            .select('id, booking_type, booking_date, start_time, party_size, status, special_requests, hotel_catalog(name, image_url)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (bookingsResult.error) throw bookingsResult.error;
          customerBookings = (bookingsResult.data ?? []) as ExperienceBooking[];
        }

        if (active) {
          setCatalog((catalogResult.data ?? []) as CatalogItem[]);
          setBookings(customerBookings);
        }
      } catch (loadError) {
        if (active) setError(errorMessage(loadError, 'Unable to load hotel experiences.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [user]);

  const chooseExperience = (type: string) => {
    setBookingType(type);
    setItemId('');
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`${location.pathname}?experience=${type}`)}`);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedType = params.get('experience');
    if (requestedType && experiences.some((experience) => experience.type === requestedType)) {
      setBookingType(requestedType);
    }
  }, [location.search]);

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (bookingDate < today()) {
      setError('Choose today or a future date.');
      return;
    }
    if (bookingType === 'dining' && (partySize < 1 || partySize > 20)) {
      setError('Table bookings support 1 to 20 guests.');
      return;
    }

    setSaving(true);
    try {
      const { data: guest, error: guestLookupError } = await supabase
        .from('guests')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (guestLookupError) throw guestLookupError;

      let guestId = guest?.id as string | undefined;
      if (!guestId) {
        const nameParts = (profile?.full_name || user.user_metadata?.full_name || 'Hotel Guest').trim().split(/\s+/);
        const { data: createdGuest, error: createGuestError } = await supabase
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
        if (createGuestError) throw createGuestError;
        guestId = createdGuest.id;
      }

      const { error: insertError } = await supabase.from('hotel_experience_bookings').insert([{
        user_id: user.id,
        guest_id: guestId,
        booking_type: bookingType,
        catalog_item_id: itemId || null,
        booking_date: bookingDate,
        start_time: bookingType === 'parking' ? null : startTime,
        party_size: partySize,
        vehicle_details: bookingType === 'parking' ? requests.trim() || null : null,
        special_requests: bookingType === 'parking' ? null : requests.trim() || null,
        status: 'Pending',
      }]);
      if (insertError) throw insertError;

      setNotice(`Your ${selectedExperience.name.toLowerCase()} request was received. The hotel team will confirm it shortly.`);
      setRequests('');
      const { data: refreshed, error: refreshError } = await supabase
        .from('hotel_experience_bookings')
        .select('id, booking_type, booking_date, start_time, party_size, status, special_requests, hotel_catalog(name, image_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (refreshError) throw refreshError;
      setBookings((refreshed ?? []) as ExperienceBooking[]);
    } catch (submitError) {
      setError(errorMessage(submitError, 'Unable to submit your request.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader className="h-8 w-8 animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-12">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 text-white">
        <img src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg" alt="Luxury hotel lounge" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="relative px-8 py-16 sm:px-12 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">Make your stay memorable</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold sm:text-5xl">More than a room. A complete hotel experience.</h1>
          <p className="mt-4 max-w-xl text-slate-200">Explore dining, wellness, valet parking, and VIP arrangements—all in one place.</p>
        </div>
      </header>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</div>}

      <section>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">On-property reservations</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Reserve an experience</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {experiences.map(({ type, name, description, icon: Icon, image }) => (
            <button key={type} onClick={() => chooseExperience(type)} className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${bookingType === type ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'}`}>
              <div className="relative h-40 overflow-hidden">
                <img src={image} alt={name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 p-2 text-slate-900"><Icon className="h-5 w-5" /></span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900">{name}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {user && (
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <form onSubmit={submitRequest} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <selectedExperience.icon className="h-6 w-6 text-amber-700" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Request {selectedExperience.name}</h2>
                <p className="text-sm text-slate-600">Your request is pending until confirmed by the hotel.</p>
              </div>
            </div>
            {(bookingType === 'dining' || bookingType === 'gym' || bookingType === 'vip') && (
              <label className="block text-sm font-medium text-slate-700">
                {bookingType === 'dining' ? 'Menu selection (optional)' : bookingType === 'gym' ? 'Fitness service (optional)' : 'VIP package (optional)'}
                <select value={itemId} onChange={(event) => setItemId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">No selection yet — discuss with the hotel</option>
                  {(bookingType === 'dining' ? foodItems : serviceItems).map((item) => (
                    <option key={item.id} value={item.id}>{item.name} · ${Number(item.price).toFixed(2)}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">Date<input required type="date" min={today()} value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              {bookingType !== 'parking' && <label className="block text-sm font-medium text-slate-700">Time<input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">Guests / party size<input required type="number" min={1} max={bookingType === 'dining' ? 20 : 10} value={partySize} onChange={(event) => setPartySize(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
              {bookingType === 'parking' && <label className="block text-sm font-medium text-slate-700">Contact phone<input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>}
            </div>
            <label className="block text-sm font-medium text-slate-700">
              {bookingType === 'parking' ? 'Vehicle details and arrival notes' : 'Special requests'}
              <textarea rows={3} required={bookingType === 'parking'} value={requests} onChange={(event) => setRequests(event.target.value)} placeholder={bookingType === 'parking' ? 'Vehicle make, model, color, and plate number' : 'Dietary needs, training goals, celebration details…'} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <button disabled={saving} className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? 'Sending request…' : 'Send reservation request'}</button>
          </form>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Your requests</h2>
              <p className="mt-1 text-sm text-slate-600">Keep track of your hotel experience reservations.</p>
            </div>
            {bookings.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No experience reservations yet.</p> : bookings.map((booking) => (
              <article key={booking.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold capitalize text-slate-900">{booking.hotel_catalog?.name ?? booking.booking_type.replace('_', ' ')}</h3>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{booking.status}</span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="h-4 w-4" />{booking.booking_date}</p>
                {booking.start_time && <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Clock3 className="h-4 w-4" />{booking.start_time.slice(0, 5)}</p>}
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><Users className="h-4 w-4" />{booking.party_size} guests</p>
                {booking.special_requests && <p className="mt-2 text-sm text-slate-600">{booking.special_requests}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      <CatalogSection title="Hotel services" description="Wellness, fitness, and guest services available during your stay." items={serviceItems} icon={<ConciergeBell className="h-5 w-5" />} />
      <CatalogSection title="Dining & food" description="Browse the kitchen’s service and dining offerings." items={foodItems} icon={<Utensils className="h-5 w-5" />} />
    </div>
  );
}

function CatalogSection({ title, description, items, icon }: { title: string; description: string; items: CatalogItem[]; icon: ReactNode }) {
  return (
    <section>
      <div className="mb-6 flex items-start gap-3">
        <span className="rounded-lg bg-amber-100 p-2 text-amber-800">{icon}</span>
        <div><h2 className="text-2xl font-bold text-slate-900">{title}</h2><p className="mt-1 text-slate-600">{description}</p></div>
      </div>
      {items.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">No items are listed yet. Add services and menu items in the hotel_catalog table.</p> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <img src={item.image_url} alt={item.name} className="h-48 w-full object-cover" loading="lazy" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-900">{item.name}</h3><span className="whitespace-nowrap font-semibold text-amber-800">${Number(item.price).toFixed(2)}</span></div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{item.category}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
