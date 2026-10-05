import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Dumbbell, Calendar, Clock, Users, Star, ArrowRight, Check,
  Loader2, Zap, Heart, Timer, User, Crown
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

const gymServices = [
  {
    id: 'day_pass',
    name: 'Day Pass',
    description: 'Full access to gym facilities and group classes',
    price: 150,
    duration: '1 day',
    image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=600',
    features: ['All equipment', 'Locker room', 'Group classes', 'Towel service']
  },
  {
    id: 'pt_session',
    name: 'Personal Training',
    description: 'One-on-one session with certified professional trainer',
    price: 400,
    duration: '1 hour',
    image: 'https://images.pexels.com/photo-1551650975-87deedd944c1/pexels-photo-1551650975-87deedd944c1.jpeg?auto=compress&cs=tinysrgb&w=600',
    features: ['Custom program', 'Nutrition advice', 'Progress tracking', 'Flexible scheduling']
  },
  {
    id: 'class_pack',
    name: 'Class Pack (5 sessions)',
    description: '5 group fitness classes of your choice',
    price: 600,
    duration: '5 sessions',
    image: 'https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=600',
    features: ['Yoga', 'Pilates', 'HIIT', 'Spin', 'Zumba']
  }
];

const trainers = [
  { id: '1', name: 'Abebe T.', specialty: 'Strength & Conditioning', experience: '8 years', rating: 4.9 },
  { id: '2', name: 'Sara M.', specialty: 'Yoga & Pilates', experience: '6 years', rating: 4.8 },
  { id: '3', name: 'Daniel K.', specialty: 'CrossFit & HIIT', experience: '5 years', rating: 4.9 },
  { id: '4', name: 'Marta H.', specialty: 'Personal Training', experience: '7 years', rating: 4.7 },
];

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const fitnessClasses = [
  { name: 'Morning Yoga', time: '07:00', duration: '60 min', instructor: 'Sara M.', spots: 5 },
  { name: 'HIIT Blast', time: '09:00', duration: '45 min', instructor: 'Daniel K.', spots: 8 },
  { name: 'Spin Class', time: '17:00', duration: '45 min', instructor: 'Abebe T.', spots: 3 },
  { name: 'Evening Pilates', time: '18:30', duration: '60 min', instructor: 'Sara M.', spots: 6 },
];

export function GymPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<string>('day_pass');
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [booking, setBooking] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    date: '',
    time: '',
    service_type: 'day_pass',
    trainer_id: '',
    notes: '',
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const service = gymServices.find(s => s.id === selectedService);
  const trainer = trainers.find(t => t.id === selectedTrainer);

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // For personal training, create a wellness booking
      if (selectedService === 'pt_session') {
        const { data, error } = await supabase
          .from('guest_wellness_profile')
          .insert({
            user_id: user.id,
            goals: booking.notes || 'Fitness training',
            preferred_activities: ['Gym', 'Personal Training'],
          })
          .select()
          .single();

        if (error && error.code !== '23505') throw error; // Ignore duplicate profile
      }

      // Navigate to payment
      navigate('/booking', {
        state: {
          type: 'gym',
          service: service?.name,
          date: booking.date,
          time: booking.time,
          trainer: trainer?.name,
          amount: service?.price || 150,
          guest_name: booking.guest_name,
          guest_email: booking.guest_email,
          guest_phone: booking.guest_phone,
        }
      });
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = booking.date && booking.time && booking.guest_name &&
    booking.guest_email && booking.guest_phone &&
    (selectedService !== 'pt_session' || selectedTrainer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[350px] overflow-hidden">
        <SafeImage
          src="https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Gym"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-8 h-8 text-red-400" />
            <span className="text-red-400 font-medium">Fitness Center</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">Workout & Wellness</h1>
          <p className="text-xl text-slate-300 max-w-2xl">State-of-the-art equipment, expert trainers, and energizing classes.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Service Selection */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Choose Your Experience</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {gymServices.map(srv => (
                <ServiceCard
                  key={srv.id}
                  service={srv}
                  isSelected={selectedService === srv.id}
                  onSelect={() => {
                    setSelectedService(srv.id);
                    setBooking({ ...booking, service_type: srv.id });
                  }}
                  onView={() => navigate(`/gym/${srv.id}`)}
                />
              ))}
            </div>

            {/* Trainer Selection (for Personal Training) */}
            {selectedService === 'pt_session' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-500" /> Select Your Trainer
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {trainers.map(tr => (
                    <div
                      key={tr.id}
                      onClick={() => setSelectedTrainer(tr.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedTrainer === tr.id
                          ? 'bg-red-50 border-2 border-red-500'
                          : 'bg-slate-50 border border-slate-200 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                          {tr.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{tr.name}</h4>
                          <p className="text-sm text-slate-500">{tr.specialty}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span>{tr.experience}</span>
                            <span>|</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {tr.rating}
                            </span>
                          </div>
                        </div>
                        {selectedTrainer === tr.id && <Check className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Classes */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-red-500" /> Today's Classes
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {fitnessClasses.map(cls => (
                  <div key={cls.name} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 text-sm">{cls.name}</h4>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{cls.spots} left</span>
                    </div>
                    <p className="text-sm text-slate-500">{cls.time} | {cls.duration}</p>
                    <p className="text-xs text-slate-400 mt-1">w/ {cls.instructor}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">What's Included</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Dumbbell, label: 'Modern Equipment' },
                  { icon: Heart, label: 'Cardio Zone' },
                  { icon: Users, label: 'Group Classes' },
                  { icon: Crown, label: 'Locker Rooms' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Book Session
                </h3>
                <p className="text-red-100 text-sm mt-1">{service?.name} - ETB {service?.price}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={booking.guest_name}
                    onChange={e => setBooking({ ...booking, guest_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Email *</label>
                    <input
                      type="email"
                      value={booking.guest_email}
                      onChange={e => setBooking({ ...booking, guest_email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Phone *</label>
                    <input
                      type="tel"
                      value={booking.guest_phone}
                      onChange={e => setBooking({ ...booking, guest_phone: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                      placeholder="+251..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Date *</label>
                    <input
                      type="date"
                      value={booking.date}
                      onChange={e => setBooking({ ...booking, date: e.target.value })}
                      min={minDate}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Time *</label>
                    <select
                      value={booking.time}
                      onChange={e => setBooking({ ...booking, time: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">Notes (optional)</label>
                  <textarea
                    value={booking.notes}
                    onChange={e => setBooking({ ...booking, notes: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                    placeholder="Any fitness goals or injuries..."
                  />
                </div>

                {/* Price Summary */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">{service?.name}</span>
                    <span className="font-medium">ETB {service?.price}</span>
                  </div>
                  {trainer && (
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Trainer: {trainer.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-red-600">ETB {service?.price}</span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!isFormValid || loading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Book Now <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service, isSelected, onSelect, onView }: {
  service: typeof gymServices[0];
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-xl overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-red-500 shadow-lg' : 'border border-slate-100 hover:shadow-md'
      }`}
    >
      <div className="relative h-32 overflow-hidden">
        <SafeImage src={service.image} alt={service.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <h3 className="font-semibold text-white">{service.name}</h3>
          <p className="text-red-300 text-sm">{service.duration}</p>
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-slate-500 mb-3">{service.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {service.features.map(f => (
            <span key={f} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{f}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-red-600">ETB {service.price}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="text-sm text-red-600 font-medium hover:text-red-700 flex items-center gap-1"
          >
            Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default GymPage;
