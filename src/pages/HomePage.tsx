import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import {
  Star, MapPin, Users, Award, ArrowRight, Wifi, Coffee, Car, Dumbbell,
  Flower2, Utensils, Shield, Clock, Phone, Bed, UtensilsCrossed, Wine,
  Calendar, Sparkles, ChevronRight, Heart, TrendingUp, Zap, ChevronLeft,
} from 'lucide-react';
import { SafeImage } from '../components/SafeImage';

type PmsRoom = {
  id: string;
  room_number: string;
  room_type_id: string;
  floor: number;
  status: string;
  room_type: {
    id: string;
    name: string;
    base_price: number;
    max_occupancy: number;
    amenities: string[];
    image_url?: string;
  };
};

const ROOM_IMAGES: Record<string, string> = {
  'Standard': 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Deluxe': 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Suite': 'https://images.pexels.com/photos/210604/pexels-photo-210604.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Executive': 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Presidential': 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const ROOM_FEATURES: Record<string, string[]> = {
  'Standard': ['Queen Bed', 'City View', '25m²', '1 Bed'],
  'Deluxe': ['King Bed', 'Pool View', '35m²', '1 Bed'],
  'Suite': ['King + Sofa Bed', 'Ocean View', '55m²', '2 Beds'],
  'Executive': ['2 King Beds', 'Panoramic View', '65m²', '2 Beds'],
  'Presidential': ['2 King + Queen', '360° View', '120m²', '3 Beds'],
};

