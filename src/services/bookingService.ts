import { supabase } from './supabase';
import type { Booking, InstructorProfile } from '../types';

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

  searchInstructors: async (filters: any = {}, postcode?: string): Promise<any[]> => {
    const { data, error } = await supabase.functions.invoke('search-instructors', {
      body: { filters, postcode },
    });
    if (error || !data) return [];
    return data.instructors;
  }
};
