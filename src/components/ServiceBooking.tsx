import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
}

interface ServiceBooking {
  id: string;
  service_id: string;
  booking_date: string;
  time_slot: string;
  quantity: number;
  total_price: number;
  status: string;
  services?: Service;
}

interface Reservation {
  id: string;
  guest_id: string;
}

export default function ServiceBooking() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    reservation_id: '',
    booking_date: '',
    time_slot: '',
    quantity: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!user?.id) return;

      const [servicesRes, bookingsRes, reservationsRes] = await Promise.all([
        supabase.from('services').select('*').eq('active', true),
        supabase
          .from('service_bookings')
          .select('*, services(*)')
          .eq('guest_id', user.id)
          .order('booking_date', { ascending: false }),
        supabase.from('reservations').select('id, guest_id').eq('guest_id', user.id),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (reservationsRes.error) throw reservationsRes.error;

      setServices(servicesRes.data || []);
      setBookings(bookingsRes.data || []);
      setReservations(reservationsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !formData.reservation_id) {
      alert('Please select all required fields');
      return;
    }

    try {
      const totalPrice = selectedService.price * formData.quantity;

      const { error } = await supabase.from('service_bookings').insert([
        {
          guest_id: user?.id,
          service_id: selectedService.id,
          reservation_id: formData.reservation_id,
          booking_date: formData.booking_date,
          time_slot: formData.time_slot,
          quantity: formData.quantity,
          total_price: totalPrice,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      setShowModal(false);
      setSelectedService(null);
      setFormData({
        reservation_id: '',
        booking_date: '',
        time_slot: '',
        quantity: 1,
      });
      fetchData();
    } catch (error) {
      console.error('Error booking service:', error);
      alert('Error booking service. Please try again.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Error cancelling booking. Please try again.');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'spa':
        return 'bg-pink-100 text-pink-800';
      case 'swimming':
        return 'bg-blue-100 text-blue-800';
      case 'food':
        return 'bg-amber-100 text-amber-800';
      case 'club':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'pending' ? (
      <Clock className="w-4 h-4" />
    ) : (
      <CheckCircle className="w-4 h-4" />
    );
  };

  if (loading) {
    return <div className="p-6">Loading services...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Book Services</h2>
        <p className="text-slate-600 mt-1">
          Enhance your stay with spa, swimming, club, and dining services
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-slate-900">{service.name}</h3>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                  service.category
                )}`}
              >
                {service.category}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{service.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-slate-900">${service.price}</span>
              <button
                onClick={() => {
                  setSelectedService(service);
                  setShowModal(true);
                }}
                className="bg-slate-900 text-white px-3 py-1 rounded text-sm hover:bg-slate-800 transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Book
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Your Bookings</h3>
        {bookings.length === 0 ? (
          <p className="text-slate-500">No service bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">
                    {booking.services?.name}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {new Date(booking.booking_date).toLocaleDateString()} at {booking.time_slot}
                  </p>
                  <p className="text-sm text-slate-600">
                    Quantity: {booking.quantity} × ${booking.services?.price} = $
                    {booking.total_price}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {getStatusIcon(booking.status)}
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-red-600 hover:text-red-700 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">{selectedService.name}</h3>
              <p className="text-slate-600 mt-1">${selectedService.price}</p>
            </div>

            <form onSubmit={handleBookService} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Active Reservation *
                </label>
                <select
                  required
                  value={formData.reservation_id}
                  onChange={(e) =>
                    setFormData({ ...formData, reservation_id: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                >
                  <option value="">Select a reservation</option>
                  {reservations.map((res) => (
                    <option key={res.id} value={res.id}>
                      Reservation {res.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.booking_date}
                  onChange={(e) =>
                    setFormData({ ...formData, booking_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Time Slot *
                </label>
                <input
                  type="time"
                  required
                  value={formData.time_slot}
                  onChange={(e) =>
                    setFormData({ ...formData, time_slot: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">
                  Total: ${selectedService.price * formData.quantity}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedService(null);
                    setFormData({
                      reservation_id: '',
                      booking_date: '',
                      time_slot: '',
                      quantity: 1,
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Book Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
