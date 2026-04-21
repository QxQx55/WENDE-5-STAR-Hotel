import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Hotel, LogOut, Home, Bed, Calendar, LayoutDashboard } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getNavItems = () => {
    const baseItems = [
      { label: 'Home', path: '/', icon: Home },
      { label: 'Rooms', path: '/rooms', icon: Bed },
    ];

    if (profile?.role === 'customer') {
      return [
        ...baseItems,
        { label: 'My Bookings', path: '/bookings', icon: Calendar },
      ];
    }

    if (profile?.role === 'staff' || profile?.role === 'admin') {
      return [
        ...baseItems,
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Bookings', path: '/admin/bookings', icon: Calendar },
      ];
    }

    return baseItems;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-slate-900 p-2 rounded-lg">
                <Hotel className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Hotel Manager</span>
            </div>

            {/* Nav Items */}
            <div className="flex items-center gap-1">
              {getNavItems().map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {profile && (
                <>
                  <div className="text-sm">
                    <p className="font-medium text-slate-900">{profile.full_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-600">
            <p>&copy; 2024 Hotel Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
