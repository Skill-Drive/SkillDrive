import { supabase } from './supabase';
import type {
  AuditLog,
  AvailabilitySlot,
  InstructorPackage,
  LessonTelemetry,
  LogbookEntry,
  SupportTicket,
  TelemetryPoint,
  TicketCategory,
  TicketStatus,
} from '../types';
import { routeDistanceKm, maxSpeedKmh } from '../lib/geo';

export const platformService = {
  // ---------- Booking lifecycle ----------
  rescheduleBooking: async (bookingId: string, newStartTime: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('reschedule-booking', {
      body: { bookingId, newStartTime },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  },

  completeLesson: async (bookingId: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('complete-lesson', {
      body: { bookingId },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  },

  sendWelcomeEmail: async (): Promise<void> => {
    // Fire-and-forget: signup must never fail because of email delivery.
    try {
      await supabase.functions.invoke('send-welcome-email');
    } catch (err) {
      console.warn('Welcome email failed', err);
    }
  },

  // ---------- Availability ----------
  getAvailability: async (instructorId: string): Promise<AvailabilitySlot[]> => {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('day_of_week')
      .order('start_time');
    if (error) throw error;
    return data ?? [];
  },

  saveAvailability: async (instructorId: string, slots: AvailabilitySlot[]): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('availability_slots')
      .delete()
      .eq('instructor_id', instructorId);
    if (deleteError) throw deleteError;
    if (slots.length === 0) return;
    const { error } = await supabase.from('availability_slots').insert(
      slots.map((s) => ({
        instructor_id: instructorId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active ?? true,
      })),
    );
    if (error) throw error;
  },

  // ---------- Packages ----------
  getPackages: async (instructorId: string): Promise<InstructorPackage[]> => {
    const { data, error } = await supabase
      .from('instructor_packages')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at');
    if (error) throw error;
    return data ?? [];
  },

  savePackage: async (pkg: Partial<InstructorPackage> & { instructor_id: string }): Promise<void> => {
    const { error } = pkg.id
      ? await supabase.from('instructor_packages').update(pkg).eq('id', pkg.id)
      : await supabase.from('instructor_packages').insert(pkg);
    if (error) throw error;
  },

  deletePackage: async (packageId: string): Promise<void> => {
    const { error } = await supabase.from('instructor_packages').delete().eq('id', packageId);
    if (error) throw error;
  },

  // ---------- Logbook ----------
  getLogbook: async (learnerId: string): Promise<LogbookEntry[]> => {
    const { data, error } = await supabase
      .from('learner_logbook')
      .select('*')
      .eq('learner_id', learnerId)
      .order('lesson_number');
    if (error) throw error;
    return data ?? [];
  },

  // ---------- Support tickets ----------
  createTicket: async (ticket: {
    category: TicketCategory;
    subject: string;
    message: string;
    booking_id?: string | null;
  }): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be signed in');
    const { error } = await supabase
      .from('support_tickets')
      .insert({ ...ticket, user_id: user.id });
    if (error) throw error;
  },

  getMyTickets: async (): Promise<SupportTicket[]> => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  getAllTickets: async (): Promise<SupportTicket[]> => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, profiles:user_id(full_name, email, role)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  updateTicket: async (
    ticketId: string,
    updates: { status?: TicketStatus; admin_notes?: string },
  ): Promise<void> => {
    const { error } = await supabase.from('support_tickets').update(updates).eq('id', ticketId);
    if (error) throw error;
  },

  // ---------- Audit logs ----------
  getAuditLogs: async (limit = 100): Promise<AuditLog[]> => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  // ---------- Telemetry ----------
  startTelemetry: async (bookingId: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be signed in');
    const { data, error } = await supabase
      .from('lesson_telemetry')
      .insert({ booking_id: bookingId, recorded_by: user.id })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  },

  appendTelemetryPoints: async (telemetryId: string, points: TelemetryPoint[]): Promise<void> => {
    const { error } = await supabase
      .from('lesson_telemetry')
      .update({ points })
      .eq('id', telemetryId);
    if (error) throw error;
  },

  finishTelemetry: async (telemetryId: string, points: TelemetryPoint[]): Promise<void> => {
    const { error } = await supabase
      .from('lesson_telemetry')
      .update({
        points,
        status: 'completed',
        ended_at: new Date().toISOString(),
        distance_km: routeDistanceKm(points),
        max_speed_kmh: maxSpeedKmh(points),
      })
      .eq('id', telemetryId);
    if (error) throw error;
  },

  getTelemetryForBooking: async (bookingId: string): Promise<LessonTelemetry[]> => {
    const { data, error } = await supabase
      .from('lesson_telemetry')
      .select('*')
      .eq('booking_id', bookingId)
      .order('started_at');
    if (error) throw error;
    return data ?? [];
  },
};
