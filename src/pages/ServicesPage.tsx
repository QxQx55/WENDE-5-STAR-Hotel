import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import {
  Sparkles, Clock, Users, ArrowRight, Loader2, CheckCircle2,
  XCircle, Search, Zap, Bed, UtensilsCrossed, Dumbbell, Car, Wine,
  Flower2, Shirt, ShoppingBag, Bus
} from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { SafeImage } from '../components/SafeImage';

interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  image_url?: string;
  max_capacity?: number;
  is_active?: boolean;
}

interface ServiceCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  image: string;
  color: string;
  description: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'spa',
    label: 'Spa & Wellness',
    icon: Flower2,
    image: 'https://images.pexels.com/photos/375797/pexels-photo-375797.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'pink',
    description: 'Relax and rejuvenate with our spa treatments'
  },
  {
    id: 'dining',
    label: 'Dining',
    icon: UtensilsCrossed,
    image: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'amber',
    description: 'Fine dining experiences and culinary delights'
  },
  {
    id: 'gym',
    label: 'Gym & Fitness',
    icon: Dumbbell,
    image: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'emerald',
    description: 'Stay fit with our fitness classes and trainers'
  },
  {
    id: 'bars',
    label: 'Bars & Lounges',
    icon: Wine,
    image: 'https://images.pexels.com/photos/3014827/pexels-photo-3014827.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'purple',
    description: 'Enjoy signature cocktails and nightlife'
  },
  {
    id: 'parking',
    label: 'Parking',
    icon: Car,
    image: 'https://images.pexels.com/photos/1007435/pexels-photo-1007435.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'blue',
    description: 'Convenient parking with EV charging'
  },
  {
    id: 'laundry',
    label: 'Laundry',
    icon: Shirt,
    image: 'https://images.pexels.com/photos/6194346/pexels-photo-6194346.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'cyan',
    description: 'Professional laundry and dry cleaning'
  },
  {
    id: 'room_service',
    label: 'Room Service',
    icon: Bed,
    image: 'https://images.pexels.com/photos/1585829/pexels-photo-1585829.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'orange',
    description: '24/7 in-room dining delivered to you'
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: Sparkles,
    image: 'https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'rose',
    description: 'Tours, excursions and recreational activities'
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: Bus,
    image: 'https://images.pexels.com/photos/23192/pexels-photo-23192.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'slate',
    description: 'Airport transfers and transportation services'
  },
  {
    id: 'other',
    label: 'Other Services',
    icon: ShoppingBag,
    image: 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=800',
    color: 'gray',
    description: 'Additional services and amenities'
  },
];

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

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', gradient: 'from-pink-500 to-pink-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', gradient: 'from-amber-500 to-amber-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', gradient: 'from-emerald-500 to-emerald-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', gradient: 'from-purple-500 to-purple-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', gradient: 'from-blue-500 to-blue-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', gradient: 'from-cyan-500 to-cyan-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', gradient: 'from-orange-500 to-orange-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', gradient: 'from-rose-500 to-rose-600' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', gradient: 'from-slate-500 to-slate-600' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', gradient: 'from-gray-500 to-gray-600' },
};

export function ServicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadServices();

    // Real-time subscription
    const channel = supabase
      .channel('services-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pms_services' },
        () => loadServices()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('pms_services')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (!error && data) {
        setServices(data);
      }
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Filter services based on search
  const filteredGroups = Object.entries(groupedServices).filter(([category, categoryServices]) => {
    if (selectedCategory && category !== selectedCategory) return false;
    if (searchQuery) {
      return categoryServices.some(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const getCategoryInfo = (catId: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === catId) || SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1];
  };

  const handleBookService = (service: Service) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Navigate to booking with service details
    navigate('/booking', {
      state: {
        type: 'service',
        serviceId: service.id,
        serviceName: service.name,
        amount: service.price,
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Hero Section */}
      <section className="relative h-[45vh] min-h-[350px] overflow-hidden">
        <SafeImage
          src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Hotel Services"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span className="text-amber-400 font-medium">All Hotel Services</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Discover Our Services</h1>
          <p className="text-lg text-slate-300 max-w-xl">Browse all our hotel services and amenities. From spa treatments to dining, fitness to transport.</p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="sticky top-16 z-30 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search services by name or description..."
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Navigation Grid */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SERVICE_CATEGORIES.map(category => {
              const count = groupedServices[category.id]?.length || 0;
              const colors = COLOR_MAP[category.color];
              const isSelected = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                  className={`relative overflow-hidden rounded-xl h-32 text-left transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-amber-500 shadow-lg scale-105' : 'hover:shadow-md hover:-translate-y-1'
                  }`}
                >
                  <SafeImage
                    src={category.image}
                    alt={category.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent ${isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <category.icon className="w-4 h-4 text-white" />
                      <span className="text-white font-semibold text-sm">{category.label}</span>
                    </div>
                    <span className={`text-xs ${count > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                      {count} {count === 1 ? 'service' : 'services'}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white p-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Clear Filter Button */}
        {selectedCategory && (
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm text-slate-600">Showing: {getCategoryInfo(selectedCategory).label}</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-amber-600 font-medium hover:text-amber-700"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Services by Category */}
        {filteredGroups.map(([category, categoryServices]) => {
          const categoryInfo = getCategoryInfo(category);
          const colors = COLOR_MAP[categoryInfo.color];
          const isExpanded = expandedCategory === category;

          return (
            <div key={category} className="mb-10">
              {/* Category Header */}
              <div
                className={`bg-white rounded-t-xl border border-slate-200 p-5 cursor-pointer hover:bg-slate-50 transition ${isExpanded ? 'border-b-0 rounded-b-none' : 'rounded-xl'}`}
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0`}>
                      <SafeImage src={categoryInfo.image} alt={categoryInfo.label} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <categoryInfo.icon className={`w-5 h-5 ${colors.text}`} />
                        <h3 className="text-lg font-bold text-slate-900">{categoryInfo.label}</h3>
                      </div>
                      <p className="text-sm text-slate-500">{categoryInfo.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                      {categoryServices.length} {categoryServices.length === 1 ? 'service' : 'services'}
                    </span>
                    <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </div>

              {/* Category Services Grid */}
              {isExpanded && (
                <div className="bg-slate-50 border border-slate-200 border-t-0 rounded-b-xl p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryServices.map(service => {
                      const imageUrl = service.image_url || SERVICE_IMAGES[service.category] || SERVICE_IMAGES['other'];

                      return (
                        <div
                          key={service.id}
                          className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-amber-200 transition-all duration-300 group"
                        >
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={imageUrl}
                              alt={service.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                            <div className="absolute top-2 right-2">
                              <span className="bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                Available
                              </span>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                              <h4 className="font-semibold text-white truncate">{service.name}</h4>
                            </div>
                          </div>

                          <div className="p-4">
                            {service.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{service.description}</p>
                            )}

                            <div className="flex items-center justify-between mb-3">
                              <span className="text-lg font-bold text-amber-600">ETB {service.price.toLocaleString()}</span>
                              {service.duration_minutes && (
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  {service.duration_minutes} min
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleBookService(service)}
                              className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition flex items-center justify-center gap-2"
                            >
                              Book Now
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* No Services */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No services found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'No services have been added yet'}
            </p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-amber-600 font-medium hover:text-amber-700"
              >
                Clear category filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ServicesPage;
