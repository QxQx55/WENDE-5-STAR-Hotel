import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import { authService, userService } from '../services/supabase';
import type { User } from '../types';

type AuthContextType = {
  user: AuthUser | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: 'customer' | 'staff' | 'admin') => Promise<void>;
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
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const data = await userService.getProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { user: authUser } = await authService.signIn(email, password);
    if (!authUser) throw new Error('Failed to sign in');
    setUser(authUser);
    await fetchProfile(authUser.id);
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'customer' | 'staff' | 'admin' = 'customer') => {
    const { user: authUser } = await authService.signUp(email, password, fullName, role);
    if (!authUser) throw new Error('Failed to create account');

    await new Promise(resolve => setTimeout(resolve, 500));

    const existingProfile = await userService.getProfile(authUser.id);
    if (!existingProfile) {
      await userService.updateProfile(authUser.id, {
        id: authUser.id,
        email,
        full_name: fullName,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User);
    }

    setUser(authUser);
    await fetchProfile(authUser.id);
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
