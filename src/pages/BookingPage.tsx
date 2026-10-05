import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarDays, Users, BedDouble, UtensilsCrossed, CreditCard, CheckCircle,
  ArrowRight, ArrowLeft, Phone, Mail, User, Clock, MapPin, AlertCircle,
  Smartphone, Building2, Wallet, Loader2
} from 'lucide-react';
import type { PmsRoomType, GuestBooking, TableReservation, PaymentGateway, PaymentGatewayInfo } from '../types/pms';

// Ethiopian Payment Gateways
const ethiopianGateways: PaymentGatewayInfo[] = [
  { id: 'telebirr', name: 'Telebirr', type: 'mobile_money', color: '#00A0E9', instructions: 'Pay with Telebirr mobile money. Enter your phone number to receive payment prompt.' },
  { id: 'cbe_birr', name: 'CBE Birr', type: 'mobile_money', color: '#1B5E20', instructions: 'Pay with CBE Birr. Enter your registered phone number.' },
  { id: 'mpesa', name: 'M-PESA', type: 'mobile_money', color: '#00A651', instructions: 'Pay with M-PESA. Enter your mobile number.' },
  { id: 'cbe_bank', name: 'CBE Bank Transfer', type: 'bank', color: '#1565C0', instructions: 'Transfer to Commercial Bank of Ethiopia. Account: 1000123456789' },
  { id: 'dashen_bank', name: 'Dashen Bank', type: 'bank', color: '#E65100', instructions: 'Transfer to Dashen Bank. Account: 1234567890123' },
  { id: 'awash_bank', name: 'Awash Bank', type: 'bank', color: '#006064', instructions: 'Transfer to Awash Bank. Account: 9876543210987' },
  { id: 'card', name: 'Credit/Debit Card', type: 'card', color: '#4A148C', instructions: 'Pay securely with Visa or Mastercard.' },
  { id: 'cash', name: 'Pay at Hotel', type: 'cash', color: '#37474F', instructions: 'Pay cash upon arrival. 20% deposit required.' },
];

type BookingTab = 'room' | 'table';
type Step = 'details' | 'payment' | 'confirmation';

