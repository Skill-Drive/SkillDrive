export type UserRole = 'learner' | 'instructor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
}

export type VerificationStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

export interface InstructorProfile extends Profile {
  bio: string;
  suburbs_covered: string[];
  postcodes_covered: string[];
  vehicle: {
    model: string;
    year: number;
    transmission: 'Auto' | 'Manual';
    image_url: string;
  };
  hourly_rate: number;
  rating: number;
  review_count: number;
  id_verified: boolean;
  dual_control: boolean;
  verification_status: VerificationStatus;
  // NSW compliance
  dia_number?: string;
  di_licence_expiry?: string;
  wwcc_number?: string;
  wwcc_expiry?: string;
  vehicle_registration?: string;
  vehicle_registration_expiry?: string;
  stripe_onboarding_complete?: boolean;
  packages?: InstructorPackage[];
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type LessonType = 'standard' | 'test_package' | 'intl_conversion';

export interface Booking {
  id: string;
  instructor_id: string;
  learner_id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  price: number;
  pickup_address: string;
  created_at: string;
  duration_minutes?: number;
  lesson_type?: LessonType;
  package_id?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  stripe_refund_id?: string | null;
  completed_at?: string | null;
  rescheduled_from?: string | null;
  other_party?: {
    full_name: string;
  };
  user_is_learner?: boolean;
}

export interface AvailabilitySlot {
  id?: string;
  instructor_id?: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // "09:00"
  end_time: string; // "17:00"
  is_active?: boolean;
}

export type PackageType = 'test_package' | 'intl_conversion' | 'lesson_bundle';

export interface InstructorPackage {
  id: string;
  instructor_id: string;
  name: string;
  description: string;
  package_type: PackageType;
  price: number; // dollars AUD
  duration_minutes: number;
  includes_car_for_test: boolean;
  active: boolean;
}

export interface Review {
  id: string;
  booking_id: string;
  instructor_id: string;
  learner_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface TelemetryPoint {
  lat: number;
  lng: number;
  t: string; // ISO timestamp
  speed: number | null; // m/s from Geolocation API, null if unavailable
}

export interface LessonTelemetry {
  id: string;
  booking_id: string;
  recorded_by: string;
  status: 'recording' | 'completed';
  started_at: string;
  ended_at?: string | null;
  points: TelemetryPoint[];
  distance_km?: number | null;
  max_speed_kmh?: number | null;
}

export type TicketCategory = 'dispute' | 'technical' | 'billing' | 'safety' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  user_id: string;
  booking_id?: string | null;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string; email: string; role: UserRole };
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface LogbookEntry {
  booking_id: string;
  learner_id: string;
  instructor_id: string;
  instructor_name: string | null;
  start_time: string;
  end_time: string;
  actual_hours: number;
  lesson_number: number;
  bonus_applied: boolean;
  credited_hours: number;
}
