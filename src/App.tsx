import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { MainLayout } from './layouts/MainLayout';
import {
  HomePage, RoomsPage, RoomDetailPage, LoginPage, SignupPage, BookingPage,
  RoomsBookingPage, DiningPage, DiningDetailPage, ParkingPage, ParkingDetailPage,
  BarsPage, GymPage, GymDetailPage, ServicesPage
} from './pages';
import AdminDashboard from './components/AdminDashboard';
import PmsDashboard from './components/PmsDashboard';
import { Loader } from 'lucide-react';

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage />} />
      <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/rooms" element={<MainLayout><RoomsPage /></MainLayout>} />
      <Route path="/rooms/:id" element={<MainLayout><RoomDetailPage /></MainLayout>} />
      <Route path="/rooms-booking" element={<MainLayout><RoomsBookingPage /></MainLayout>} />
      <Route path="/dining" element={<MainLayout><DiningPage /></MainLayout>} />
      <Route path="/dining/:id" element={<MainLayout><DiningDetailPage /></MainLayout>} />
      <Route path="/parking" element={<MainLayout><ParkingPage /></MainLayout>} />
      <Route path="/parking/:id" element={<MainLayout><ParkingDetailPage /></MainLayout>} />
      <Route path="/bars" element={<MainLayout><BarsPage /></MainLayout>} />
      <Route path="/gym" element={<MainLayout><GymPage /></MainLayout>} />
      <Route path="/gym/:id" element={<MainLayout><GymDetailPage /></MainLayout>} />
      <Route path="/services" element={<MainLayout><ServicesPage /></MainLayout>} />
      <Route path="/booking" element={<MainLayout><BookingPage /></MainLayout>} />

      {/* PMS Dashboard */}
      {user && profile?.role && ['admin', 'manager', 'front_desk', 'housekeeping', 'finance'].includes(profile.role) && (
        <>
          <Route path="/pms" element={<PmsDashboard />} />
          <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
          <Route path="/dashboard" element={<MainLayout><AdminDashboard /></MainLayout>} />
        </>
      )}

      {user && profile?.role === 'customer' && (
        <Route path="/bookings" element={<MainLayout><BookingPage /></MainLayout>} />
      )}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
