import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { authService, userService } from '../services/supabase';
import type { User } from '../types';

type AuthContextType = {
  user: AuthUser | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'finance' | 'customer' | 'staff'
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getSession().then((session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser: AuthUser) => {
    const userId = authUser.id;
    const fallbackRole = (authUser.user_metadata?.role ?? authUser.app_metadata?.role ?? 'customer') as User['role'];

    try {
      const data = await userService.getProfile(userId, {
        id: userId,
        email: authUser.email ?? '',
        full_name: authUser.user_metadata?.full_name ?? 'Hotel Guest',
        role: fallbackRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setProfile(data ?? {
        id: userId,
        email: authUser.email ?? '',
        full_name: authUser.user_metadata?.full_name ?? 'Hotel Guest',
        role: fallbackRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile({
        id: userId,
        email: authUser.email ?? '',
        full_name: authUser.user_metadata?.full_name ?? 'Hotel Guest',
        role: fallbackRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { user: authUser } = await authService.signIn(email, password);
    if (!authUser) throw new Error('Failed to sign in');
    setUser(authUser);
    await fetchProfile(authUser);
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'finance' | 'customer' | 'staff' = 'customer'
  ) => {
    const { user: authUser, session } = await authService.signUp(email, password, fullName, role);
    if (!authUser) throw new Error('Failed to create account');

    setUser(authUser);
    await fetchProfile(authUser);
    return Boolean(session);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