const HERO_SLIDE_KEYS = [
  {
    image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1920',
    eyebrowKey: 'hero_luxuryRooms' as const,
    titleKey: 'hero_stayElegant' as const,
    subtitleKey: 'hero_stayDesc' as const,
    ctaKey: 'hero_bookStay' as const,
    path: '/rooms',
  },
  {
    image: 'https://images.pexels.com/photos/7627408/pexels-photo-7627408.jpeg?auto=compress&cs=tinysrgb&w=1920',
    eyebrowKey: 'hero_fineDining' as const,
    titleKey: 'hero_feastSenses' as const,
    subtitleKey: 'hero_feastDesc' as const,
    ctaKey: 'hero_reserveTable' as const,
    path: '/dining',
  },
  {
    image: 'https://images.pexels.com/photos/20104020/pexels-photo-20104020.jpeg?auto=compress&cs=tinysrgb&w=1920',
    eyebrowKey: 'hero_barsLounges' as const,
    titleKey: 'hero_sipSavor' as const,
    subtitleKey: 'hero_sipDesc' as const,
    ctaKey: 'hero_reserveNight' as const,
    path: '/bars',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [likedRooms, setLikedRooms] = useState<Set<string>>(new Set());
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    async function loadRooms() {
      try {
        const { data } = await supabase
          .from('pms_rooms')
          .select('*, room_type:pms_room_types(*)')
          .eq('status', 'AVAILABLE')
          .limit(4);
        if (data && data.length > 0) setRooms(data as PmsRoom[]);
      } catch (e) {
        console.error(e);
      }
    }
    loadRooms();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDE_KEYS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: Star, title: t('feature_luxuryRooms'), description: t('feature_luxuryRoomsDesc') },
    { icon: MapPin, title: t('feature_primeLocation'), description: t('feature_primeLocationDesc') },
    { icon: Users, title: t('feature_concierge'), description: t('feature_conciergeDesc') },
    { icon: Award, title: t('feature_5star'), description: t('feature_5starDesc') },
  ];

  const amenities = [
    { icon: Wifi, name: t('amenity_wifi'), desc: t('amenity_wifiDesc') },
    { icon: Flower2, name: t('amenity_spa'), desc: t('amenity_spaDesc') },
    { icon: Dumbbell, name: t('amenity_fitness'), desc: t('amenity_fitnessDesc') },
    { icon: Utensils, name: t('amenity_dining'), desc: t('amenity_diningDesc') },
    { icon: Coffee, name: t('amenity_cafe'), desc: t('amenity_cafeDesc') },
    { icon: Car, name: t('amenity_valet'), desc: t('amenity_valetDesc') },
    { icon: Shield, name: t('amenity_security'), desc: t('amenity_securityDesc') },
    { icon: Clock, name: t('amenity_roomService'), desc: t('amenity_roomServiceDesc') },
  ];

  const signaturePromos = [
    {
      icon: UtensilsCrossed,
      title: t('promo_fineDining'),
      tagline: t('promo_fineDiningTagline'),
      desc: t('promo_fineDiningDesc'),
      image: 'https://images.pexels.com/photos/1327393/pexels-photo-1327393.jpeg?auto=compress&cs=tinysrgb&w=1200',
      path: '/dining',
      badge: '4 Restaurants',
      highlights: [t('promo_intlCuisine'), t('promo_localDishes'), t('promo_privateDining')],
      color: 'emerald',
    },
    {
      icon: Wine,
      title: t('promo_barsLounges'),
      tagline: t('promo_barsTagline'),
      desc: t('promo_barsDesc'),
      image: 'https://images.pexels.com/photos/20104020/pexels-photo-20104020.jpeg?auto=compress&cs=tinysrgb&w=1200',
      path: '/bars',
      badge: '3 Venues',
      highlights: [t('promo_signatureCocktails'), t('promo_wineCellar'), t('promo_liveEntertainment')],
      color: 'amber',
    },
    {
      icon: Bed,
      title: t('promo_roomsSuites'),
      tagline: t('promo_roomsTagline'),
      desc: t('promo_roomsDesc'),
      image: 'https://images.pexels.com/photos/8082217/pexels-photo-8082217.jpeg?auto=compress&cs=tinysrgb&w=1200',
      path: '/rooms',
      badge: '150+ Rooms',
      highlights: [t('promo_roomCategories'), t('promo_roomService247'), t('promo_smartControls')],
      color: 'blue',
    },
  ];

  const extraServices = [
    {
      icon: Dumbbell,
      title: t('more_gym'),
      desc: t('more_gymDesc'),
      image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800',
      path: '/gym',
    },
    {
      icon: Car,
      title: t('more_parking'),
      desc: t('more_parkingDesc'),
      image: 'https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=800',
      path: '/parking',
    },
    {
      icon: Sparkles,
      title: t('more_allServices'),
      desc: t('more_allServicesDesc'),
      image: 'https://images.pexels.com/photos/375797/pexels-photo-375797.jpeg?auto=compress&cs=tinysrgb&w=800',
      path: '/services',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; gradient: string; ring: string; badge: string }> = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'hover:border-amber-300', gradient: 'from-amber-500 to-amber-600', ring: 'group-hover:ring-amber-200', badge: 'bg-amber-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-300', gradient: 'from-emerald-500 to-emerald-600', ring: 'group-hover:ring-emerald-200', badge: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-300', gradient: 'from-blue-500 to-blue-600', ring: 'group-hover:ring-blue-200', badge: 'bg-blue-500' },
  };

  const toggleLike = (id: string) => {
    setLikedRooms(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displayRooms = rooms.length > 0 ? rooms : [];
  const currentSlide = HERO_SLIDE_KEYS[heroIndex];

  return (
    <div className="space-y-0 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero Section - Rotating between Rooms, Food, and Drinks */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        {HERO_SLIDE_KEYS.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === heroIndex ? 1 : 0, zIndex: i === heroIndex ? 1 : 0 }}
          >
            <SafeImage
              src={slide.image}
              alt={t(slide.eyebrowKey)}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/65 to-slate-900/30" />
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
              </div>
              <span className="text-white/80 text-sm font-medium">{t('hero_luxuryHotelResort')}</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-sm font-medium mb-5 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" /> {t(currentSlide.eyebrowKey)}
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight">
              {t(currentSlide.titleKey)}
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              {t(currentSlide.subtitleKey)}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate(currentSlide.path)}
                className="group bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2 hover:scale-105"
              >
                {t(currentSlide.ctaKey)} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/booking')}
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition border border-white/20 hover:scale-105"
              >
                {t('hero_viewAllOffers')}
              </button>
            </div>
          </div>
        </div>

        {/* Hero slide indicators */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {HERO_SLIDE_KEYS.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === heroIndex ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* Quick Stats Bar */}
      <section className="bg-white shadow-lg -mt-16 relative z-20 mx-4 sm:mx-8 lg:mx-auto max-w-6xl rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
          {[
            { value: '150+', label: t('stat_luxuryRooms') },
            { value: '7', label: t('stat_diningBarVenues') },
            { value: '4.9', label: t('stat_guestRating') },
            { value: '24/7', label: t('stat_concierge') },
          ].map((stat, i) => (
            <button
              key={i}
              onClick={() => navigate(i === 0 ? '/rooms' : i === 1 ? '/dining' : '/booking')}
              className="p-6 text-center hover:bg-slate-50 transition rounded-2xl"
            >
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Signature Promotions — Food, Drinks, Rooms as the core focus */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" /> {t('promo_signature')}
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">{t('promo_stayDineUnwind')}</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            {t('promo_subtitle')}
          </p>
        </div>

        <div className="space-y-8">
          {signaturePromos.map((promo, index) => {
            const colors = colorMap[promo.color];
            const reversed = index % 2 === 1;
            return (
              <div
                key={index}
                className={`group grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-lg border border-slate-100 ${colors.border} hover:shadow-2xl transition-all duration-500`}
              >
                {/* Image */}
                <div
                  className={`relative h-72 lg:h-auto overflow-hidden ${reversed ? 'lg:order-2' : ''}`}
                >
                  <SafeImage
                    src={promo.image}
                    alt={promo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                  <div className={`absolute top-6 ${reversed ? 'right-6' : 'left-6'} ${colors.badge} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}>
                    {promo.badge}
                  </div>
                  <div className={`absolute bottom-6 ${reversed ? 'right-6' : 'left-6'} w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg`}>
                    <promo.icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                </div>

                {/* Content */}
                <div className={`p-8 lg:p-12 flex flex-col justify-center bg-white ${reversed ? 'lg:order-1' : ''}`}>
                  <p className={`text-sm font-semibold ${colors.text} mb-2 uppercase tracking-wide`}>{promo.tagline}</p>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">{promo.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">{promo.desc}</p>
                  <div className="space-y-2.5 mb-8">
                    {promo.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                          <ChevronRight className={`w-3 h-3 ${colors.text}`} />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{h}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <button
                      onClick={() => navigate(promo.path)}
                      className={`group/btn inline-flex items-center gap-2 bg-gradient-to-r ${colors.gradient} text-white px-7 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105`}
                    >
                      {t('promo_explore')} {promo.title}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Special Offer Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-8">
        <div
          onClick={() => navigate('/booking')}
          className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-500"
        >
          <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-500/20 to-transparent w-1/2 h-full" />
          <div className="relative p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {t('offer_limited')}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">{t('offer_title')}</h3>
                <p className="text-slate-300 text-sm mt-1">{t('offer_desc')}</p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-amber-500 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-amber-600 transition-all hover:scale-105 flex-shrink-0">
              {t('offer_claim')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* More Services — secondary offerings */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{t('more_title')}</h2>
          <p className="text-slate-600">{t('more_subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {extraServices.map((service, index) => (
            <div
              key={index}
              onClick={() => navigate(service.path)}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              <div className="relative h-40 overflow-hidden">
                <SafeImage src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <h3 className="text-lg font-bold text-white">{service.title}</h3>
                </div>
              </div>
              <div className="p-5 flex items-center justify-between">
                <p className="text-slate-600 text-sm">{service.desc}</p>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Available Rooms - Interactive with detail links */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Bed className="w-4 h-4" /> {t('rooms_availableNow')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{t('rooms_luxuriousAccommodations')}</h2>
              <p className="text-slate-600 max-w-xl">{t('rooms_subtitle')}</p>
            </div>
            <button
              onClick={() => navigate('/rooms')}
              className="hidden sm:flex items-center gap-2 text-slate-900 font-semibold hover:text-amber-600 transition group"
            >
              {t('rooms_viewAll')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {displayRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayRooms.map((room) => {
                const typeName = room.room_type?.name || 'Standard';
                const image = room.room_type?.image_url || ROOM_IMAGES[typeName] || ROOM_IMAGES['Standard'];
                const roomFeatures = ROOM_FEATURES[typeName] || ROOM_FEATURES['Standard'];
                const isLiked = likedRooms.has(room.id);
                return (
                  <div
                    key={room.id}
                    onClick={() => navigate(`/rooms/${room.id}`)}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <SafeImage src={image} alt={`Room ${room.room_number}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(room.id); }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      </button>
                      <div className="absolute bottom-3 left-3 text-white">
                        <p className="text-sm font-medium opacity-80">{t('rooms_from')}</p>
                        <p className="text-2xl font-bold">ETB {room.room_type?.base_price?.toLocaleString()}<span className="text-sm font-normal opacity-80">/{t('rooms_night')}</span></p>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{t('rooms_available')}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-lg text-slate-900 mb-1">Room {room.room_number}</h3>
                      <p className="text-sm text-slate-500 mb-3">{typeName}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {roomFeatures.map((f, i) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{f}</span>
                        ))}
                      </div>
                      <button className="w-full bg-slate-100 text-slate-900 py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-500 hover:text-white transition flex items-center justify-center gap-2 group/btn">
                        {t('rooms_viewDetailsBook')}
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Standard Room', price: 149, image: ROOM_IMAGES['Standard'], features: ROOM_FEATURES['Standard'] },
                { name: 'Deluxe Suite', price: 249, image: ROOM_IMAGES['Deluxe'], features: ROOM_FEATURES['Deluxe'] },
                { name: 'Executive Suite', price: 399, image: ROOM_IMAGES['Executive'], features: ROOM_FEATURES['Executive'] },
                { name: 'Presidential Suite', price: 799, image: ROOM_IMAGES['Presidential'], features: ROOM_FEATURES['Presidential'] },
              ].map((room, index) => (
                <div
                  key={index}
                  onClick={() => navigate('/rooms')}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <SafeImage src={room.image} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-sm font-medium opacity-80">{t('rooms_from')}</p>
                      <p className="text-2xl font-bold">ETB {room.price.toLocaleString()}<span className="text-sm font-normal opacity-80">/{t('rooms_night')}</span></p>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-slate-900 mb-1">{room.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {room.features.map((f, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{f}</span>
                      ))}
                    </div>
                    <button className="w-full bg-slate-100 text-slate-900 py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-500 hover:text-white transition flex items-center justify-center gap-2 group/btn">
                      View Details & Book
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate('/rooms')}
            className="sm:hidden mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-semibold"
          >
            {t('rooms_viewAll')}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{t('features_title')}</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">{t('features_subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-amber-200 transition-all duration-300">
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:from-amber-50 group-hover:to-amber-100 transition-colors">
                <feature.icon className="w-7 h-7 text-slate-700 group-hover:text-amber-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{t('amenities_title')}</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">{t('amenities_subtitle')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {amenities.map((amenity, index) => (
            <div key={index} className="bg-white p-5 rounded-xl border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all text-center hover:-translate-y-1 cursor-pointer">
              <amenity.icon className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 text-sm">{amenity.name}</h4>
              <p className="text-xs text-slate-500 mt-1">{amenity.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('gallery_title')}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">{t('gallery_subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { url: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'Pool Area', path: '/gym' },
              { url: 'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'Spa & Wellness', path: '/gym' },
              { url: 'https://images.pexels.com/photos/157189/pexels-photo-157189.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'Fine Dining', path: '/dining' },
              { url: 'https://images.pexels.com/photos/262042/pexels-photo-262042.jpeg?auto=compress&cs=tinysrgb&w=600', label: 'Luxury Suite', path: '/rooms' },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => navigate(item.path)}
                className={`relative overflow-hidden rounded-xl cursor-pointer group ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <SafeImage src={item.url} alt={item.label} className={`w-full ${i === 0 ? 'h-full min-h-[300px]' : 'h-48'} object-cover group-hover:scale-110 transition-transform duration-500`} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition">
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-white/70 text-xs flex items-center gap-1">Explore <ArrowRight className="w-3 h-3" /></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <SafeImage src="https://images.pexels.com/photos/3225528/pexels-photo-3225528.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="Luxury Experience" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-slate-900/80" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" /> {t('cta_ready')}
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">{t('cta_title')}</h2>
          <p className="text-xl text-slate-300 mb-8">{t('cta_desc')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/rooms')}
              className="group bg-gradient-to-r from-amber-500 to-amber-600 text-white px-10 py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition shadow-lg shadow-amber-500/25 flex items-center gap-2 hover:scale-105"
            >
              {t('cta_bookRoom')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/dining')}
              className="bg-white/10 backdrop-blur text-white px-10 py-4 rounded-xl font-semibold hover:bg-white/20 transition border border-white/20 flex items-center gap-2 hover:scale-105"
            >
              <UtensilsCrossed className="w-5 h-5" /> {t('cta_reserveTable')}
            </button>
            <button
              onClick={() => navigate('/bars')}
              className="bg-white/10 backdrop-blur text-white px-10 py-4 rounded-xl font-semibold hover:bg-white/20 transition border border-white/20 flex items-center gap-2 hover:scale-105"
            >
              <Wine className="w-5 h-5" /> {t('cta_bookBar')}
            </button>
            <a
              href="tel:+251911234567"
              className="bg-white/10 backdrop-blur text-white px-10 py-4 rounded-xl font-semibold hover:bg-white/20 transition border border-white/20 flex items-center gap-2 hover:scale-105"
            >
              <Phone className="w-5 h-5" /> +251 91 123 4567
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">{t('footer_about')}</h3>
              <p className="text-sm leading-relaxed">{t('footer_aboutDesc')}</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer_quickLinks')}</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/rooms')} className="hover:text-white transition">{t('nav_rooms')}</button></li>
                <li><button onClick={() => navigate('/dining')} className="hover:text-white transition">{t('nav_dining')}</button></li>
                <li><button onClick={() => navigate('/bars')} className="hover:text-white transition">{t('hero_barsLounges')}</button></li>
                <li><button onClick={() => navigate('/gym')} className="hover:text-white transition">{t('more_gym')}</button></li>
                <li><button onClick={() => navigate('/parking')} className="hover:text-white transition">{t('more_parking')}</button></li>
                <li><button onClick={() => navigate('/booking')} className="hover:text-white transition">{t('cta_bookRoom')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer_contact')}</h4>
              <p className="text-sm">Bole Road, Airport Area<br />Addis Ababa, Ethiopia<br />reservations@grandhotel.et</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer_hours')}</h4>
              <p className="text-sm">{t('footer_reception')}<br />{t('footer_restaurant')}<br />{t('footer_bar')}<br />{t('footer_spa')}</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>{t('footer_rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
