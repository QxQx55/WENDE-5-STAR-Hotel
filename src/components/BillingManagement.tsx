import { useState, useEffect } from 'react';
import { supabase, Reservation, Service, ReservationService, Invoice, Payment } from '../lib/supabase';
import { Search, Plus, Receipt, DollarSign, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function BillingManagement() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [reservationServices, setReservationServices] = useState<ReservationService[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceForm, setServiceForm] = useState({
    service_id: '',
    quantity: 1,
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_method: 'Cash' as 'Cash' | 'Card' | 'Mobile',
    transaction_reference: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedReservation) {
      fetchReservationDetails(selectedReservation.id);
    }
  }, [selectedReservation]);

  const fetchData = async () => {
    try {
      const [reservationsRes, servicesRes] = await Promise.all([
        supabase
          .from('reservations')
          .select('*, guests(*), rooms(*)')
          .in('status', ['Checked-In', 'Checked-Out'])
          .order('created_at', { ascending: false }),
        supabase.from('services').select('*').eq('active', true).order('category', { ascending: true }),
      ]);

      if (reservationsRes.error) throw reservationsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      setReservations(reservationsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationDetails = async (reservationId: string) => {
    try {
      const [servicesRes, invoiceRes] = await Promise.all([
        supabase
          .from('reservation_services')
          .select('*, services(*)')
          .eq('reservation_id', reservationId),
        supabase
          .from('invoices')
          .select('*')
          .eq('reservation_id', reservationId)
          .maybeSingle(),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (invoiceRes.error) throw invoiceRes.error;

      setReservationServices(servicesRes.data || []);
      setInvoice(invoiceRes.data);

      if (invoiceRes.data) {
        const paymentsRes = await supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', invoiceRes.data.id);

        if (paymentsRes.error) throw paymentsRes.error;
        setPayments(paymentsRes.data || []);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching reservation details:', error);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;

    const service = services.find((s) => s.id === serviceForm.service_id);
    if (!service) return;

    try {
      const { error } = await supabase.from('reservation_services').insert([
        {
          reservation_id: selectedReservation.id,
          service_id: serviceForm.service_id,
          quantity: serviceForm.quantity,
          unit_price: service.price,
          total_price: service.price * serviceForm.quantity,
        },
      ]);

      if (error) throw error;

      setShowServiceModal(false);
      setServiceForm({ service_id: '', quantity: 1 });
      fetchReservationDetails(selectedReservation.id);
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Error adding service. Please try again.');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedReservation) return;

    try {
      const checkIn = new Date(selectedReservation.check_in_date);
      const checkOut = new Date(selectedReservation.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const roomCharges = (selectedReservation.rooms?.price_per_night || 0) * nights;

      const serviceCharges = reservationServices.reduce((sum, rs) => sum + rs.total_price, 0);

      const subtotal = roomCharges + serviceCharges;
      const taxRate = 10;
      const serviceChargeRate = 15;
      const taxAmount = (subtotal * taxRate) / 100;
      const serviceChargeAmount = (subtotal * serviceChargeRate) / 100;
      const totalAmount = subtotal + taxAmount + serviceChargeAmount;

      const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const { error } = await supabase.from('invoices').insert([
        {
          reservation_id: selectedReservation.id,
          invoice_number: invoiceNumber,
          room_charges: roomCharges,
          service_charges: serviceCharges,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          service_charge_rate: serviceChargeRate,
          service_charge_amount: serviceChargeAmount,
          total_amount: totalAmount,
          payment_status: 'Pending',
        },
      ]);

      if (error) throw error;

      fetchReservationDetails(selectedReservation.id);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      const { error } = await supabase.from('payments').insert([
        {
          invoice_id: invoice.id,
          amount: paymentForm.amount,
          payment_method: paymentForm.payment_method,
          transaction_reference: paymentForm.transaction_reference || null,
          received_by: user?.id,
        },
      ]);

      if (error) throw error;

      const totalPaid = [...payments, { amount: paymentForm.amount } as Payment].reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      const newStatus: 'Pending' | 'Partial' | 'Paid' =
        totalPaid >= invoice.total_amount ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending';

      await supabase.from('invoices').update({ payment_status: newStatus }).eq('id', invoice.id);

      setShowPaymentModal(false);
      setPaymentForm({
        amount: 0,
        payment_method: 'Cash',
        transaction_reference: '',
      });
      fetchReservationDetails(selectedReservation!.id);
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment. Please try again.');
    }
  };

  const filteredReservations = reservations.filter((reservation) => {
    const guest = reservation.guests;
    const room = reservation.rooms;
    return (
      guest?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room?.room_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = invoice ? invoice.total_amount - totalPaid : 0;

  if (loading) {
    return <div className="p-6">Loading billing information...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Billing & Payment</h2>
        <p className="text-slate-600 mt-1">Manage invoices and process payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Active Reservations</h3>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredReservations.map((reservation) => (
                <button
                  key={reservation.id}
                  onClick={() => setSelectedReservation(reservation)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedReservation?.id === reservation.id
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900 text-sm">
                    {reservation.guests?.first_name} {reservation.guests?.last_name}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Room {reservation.rooms?.room_number} - {reservation.status}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedReservation ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Reservation Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Guest</p>
                    <p className="font-medium text-slate-900">
                      {selectedReservation.guests?.first_name} {selectedReservation.guests?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Room</p>
                    <p className="font-medium text-slate-900">
                      {selectedReservation.rooms?.room_number} - {selectedReservation.rooms?.room_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Check-in</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedReservation.check_in_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Check-out</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedReservation.check_out_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Additional Services</h3>
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="bg-slate-900 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Service
                  </button>
                </div>

                {reservationServices.length > 0 ? (
                  <div className="space-y-2">
                    {reservationServices.map((rs) => (
                      <div key={rs.id} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{rs.services?.name}</p>
                          <p className="text-xs text-slate-600">
                            ${rs.unit_price.toFixed(2)} × {rs.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-slate-900">${rs.total_price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No additional services added yet.</p>
                )}
              </div>

              {invoice ? (
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Invoice {invoice.invoice_number}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.payment_status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.payment_status === 'Partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invoice.payment_status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Room Charges</span>
                      <span className="text-slate-900">${invoice.room_charges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Service Charges</span>
                      <span className="text-slate-900">${invoice.service_charges.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="text-slate-900">${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax ({invoice.tax_rate}%)</span>
                      <span className="text-slate-900">${invoice.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Service Charge ({invoice.service_charge_rate}%)</span>
                      <span className="text-slate-900">${invoice.service_charge_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-slate-300">
                      <span className="text-slate-900">Total Amount</span>
                      <span className="text-slate-900">${invoice.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {payments.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-slate-900 mb-3">Payment History</h4>
                      <div className="space-y-2">
                        {payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex justify-between items-center py-2 border-b border-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              {payment.payment_method === 'Cash' && <Banknote className="w-4 h-4 text-slate-600" />}
                              {payment.payment_method === 'Card' && <CreditCard className="w-4 h-4 text-slate-600" />}
                              {payment.payment_method === 'Mobile' && <Smartphone className="w-4 h-4 text-slate-600" />}
                              <div>
                                <p className="text-sm font-medium text-slate-900">{payment.payment_method}</p>
                                <p className="text-xs text-slate-600">
                                  {new Date(payment.paid_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <p className="font-medium text-slate-900">${payment.amount.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                        <span className="font-semibold text-slate-900">Remaining Balance</span>
                        <span className="text-xl font-bold text-slate-900">${remainingBalance.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {invoice.payment_status !== 'Paid' && (
                    <button
                      onClick={() => {
                        setPaymentForm({ ...paymentForm, amount: remainingBalance });
                        setShowPaymentModal(true);
                      }}
                      className="w-full bg-slate-900 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition"
                    >
                      <DollarSign className="w-5 h-5" />
                      Record Payment
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
                  <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">No invoice generated yet for this reservation.</p>
                  <button
                    onClick={handleGenerateInvoice}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
                  >
                    Generate Invoice
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <Receipt className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Select a reservation to view billing details</p>
            </div>
          )}
        </div>
      </div>

      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Add Service</h3>
            </div>

            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Service *</label>
                <select
                  required
                  value={serviceForm.service_id}
                  onChange={(e) => setServiceForm({ ...serviceForm, service_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ${service.price.toFixed(2)} ({service.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={serviceForm.quantity}
                  onChange={(e) => setServiceForm({ ...serviceForm, quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceModal(false);
                    setServiceForm({ service_id: '', quantity: 1 });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Add Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Record Payment</h3>
            </div>

            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount ($) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method *</label>
                <select
                  required
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, payment_method: e.target.value as 'Cash' | 'Card' | 'Mobile' })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Reference</label>
                <input
                  type="text"
                  value={paymentForm.transaction_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                  placeholder="Optional reference number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentForm({ amount: 0, payment_method: 'Cash', transaction_reference: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
