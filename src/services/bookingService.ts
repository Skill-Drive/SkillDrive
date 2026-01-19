import type { Booking, InstructorProfile } from '../types';
import { setHours, setMinutes, isSameDay, addDays } from 'date-fns';

// Mock Data Store
let MOCK_BOOKINGS: Booking[] = [];

// Generate some initial availability
const MOCK_INSTRUCTOR: InstructorProfile = {
  id: '1',
  email: 'instructor@skilldrive.com',
  full_name: 'Sarah Wilson',
  role: 'instructor',
  bio: 'Patient and experienced instructor with 10+ years of experience. I specialize in nervous learners and defensive driving techniques.',
  suburbs_covered: ['Surry Hills', 'Redfern', 'Waterloo', 'Zetland'],
  vehicle: {
    model: 'Toyota Corolla Hybrid',
    year: 2023,
    transmission: 'Auto',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
  },
  hourly_rate: 75,
  rating: 4.9,
  review_count: 124
};

export const bookingService = {
  getInstructor: async (_id: string): Promise<InstructorProfile | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_INSTRUCTOR;
  },

  getAvailableSlots: async (instructorId: string, date: Date): Promise<Date[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock Logic: Generate slots for 9 AM to 5 PM
    const slots: Date[] = [];
    const startHour = 9;
    const endHour = 17;

    for (let i = startHour; i < endHour; i++) {
      const slot = setMinutes(setHours(date, i), 0);
      
      // Filter out past times
      if (slot < new Date()) continue;

      // Filter out existing bookings (Smart Scheduling Logic)
      const isBooked = MOCK_BOOKINGS.some(booking => {
        const bookingStart = new Date(booking.start_time);
        return booking.instructor_id === instructorId && 
               isSameDay(bookingStart, date) && 
               bookingStart.getHours() === i;
      });

      if (!isBooked) {
        slots.push(slot);
      }
    }
    return slots;
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'status'>): Promise<Booking> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // Double-check availability (Concurrency check mock)
    const conflict = MOCK_BOOKINGS.find(b => 
      b.instructor_id === booking.instructor_id && 
      b.start_time === booking.start_time &&
      b.status !== 'cancelled'
    );

    if (conflict) {
      throw new Error("This slot was just taken. Please choose another.");
    }

    const newBooking: Booking = {
      ...booking,
      id: Math.random().toString(36).substr(2, 9),
      status: 'confirmed'
    };

    MOCK_BOOKINGS.push(newBooking);
    return newBooking;
  },

  getBookings: async (userId: string): Promise<Booking[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    // In a real app, we'd filter by userId. For MVP, we return all mock bookings + some generated ones if empty
    if (MOCK_BOOKINGS.length === 0) {
       // Seed with some test data if empty
       const today = new Date();
       MOCK_BOOKINGS = [
         {
           id: 'booking-1',
           instructor_id: '1',
           learner_id: userId,
           start_time: setHours(addDays(today, 2), 10).toISOString(),
           end_time: setHours(addDays(today, 2), 11).toISOString(),
           status: 'confirmed',
           pickup_address: '123 Main St, Surry Hills',
           price: 75
         },
         {
           id: 'booking-2',
           instructor_id: '1',
           learner_id: userId,
           start_time: setHours(addDays(today, 5), 14).toISOString(),
           end_time: setHours(addDays(today, 5), 15).toISOString(),
           status: 'confirmed',
           pickup_address: '456 George St, Redfern',
           price: 75
         }
       ];
    }
    return MOCK_BOOKINGS.filter(b => b.learner_id === userId || b.learner_id === 'current-user-id');
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const booking = MOCK_BOOKINGS.find(b => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");
    
    // Simple rule: Allow cancellation if not completed/cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new Error("Cannot cancel this booking");
    }

    booking.status = 'cancelled';
  }
};
