export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'learner' | 'instructor';
  avatar_url?: string;
  phone?: string;
}

export interface InstructorProfile extends Profile {
  bio: string;
  suburbs_covered: string[];
  vehicle: {
    model: string;
    year: number;
    transmission: 'Auto' | 'Manual';
    image_url: string;
  };
  hourly_rate: number;
  rating: number;
  review_count: number;
}

export interface Booking {
  id: string;
  instructor_id: string;
  learner_id: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  pickup_address: string;
  price: number;
}

export interface AvailabilitySlot {
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // "09:00"
  end_time: string; // "17:00"
}
