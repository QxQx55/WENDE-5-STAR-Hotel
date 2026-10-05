import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';
import {
  Hotel,
  LogOut,
  Home,
  Bed,
  Calendar,
  LayoutDashboard,
  Menu,
  X,
  User,
  CalendarCheck,
  UtensilsCrossed,
  Car,
  Wine,
  Dumbbell,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const baseItems = [
    { label: t('nav_home'), path: '/', icon: Home },
    { label: t('nav_rooms'), path: '/rooms', icon: Bed },
    { label: 'Experiences', path: '/experiences', icon: Sparkles },
  ];

  const getNavItems = () => {
    if (profile?.role === 'customer') {
      return [...baseItems, { label: t('nav_myBookings'), path: '/bookings', icon: Calendar }];
    }

    if (profile?.role && ['admin', 'manager', 'front_desk', 'housekeeping', 'finance', 'staff'].includes(profile.role)) {
      return [
        ...baseItems,
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Bookings', path: '/dashboard/bookings', icon: Calendar },
      ];
    }

    return baseItems;
  };

  const servicesMenuItems = [
    { label: t('nav_rooms'), path: '/rooms', icon: Bed, desc: t('service_rooms_desc') },
    { label: t('nav_dining'), path: '/dining', icon: UtensilsCrossed, desc: t('service_dining_desc') },
    { label: 'Parking', path: '/parking', icon: Car, desc: t('service_parking_desc') },
    { label: 'Bars & Lounges', path: '/bars', icon: Wine, desc: t('service_bars_desc') },
    { label: t('nav_gym'), path: '/gym', icon: Dumbbell, desc: t('service_gym_desc') },
  ];

  const navItems = getNavItems();
  const isPmsRoute = location.pathname.startsWith('/pms');

  if (isPmsRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-2 rounded-xl shadow-lg">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900">ወንዴ Grand Hotel and Spa</span>
                <span className="hidden sm:inline text-xs text-amber-600 ml-1.5">{t('hotelTagline')}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    location.pathname === path ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}

              <div className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    ['/rooms', '/dining', '/parking', '/bars', '/gym'].includes(location.pathname)
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  {t('nav_services')}
                  <ChevronDown className={`w-3 h-3 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {servicesOpen && (
                  <div
                    onMouseEnter={() => setServicesOpen(true)}
                    onMouseLeave={() => setServicesOpen(false)}
                    className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-xl border border-slate-100 py-2 z-50"
                  >
                    {servicesMenuItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setServicesOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition ${
                          location.pathname === item.path ? 'bg-amber-50 text-amber-900' : 'text-slate-700'
                        }`}
                      >
                        <item.icon className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {profile?.role && ['admin', 'manager', 'front_desk', 'housekeeping', 'finance', 'staff'].includes(profile.role) && (
                <button
                  onClick={() => navigate('/pms')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    location.pathname === '/pms' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav_pms')}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageToggle />
              {profile ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-900">{profile.full_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{profile.role?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-sm font-medium">
                    {profile.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('nav_signOut')}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
                >
                  <User className="w-4 h-4" />
                  {t('nav_signIn')}
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-100">
              {navItems.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition ${
                    location.pathname === path ? 'bg-amber-50 text-amber-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}

              <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">{t('nav_services')}</p>
              {servicesMenuItems.map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => {
                    navigate(path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition ${
                    location.pathname === path ? 'bg-amber-50 text-amber-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}

              {profile?.role && ['admin', 'manager', 'front_desk', 'housekeeping', 'finance', 'staff'].includes(profile.role) && (
                <button
                  onClick={() => {
                    navigate('/pms');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav_pms')}
                </button>
              )}
              <div className="px-3 py-2">
                <LanguageToggle />
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="pt-16">{children}</main>
    </div>
  );
}
