import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Star, MapPin, Users, Award, ArrowRight } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Star,
      title: 'Luxury Rooms',
      description: 'Choose from our collection of beautifully appointed rooms',
    },
    {
      icon: MapPin,
      title: 'Prime Location',
      description: 'Centrally located with easy access to all attractions',
    },
    {
      icon: Users,
      title: 'Expert Service',
      description: 'Dedicated staff ready to assist you 24/7',
    },
    {
      icon: Award,
      title: 'Award Winning',
      description: 'Recognized for excellence in hospitality',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-lg overflow-hidden">
        <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-24">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Welcome to Your Perfect Stay
          </h1>
          <p className="text-xl text-slate-200 mb-8 max-w-2xl">
            Experience luxury and comfort with our exceptional hotel accommodations and world-class service.
          </p>
          <div className="flex gap-4">
            {!user ? (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition flex items-center gap-2"
                >
                  Sign In <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="bg-slate-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-slate-600 transition flex items-center gap-2"
                >
                  Create Account <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/rooms')}
                className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition flex items-center gap-2"
              >
                Browse Rooms <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition">
                <div className="bg-slate-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Book Your Stay?</h2>
        <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
          Check out our available rooms and make a reservation today. Our team is ready to make your stay unforgettable.
        </p>
        {user ? (
          <button
            onClick={() => navigate('/rooms')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            View Rooms <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            Sign In to Book <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </section>
    </div>
  );
}
