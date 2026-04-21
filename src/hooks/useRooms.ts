import { useState, useEffect } from 'react';
import { roomService } from '../services/supabase';
import type { Room } from '../types';

export const useRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getRooms();
      setRooms(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch rooms'));
    } finally {
      setLoading(false);
    }
  };

  return { rooms, loading, error, refetch: fetchRooms };
};

export const useAvailableRooms = (checkIn: string, checkOut: string) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (checkIn && checkOut) {
      fetchAvailableRooms();
    }
  }, [checkIn, checkOut]);

  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getAvailableRooms(checkIn, checkOut);
      setRooms(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch available rooms'));
    } finally {
      setLoading(false);
    }
  };

  return { rooms, loading, error };
};
