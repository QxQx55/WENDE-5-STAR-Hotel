import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Portfolio from './components/Portfolio';
import Dashboard from './components/Dashboard';
import GuestManagement from './components/GuestManagement';
import RoomManagement from './components/RoomManagement';
import ReservationManagement from './components/ReservationManagement';
import BillingManagement from './components/BillingManagement';
import { Hotel, LayoutDashboard, Users, Bed, Calendar, Receipt, LogOut } from 'lucide-react';

type Page = 'portfolio' | 'login' | 'dashboard' | 'guests' | 'rooms' | 'reservations' | 'billing';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('portfolio');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentPage === 'portfolio') {
    return <Portfolio onLoginClick={() => setCurrentPage('login')} />;
  }

  if (currentPage === 'login') {
    return <Login onPortfolioClick={() => setCurrentPage('portfolio')} />;
  }

  if (!user || !profile) {
    return <Login onPortfolioClick={() => setCurrentPage('portfolio')} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'guests', label: 'Guests', icon: Users },
    { id: 'rooms', label: 'Rooms', icon: Bed },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'billing', label: 'Billing', icon: Receipt },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'guests':
        return <GuestManagement />;
      case 'rooms':
        return <RoomManagement />;
      case 'reservations':
        return <ReservationManagement />;
      case 'billing':
        return <BillingManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <Hotel className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Hotel Manager</h1>
              <p className="text-xs text-slate-400">5-Star Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentPage(item.id as Page)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      currentPage === item.id
                        ? 'bg-white text-slate-900'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-4 px-4">
            <p className="text-sm text-slate-400">Logged in as</p>
            <p className="font-medium text-white truncate">{profile.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{profile.role}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{renderPage()}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