export function BookingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<BookingTab>('room');
  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);

  // Room booking state
  const [roomBooking, setRoomBooking] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    guest_nationality: 'Ethiopian',
    id_type: 'National ID',
    id_number: '',
    room_type_id: '',
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    number_of_rooms: 1,
    special_requests: '',
  });

  // Table reservation state
  const [tableBooking, setTableBooking] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    reservation_date: '',
    reservation_time: '19:00',
    number_of_guests: 2,
    occasion: '',
    special_requests: '',
  });

  // Payment state
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('telebirr');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [bookingResult, setBookingResult] = useState<GuestBooking | TableReservation | null>(null);

  // Validate payment details based on gateway type
  const isPaymentValid = () => {
    if (selectedGateway === 'cash') return true;
    if (selectedGateway === 'telebirr' || selectedGateway === 'cbe_birr' || selectedGateway === 'mpesa') {
      return paymentPhone.length >= 9;
    }
    if (selectedGateway === 'cbe_bank' || selectedGateway === 'dashen_bank' || selectedGateway === 'awash_bank') {
      return paymentAccount.length >= 4;
    }
    if (selectedGateway === 'card') {
      return cardNumber.length >= 16 && cardExpiry.length >= 4 && cardCvv.length >= 3 && cardName.length >= 2;
    }
    return false;
  };

  const getPaymentValidationError = () => {
    if (selectedGateway === 'cash') return '';
    if (selectedGateway === 'telebirr' || selectedGateway === 'cbe_birr' || selectedGateway === 'mpesa') {
      if (!paymentPhone) return 'Phone number is required';
      if (paymentPhone.length < 9) return 'Please enter a valid phone number';
    }
    if (selectedGateway === 'cbe_bank' || selectedGateway === 'dashen_bank' || selectedGateway === 'awash_bank') {
      if (!paymentAccount) return 'Account number is required';
      if (paymentAccount.length < 4) return 'Please enter last 4 digits of your account';
    }
    if (selectedGateway === 'card') {
      if (!cardNumber || cardNumber.length < 16) return 'Valid card number is required';
      if (!cardExpiry || cardExpiry.length < 4) return 'Expiry date is required';
      if (!cardCvv || cardCvv.length < 3) return 'CVV is required';
      if (!cardName) return 'Cardholder name is required';
    }
    return '';
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    const { data } = await supabase
      .from('pms_room_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (data) setRoomTypes(data as PmsRoomType[]);
  };

  // Calculate room booking total
  const calculateRoomTotal = () => {
    const roomType = roomTypes.find(r => r.id === roomBooking.room_type_id);
    if (!roomType || !roomBooking.check_in_date || !roomBooking.check_out_date) return 0;
    const checkIn = new Date(roomBooking.check_in_date);
    const checkOut = new Date(roomBooking.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? roomType.base_price * nights * roomBooking.number_of_rooms : 0;
  };

  // Table reservation deposit (fixed amount)
  const tableDeposit = 500;

  const handleRoomSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const total = calculateRoomTotal();
      const { data, error } = await supabase
        .from('guest_bookings')
        .insert({
          ...roomBooking,
          total_amount: total,
        })
        .select()
        .single();

      if (error) throw error;
      setBookingResult(data);
      setStep('payment');
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('table_reservations')
        .insert({
          ...tableBooking,
          deposit_amount: tableDeposit,
        })
        .select()
        .single();

      if (error) throw error;
      setBookingResult(data);
      setStep('payment');
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const amount = activeTab === 'room' ? (bookingResult as GuestBooking)?.total_amount : tableDeposit;
      const bookingId = activeTab === 'room' ? (bookingResult as GuestBooking)?.id : undefined;
      const tableId = activeTab === 'table' ? (bookingResult as TableReservation)?.id : undefined;

      // Create payment transaction
      const { error: txError } = await supabase
        .from('payment_transactions')
        .insert({
          booking_id: bookingId,
          table_reservation_id: tableId,
          amount,
          gateway: selectedGateway,
          phone_number: paymentPhone || undefined,
          account_number: paymentAccount || undefined,
          transaction_reference: `TXN-${Date.now()}`,
          status: 'PENDING',
        });

      if (txError) throw txError;

      // Update booking payment info
      if (activeTab === 'room') {
        await supabase
          .from('guest_bookings')
          .update({ payment_gateway: selectedGateway })
          .eq('id', bookingId);
      } else {
        await supabase
          .from('table_reservations')
          .update({ payment_gateway: selectedGateway })
          .eq('id', tableId);
      }

      // Simulate payment submission (in real app, integrate with gateway API)
      if (selectedGateway !== 'cash') {
        alert(`Payment request sent to ${ethiopianGateways.find(g => g.id === selectedGateway)?.name}. Please complete the payment on your phone or banking app.`);
      }

      setStep('confirmation');
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedGatewayInfo = ethiopianGateways.find(g => g.id === selectedGateway);

  // Get tomorrow's date for minimum date input
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-4xl font-bold text-slate-900">Book Your Experience</h1>
          <p className="text-slate-600 mt-2">Reserve rooms or tables with convenient Ethiopian payment options</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {['details', 'payment', 'confirmation'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step === s ? 'bg-amber-500 text-white' :
                ['details', 'payment', 'confirmation'].indexOf(step) > i ? 'bg-green-500 text-white' :
                'bg-slate-200 text-slate-500'
              }`}>
                {['details', 'payment', 'confirmation'].indexOf(step) > i ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`ml-2 capitalize ${step === s ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                {s}
              </span>
              {i < 2 && <div className="w-16 h-1 mx-4 bg-slate-200 rounded" />}
            </div>
          ))}
        </div>

        {/* DETAILS STEP */}
        {step === 'details' && (
          <>
            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-white border border-slate-200 p-1 mb-8 max-w-md">
              <button
                onClick={() => setActiveTab('room')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${
                  activeTab === 'room' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BedDouble className="w-5 h-5" /> Room Booking
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${
                  activeTab === 'table' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UtensilsCrossed className="w-5 h-5" /> Table Reservation
              </button>
            </div>

            {/* Room Booking Form */}
            {activeTab === 'room' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <BedDouble className="w-7 h-7" /> Room Reservation
                  </h2>
                  <p className="opacity-90 mt-1">Book your perfect stay with easy payment options</p>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-6">
                  {/* Guest Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <User className="w-5 h-5 text-amber-500" /> Guest Information
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={roomBooking.guest_name}
                        onChange={e => setRoomBooking({ ...roomBooking, guest_name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            value={roomBooking.guest_email}
                            onChange={e => setRoomBooking({ ...roomBooking, guest_email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Phone *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="tel"
                            value={roomBooking.guest_phone}
                            onChange={e => setRoomBooking({ ...roomBooking, guest_phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                            placeholder="+251 9X XXX XXXX"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Nationality</label>
                        <select
                          value={roomBooking.guest_nationality}
                          onChange={e => setRoomBooking({ ...roomBooking, guest_nationality: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                        >
                          <option>Ethiopian</option>
                          <option>International</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">ID Type</label>
                        <select
                          value={roomBooking.id_type}
                          onChange={e => setRoomBooking({ ...roomBooking, id_type: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                        >
                          <option>National ID</option>
                          <option>Passport</option>
                          <option>Drivers License</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">ID Number</label>
                        <input
                          type="text"
                          value={roomBooking.id_number}
                          onChange={e => setRoomBooking({ ...roomBooking, id_number: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                          placeholder="ID/Passport #"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-amber-500" /> Booking Details
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Room Type *</label>
                      <select
                        value={roomBooking.room_type_id}
                        onChange={e => setRoomBooking({ ...roomBooking, room_type_id: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select room type</option>
                        {roomTypes.map(rt => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name} - ETB {rt.base_price.toLocaleString()}/night
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Check-in Date *</label>
                        <input
                          type="date"
                          value={roomBooking.check_in_date}
                          onChange={e => setRoomBooking({ ...roomBooking, check_in_date: e.target.value })}
                          min={minDate}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Check-out Date *</label>
                        <input
                          type="date"
                          value={roomBooking.check_out_date}
                          onChange={e => setRoomBooking({ ...roomBooking, check_out_date: e.target.value })}
                          min={roomBooking.check_in_date || minDate}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Number of Rooms</label>
                        <select
                          value={roomBooking.number_of_rooms}
                          onChange={e => setRoomBooking({ ...roomBooking, number_of_rooms: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                        >
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Guests per Room</label>
                        <select
                          value={roomBooking.number_of_guests}
                          onChange={e => setRoomBooking({ ...roomBooking, number_of_guests: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                        >
                          {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Special Requests</label>
                      <textarea
                        value={roomBooking.special_requests}
                        onChange={e => setRoomBooking({ ...roomBooking, special_requests: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                        placeholder="Any special requirements..."
                      />
                    </div>
                  </div>
                </div>

                {/* Price Summary */}
                {roomBooking.room_type_id && roomBooking.check_in_date && roomBooking.check_out_date && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-600">Room Type:</span>
                      <span className="font-medium">{roomTypes.find(r => r.id === roomBooking.room_type_id)?.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-slate-600">Nights:</span>
                      <span className="font-medium">
                        {Math.ceil((new Date(roomBooking.check_out_date).getTime() - new Date(roomBooking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <span className="text-lg font-semibold text-slate-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-amber-600">ETB {calculateRoomTotal().toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="p-6 bg-white border-t">
                  <button
                    onClick={handleRoomSubmit}
                    disabled={!roomBooking.guest_name || !roomBooking.guest_email || !roomBooking.guest_phone || !roomBooking.room_type_id || !roomBooking.check_in_date || !roomBooking.check_out_date || loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Payment <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Table Reservation Form */}
            {activeTab === 'table' && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <UtensilsCrossed className="w-7 h-7" /> Table Reservation
                  </h2>
                  <p className="opacity-90 mt-1">Reserve your table for a delightful dining experience</p>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-6">
                  {/* Guest Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-500" /> Guest Information
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={tableBooking.guest_name}
                        onChange={e => setTableBooking({ ...tableBooking, guest_name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            value={tableBooking.guest_email}
                            onChange={e => setTableBooking({ ...tableBooking, guest_email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Phone *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="tel"
                            value={tableBooking.guest_phone}
                            onChange={e => setTableBooking({ ...tableBooking, guest_phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="+251 9X XXX XXXX"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reservation Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-500" /> Reservation Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Date *</label>
                        <input
                          type="date"
                          value={tableBooking.reservation_date}
                          onChange={e => setTableBooking({ ...tableBooking, reservation_date: e.target.value })}
                          min={minDate}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Time *</label>
                        <select
                          value={tableBooking.reservation_time}
                          onChange={e => setTableBooking({ ...tableBooking, reservation_time: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="12:00">12:00 PM (Lunch)</option>
                          <option value="12:30">12:30 PM (Lunch)</option>
                          <option value="13:00">1:00 PM (Lunch)</option>
                          <option value="18:00">6:00 PM (Dinner)</option>
                          <option value="18:30">6:30 PM (Dinner)</option>
                          <option value="19:00">7:00 PM (Dinner)</option>
                          <option value="19:30">7:30 PM (Dinner)</option>
                          <option value="20:00">8:00 PM (Dinner)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Party Size</label>
                        <select
                          value={tableBooking.number_of_guests}
                          onChange={e => setTableBooking({ ...tableBooking, number_of_guests: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n} guests</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Occasion</label>
                        <select
                          value={tableBooking.occasion}
                          onChange={e => setTableBooking({ ...tableBooking, occasion: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">None</option>
                          <option value="birthday">Birthday</option>
                          <option value="anniversary">Anniversary</option>
                          <option value="business">Business Meeting</option>
                          <option value="date">Date Night</option>
                          <option value="other">Other Celebration</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Special Requests</label>
                      <textarea
                        value={tableBooking.special_requests}
                        onChange={e => setTableBooking({ ...tableBooking, special_requests: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="Dietary requirements, special seating, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Deposit Info */}
                <div className="border-t border-slate-200 p-6 bg-slate-50">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-slate-700 font-medium">Reservation Deposit Required</p>
                      <p className="text-sm text-slate-500">A deposit of ETB 500 is required to secure your reservation. This will be deducted from your final bill.</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-lg font-semibold text-slate-900">Deposit Amount:</span>
                    <span className="text-2xl font-bold text-emerald-600">ETB {tableDeposit.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-6 bg-white border-t">
                  <button
                    onClick={handleTableSubmit}
                    disabled={!tableBooking.guest_name || !tableBooking.guest_email || !tableBooking.guest_phone || !tableBooking.reservation_date || loading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Payment <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* PAYMENT STEP */}
        {step === 'payment' && bookingResult && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <CreditCard className="w-7 h-7" /> Payment
              </h2>
              <p className="opacity-90 mt-1">Choose your preferred Ethiopian payment method</p>
            </div>

            <div className="p-6">
              {/* Booking Summary */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-slate-800 mb-3">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Reference:</span>
                    <span className="font-medium">{(bookingResult as GuestBooking).booking_reference || (bookingResult as TableReservation).reservation_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Guest:</span>
                    <span className="font-medium">{(bookingResult as GuestBooking).guest_name}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t">
                    <span className="font-semibold text-slate-900">Amount:</span>
                    <span className="font-bold text-amber-600">ETB {(activeTab === 'room' ? (bookingResult as GuestBooking).total_amount : tableDeposit).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Gateways Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {ethiopianGateways.map(gateway => (
                  <button
                    key={gateway.id}
                    onClick={() => setSelectedGateway(gateway.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedGateway === gateway.id
                        ? 'border-amber-500 bg-amber-50 shadow-lg'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {gateway.type === 'mobile_money' && <Smartphone className="w-8 h-8" style={{ color: gateway.color }} />}
                      {gateway.type === 'bank' && <Building2 className="w-8 h-8" style={{ color: gateway.color }} />}
                      {gateway.type === 'card' && <CreditCard className="w-8 h-8" style={{ color: gateway.color }} />}
                      {gateway.type === 'cash' && <Wallet className="w-8 h-8" style={{ color: gateway.color }} />}
                      <span className="text-sm font-medium text-slate-700">{gateway.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Gateway-specific inputs */}
              {selectedGatewayInfo && (
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-slate-800 mb-2">{selectedGatewayInfo.name}</h4>
                  <p className="text-sm text-slate-600 mb-4">{selectedGatewayInfo.instructions}</p>

                  {selectedGatewayInfo.type === 'mobile_money' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Phone Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="tel"
                            value={paymentPhone}
                            onChange={e => setPaymentPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="09XXXXXXXX or +2519XXXXXXXX"
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Enter the phone number registered with {selectedGatewayInfo.name}</p>
                      </div>
                    </div>
                  )}

                  {selectedGatewayInfo.type === 'bank' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Account Holder Name *</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Account holder full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Account Number (Last 4 digits) *</label>
                        <input
                          type="text"
                          value={paymentAccount}
                          onChange={e => setPaymentAccount(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Enter last 4 digits of your account"
                          maxLength={4}
                        />
                        <p className="text-xs text-slate-500 mt-1">For verification purposes only</p>
                      </div>
                    </div>
                  )}

                  {selectedGatewayInfo.type === 'card' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Card Number *</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="1234 5678 9012 3456"
                          maxLength={16}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Cardholder Name *</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={e => setCardName(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Name on card"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Expiry Date *</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={e => setCardExpiry(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">CVV *</label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="***"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedGatewayInfo.type === 'cash' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        <strong>Note:</strong> A 20% deposit is required upon check-in. Please bring exact cash or arrange payment at the reception.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Validation Error */}
              {getPaymentValidationError() && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{getPaymentValidationError()}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('details')}
                  className="px-6 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading || !isPaymentValid()}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Payment <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION STEP */}
        {step === 'confirmation' && bookingResult && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="opacity-90">Your reservation has been successfully created</p>
            </div>

            <div className="p-8">
              <div className="bg-slate-50 rounded-xl p-6 mb-6 max-w-md mx-auto">
                <p className="text-sm text-slate-500 mb-2">Booking Reference</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {(bookingResult as GuestBooking).booking_reference || (bookingResult as TableReservation).reservation_reference}
                </p>
              </div>

              {activeTab === 'room' && (
                <div className="text-left max-w-md mx-auto space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Check-in:</span>
                    <span className="font-medium">{new Date((bookingResult as GuestBooking).check_in_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Check-out:</span>
                    <span className="font-medium">{new Date((bookingResult as GuestBooking).check_out_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Rooms:</span>
                    <span className="font-medium">{(bookingResult as GuestBooking).number_of_rooms}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-amber-600">ETB {(bookingResult as GuestBooking).total_amount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {activeTab === 'table' && (
                <div className="text-left max-w-md mx-auto space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date:</span>
                    <span className="font-medium">{new Date((bookingResult as TableReservation).reservation_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time:</span>
                    <span className="font-medium">{(bookingResult as TableReservation).reservation_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Guests:</span>
                    <span className="font-medium">{(bookingResult as TableReservation).number_of_guests}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="font-semibold">Deposit Paid:</span>
                    <span className="font-bold text-emerald-600">ETB {tableDeposit.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-md mx-auto">
                <p className="text-sm text-amber-700">
                  A confirmation email has been sent to <strong>{(bookingResult as GuestBooking).guest_email}</strong>
                </p>
              </div>

              {/* Payment Method Info */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6 max-w-md mx-auto">
                <p className="text-sm text-slate-600 mb-2">Payment Method</p>
                <div className="flex items-center gap-3">
                  {selectedGatewayInfo?.type === 'mobile_money' && <Smartphone className="w-6 h-6" style={{ color: selectedGatewayInfo.color }} />}
                  {selectedGatewayInfo?.type === 'bank' && <Building2 className="w-6 h-6" style={{ color: selectedGatewayInfo.color }} />}
                  {selectedGatewayInfo?.type === 'card' && <CreditCard className="w-6 h-6" style={{ color: selectedGatewayInfo.color }} />}
                  {selectedGatewayInfo?.type === 'cash' && <Wallet className="w-6 h-6" style={{ color: selectedGatewayInfo.color }} />}
                  <span className="font-semibold text-slate-900">{selectedGatewayInfo?.name}</span>
                </div>
                {selectedGatewayInfo?.type === 'mobile_money' && paymentPhone && (
                  <p className="text-sm text-slate-500 mt-2 ml-9">Phone: {paymentPhone}</p>
                )}
                {selectedGatewayInfo?.type === 'bank' && cardName && (
                  <p className="text-sm text-slate-500 mt-2 ml-9">Account: {cardName}</p>
                )}
                {selectedGatewayInfo?.type === 'card' && cardNumber && (
                  <p className="text-sm text-slate-500 mt-2 ml-9">Card ending: ****{cardNumber.slice(-4)}</p>
                )}
                {selectedGatewayInfo?.type !== 'cash' && (
                  <p className="text-xs text-slate-400 mt-2 ml-9">Payment pending verification. You will receive a confirmation once processed.</p>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => {
                    setStep('details');
                    setBookingResult(null);
                    setPaymentPhone('');
                    setPaymentAccount('');
                    setCardNumber('');
                    setCardExpiry('');
                    setCardCvv('');
                    setCardName('');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition"
                >
                  Make Another Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
