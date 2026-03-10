import { supabase } from './supabase';
import type { Booking, InstructorProfile } from '../types';
<<<<<<< HEAD

export const bookingService = {
  getInstructor: async (id: string): Promise<InstructorProfile | null> => {
    const { data, error } = await supabase.functions.invoke('get-instructor', {
      body: { id },
    });
    if (error || !data) return null;
    return data.instructor;
  },

  getAvailableSlots: async (instructorId: string, date: Date): Promise<Date[]> => {
    const { data, error } = await supabase.functions.invoke('get-available-slots', {
      body: { instructorId, dateIso: date.toISOString() },
    });
    if (error || !data) return [];
    return data.slots.map((isoStr: string) => new Date(isoStr));
  },

  createBooking: async (): Promise<Booking> => {
    throw new Error('Please use Stripe checkout');
  },

  getBookings: async (_userId?: string): Promise<any[]> => {
    const { data, error } = await supabase.functions.invoke('get-bookings');
    if (error || !data) return [];
    return data.bookings;
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('cancel-booking', {
      body: { bookingId },
    });
    if (error) throw error;
  },

  getUserProfile: async () => {
    const { data, error } = await supabase.functions.invoke('get-user-profile');
    if (error || !data) return null;
    return data.profile;
  },

  searchInstructors: async (filters: any = {}): Promise<any[]> => {
    const { data, error } = await supabase.functions.invoke('search-instructors', {
      body: { filters },
    });
    if (error || !data) return [];
    return data.instructors;
  }
=======
import { setHours, setMinutes } from 'date-fns';

export const bookingService = {
  getInstructor: async (id: string): Promise<InstructorProfile | null> => {
    const { data, error } = await supabase
      .from('instructors')
      .select('*, profiles!id(id, email, full_name, role, avatar_url, phone)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const profile = data.profiles as {
      id: string; email: string; full_name: string;
      role: string; avatar_url: string | null; phone: string | null;
    };

    return {
      id: data.id,
      email: profile.email,
      full_name: profile.full_name,
      role: 'instructor',
      avatar_url: profile.avatar_url ?? undefined,
      phone: profile.phone ?? undefined,
      bio: data.bio ?? '',
      suburbs_covered: data.suburbs_covered ?? [],
      hourly_rate: data.hourly_rate,
      rating: data.rating,
      review_count: data.review_count,
      vehicle: {
        model: data.vehicle_model ?? '',
        year: data.vehicle_year ?? new Date().getFullYear(),
        transmission: data.vehicle_transmission ?? 'Auto',
        image_url: data.vehicle_image_url ?? '',
      },
    };
  },

  getAvailableSlots: async (instructorId: string, date: Date): Promise<Date[]> => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: booked } = await supabase
      .from('bookings')
      .select('start_time')
      .eq('instructor_id', instructorId)
      .neq('status', 'cancelled')
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString());

    const bookedHours = new Set(
      (booked ?? []).map((b: { start_time: string }) => new Date(b.start_time).getHours())
    );

    const slots: Date[] = [];
    for (let hour = 9; hour < 17; hour++) {
      const slot = setMinutes(setHours(date, hour), 0);
      if (slot < new Date()) continue;
      if (!bookedHours.has(hour)) slots.push(slot);
    }
    return slots;
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'status'>): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        instructor_id: booking.instructor_id,
        learner_id: booking.learner_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        pickup_address: booking.pickup_address,
        price: booking.price,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Booking;
  },

  getBookingById: async (bookingId: string): Promise<Booking | null> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !data) return null;
    return data as Booking;
  },

  confirmBooking: async (bookingId: string): Promise<void> => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId);

    if (error) throw new Error(error.message);
  },

  getBookings: async (userId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('learner_id', userId)
      .order('start_time', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Booking[];
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw new Error(error.message);
  },
>>>>>>> a34140ab77d1f7430e7c8e9416fe8ef22053e941
};
