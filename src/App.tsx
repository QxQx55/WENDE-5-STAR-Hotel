import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { HomePage, RoomsPage, LoginPage, SignupPage } from './pages';
import Dashboard from './components/Dashboard';
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
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignupPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />
      <Route
        path="/rooms"
        element={
          <MainLayout>
            <RoomsPage />
          </MainLayout>
        }
      />

      {/* Admin/Staff Routes */}
      {user && (profile?.role === 'admin' || profile?.role === 'staff') && (
        <>
          <Route
            path="/admin"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <MainLayout>
                <Dashboard />
              </MainLayout>
            }
          />
        </>
      )}

      {/* Customer Routes */}
      {user && profile?.role === 'customer' && (
        <Route
          path="/bookings"
          element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          }
        />
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
