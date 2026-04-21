import { useState, useEffect } from 'react';
import { bookingService } from '../services/supabase';
import type { Booking } from '../types';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch bookings'));
    } finally {
      setLoading(false);
    }
  };

  return { bookings, loading, error, refetch: fetchBookings };
};

export const useUserBookings = (userId: string | undefined) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserBookings();
    }
  }, [userId]);

  const fetchUserBookings = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await bookingService.getUserBookings(userId);
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user bookings'));
    } finally {
      setLoading(false);
    }
  };

  return { bookings, loading, error, refetch: fetchUserBookings };
};
