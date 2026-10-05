import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Dumbbell, Calendar, Clock, Users, Star, ArrowRight, ArrowLeft,
  Check, Loader2, Heart, User, Zap, ChevronRight, Award, Maximize,
  Activity, HeartPulse, Bike, Weight,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

type GymServiceSpec = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  image: string;
  areaSize: string;
  location: string;
  equipmentCount: number;
  maxCapacity: number;
  features: string[];
  longDesc: string;
  images: { url: string; label: string; angle: string }[];
  equipment: { name: string; count: number; icon: React.ElementType }[];
};

const gymServices: GymServiceSpec[] = [
  {
    id: 'day_pass',
    name: 'Day Pass',
    description: 'Full access to gym facilities and group classes',
    price: 150,
    duration: '1 day',
    image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200',
    areaSize: '500 m²',
    location: 'Ground Floor, Wellness Wing',
    equipmentCount: 45,
    maxCapacity: 30,
    features: ['All equipment', 'Locker room', 'Group classes', 'Towel service'],
    longDesc: 'Enjoy full-day access to our 500m² state-of-the-art fitness center. Includes use of all 45 cardio and weight training machines, and participation in any group fitness class. Perfect for travelers who want to maintain their fitness routine.',
    images: [
      { url: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Main Gym Floor', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Cardio Area', angle: 'Side view' },
      { url: 'https://images.pexels.com/photos/1551650975-87deedd944c1/pexels-photo-1551650975-87deedd944c1.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Weight Training', angle: 'Equipment view' },
      { url: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Locker Room', angle: 'Amenity view' },
    ],
    equipment: [
      { name: 'Treadmills', count: 8, icon: Activity },
      { name: 'Stationary Bikes', count: 6, icon: Bike },
      { name: 'Weight Machines', count: 15, icon: Weight },
      { name: 'Free Weights', count: 12, icon: Dumbbell },
      { name: 'Ellipticals', count: 4, icon: HeartPulse },
    ],
  },
  {
    id: 'pt_session',
    name: 'Personal Training',
    description: 'One-on-one session with certified professional trainer',
    price: 400,
    duration: '1 hour',
    image: 'https://images.pexels.com/photos/1551650975-87deedd944c1/pexels-photo-1551650975-87deedd944c1.jpeg?auto=compress&cs=tinysrgb&w=1200',
    areaSize: 'Private training room (40 m²)',
    location: 'Ground Floor, Wellness Wing - Room 2',
    equipmentCount: 20,
    maxCapacity: 2,
    features: ['Custom program', 'Nutrition advice', 'Progress tracking', 'Flexible scheduling'],
    longDesc: 'Work one-on-one with our certified personal trainers in a private 40m² training room. Your trainer will assess your fitness level, design a customized workout plan, and guide you through each exercise with proper form. Includes nutrition consultation and progress tracking.',
    images: [
      { url: 'https://images.pexels.com/photos/1551650975-87deedd944c1/pexels-photo-1551650975-87deedd944c1.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Training Area', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Equipment Setup', angle: 'Side view' },
      { url: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Free Weights', angle: 'Equipment view' },
      { url: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Stretching Area', angle: 'Floor view' },
    ],
    equipment: [
      { name: 'Weight Bench', count: 2, icon: Weight },
      { name: 'Squat Rack', count: 1, icon: Dumbbell },
      { name: 'Dumbbells', count: 10, icon: Dumbbell },
      { name: 'Kettlebells', count: 5, icon: Weight },
      { name: 'Resistance Bands', count: 2, icon: Activity },
    ],
  },
  {
    id: 'class_pack',
    name: 'Class Pack (5 sessions)',
    description: '5 group fitness classes of your choice',
    price: 600,
    duration: '5 sessions',
    image: 'https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=1200',
    areaSize: 'Studio room (120 m²)',
    location: '2nd Floor, Group Fitness Studio',
    equipmentCount: 30,
    maxCapacity: 25,
    features: ['Yoga', 'Pilates', 'HIIT', 'Spin', 'Zumba'],
    longDesc: 'Purchase a pack of 5 group fitness classes in our 120m² studio room. Choose from yoga, pilates, HIIT, spin, and Zumba classes at your convenience. Valid for 3 months from purchase. Each class accommodates up to 25 participants.',
    images: [
      { url: 'https://images.pexels.com/photos/3775566/pexels-photo-3775566.jpeg?auto=compress&cs=tinysrgb&w=1200', label: 'Group Class', angle: 'Front view' },
      { url: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Studio Floor', angle: 'Wide angle' },
      { url: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Equipment Area', angle: 'Side view' },
      { url: 'https://images.pexels.com/photos/1551650975-87deedd944c1/pexels-photo-1551650975-87deedd944c1.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Mirror Wall', angle: 'Wall view' },
    ],
    equipment: [
      { name: 'Yoga Mats', count: 25, icon: Activity },
      { name: 'Spin Bikes', count: 20, icon: Bike },
      { name: 'Pilates Balls', count: 15, icon: HeartPulse },
      { name: 'Step Platforms', count: 10, icon: Weight },
      { name: 'Sound System', count: 1, icon: Zap },
    ],
  },
];

const trainers = [
  { id: '1', name: 'Abebe T.', specialty: 'Strength & Conditioning', experience: '8 years', rating: 4.9, bio: 'Former national athlete specializing in strength training and conditioning programs.' },
  { id: '2', name: 'Sara M.', specialty: 'Yoga & Pilates', experience: '6 years', rating: 4.8, bio: 'Certified yoga and pilates instructor with a focus on mindfulness and flexibility.' },
  { id: '3', name: 'Daniel K.', specialty: 'CrossFit & HIIT', experience: '5 years', rating: 4.9, bio: 'CrossFit Level 2 trainer specializing in high-intensity interval training.' },
  { id: '4', name: 'Marta H.', specialty: 'Personal Training', experience: '7 years', rating: 4.7, bio: 'NASM-certified personal trainer with expertise in weight loss and muscle building.' },
];

const timeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export function GymDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const [booking, setBooking] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    date: '',
    time: '',
    notes: '',
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const service = gymServices.find(s => s.id === id);
  const trainer = trainers.find(t => t.id === selectedTrainer);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Dumbbell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700">Service not found</h2>
          <button onClick={() => navigate('/gym')} className="mt-4 text-red-600 font-medium hover:text-red-700">
            Back to Gym
          </button>
        </div>
      </div>
    );
  }

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      if (id === 'pt_session') {
        const { error } = await supabase
          .from('guest_wellness_profile')
          .insert({
            user_id: user.id,
            goals: booking.notes || 'Fitness training',
            preferred_activities: ['Gym', 'Personal Training'],
          });
        if (error && error.code !== '23505') throw error;
      }
      navigate('/booking', {
        state: {
          type: 'gym',
          service: service.name,
          date: booking.date,
          time: booking.time,
          trainer: trainer?.name,
          amount: service.price,
          guest_name: booking.guest_name,
          guest_email: booking.guest_email,
          guest_phone: booking.guest_phone,
        },
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
    (id !== 'pt_session' || selectedTrainer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button onClick={() => navigate('/gym')} className="hover:text-red-600 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Gym
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{service.name}</span>
          </div>
        </div>
      </div>

      {/* Gallery - Multiple angles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
            <SafeImage src={service.images[activeImage]?.url} alt={`${service.images[activeImage]?.label ?? ''} - ${service.images[activeImage]?.angle ?? ''}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition"
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            </button>
            <div className="absolute bottom-4 left-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm font-semibold text-slate-900">{service.images[activeImage].label}</p>
                <p className="text-xs text-slate-500">{service.images[activeImage].angle}</p>
              </div>
            </div>
            <div className="absolute top-4 left-4">
              <span className="bg-red-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                {service.duration}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {service.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative h-[115px] lg:h-[118px] rounded-xl overflow-hidden transition-all ${
                  activeImage === i ? 'ring-2 ring-red-500' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <SafeImage src={img.url} alt={img.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-1 left-2 right-2">
                  <p className="text-xs text-white font-medium truncate">{img.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header with key specs */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{service.name}</h1>
                  <p className="text-lg text-slate-500 mt-1">{service.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-600">ETB {service.price}</p>
                  <p className="text-sm text-slate-500">{service.duration}</p>
                </div>
              </div>

              {/* Key specs grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
                    <Maximize className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{service.areaSize}</p>
                  <p className="text-xs text-slate-500">Area size</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
                    <Dumbbell className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{service.equipmentCount} Machines</p>
                  <p className="text-xs text-slate-500">Equipment</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{service.maxCapacity} People</p>
                  <p className="text-xs text-slate-500">Max capacity</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
                    <Star className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">4.9 Rating</p>
                  <p className="text-xs text-slate-500">All levels</p>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed mt-4">{service.longDesc}</p>
            </div>

            {/* Equipment List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Equipment Available</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {service.equipment.map(eq => (
                  <div key={eq.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                      <eq.icon className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{eq.name}</p>
                      <p className="text-xs text-slate-500">{eq.count} units available</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">{eq.count}x</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Included */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">What's Included</h2>
              <div className="grid grid-cols-2 gap-4">
                {service.features.map(feature => (
                  <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                      <Check className="w-4 h-4 text-red-600" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Trainer Selection (for PT) */}
            {id === 'pt_session' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-500" /> Select Your Trainer
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {trainers.map(tr => (
                    <div
                      key={tr.id}
                      onClick={() => setSelectedTrainer(tr.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
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
                          <p className="text-xs text-slate-500 mt-2">{tr.bio}</p>
                        </div>
                        {selectedTrainer === tr.id && <Check className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facility highlights */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Facility Highlights</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Dumbbell, label: 'Modern Equipment' },
                  { icon: HeartPulse, label: 'Cardio Zone' },
                  { icon: Users, label: 'Group Classes' },
                  { icon: Award, label: 'Locker Rooms' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-t-2xl text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Book Session
                </h3>
                <p className="text-red-100 text-sm mt-1">{service.name} - ETB {service.price}</p>
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                    placeholder="Any fitness goals or injuries..."
                  />
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">{service.name}</span>
                    <span className="font-medium">ETB {service.price}</span>
                  </div>
                  {trainer && (
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Trainer: {trainer.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-red-600">ETB {service.price}</span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!isFormValid || loading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Book Now <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GymDetailPage;
