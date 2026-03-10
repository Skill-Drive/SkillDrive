import React, { useEffect, useState } from 'react';
import { format, parseISO, isFuture } from 'date-fns';
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { Booking } from '../types';

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await bookingService.getBookings(user.id);
      // Sort by date: upcoming first
      const sorted = data.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      setBookings(sorted);
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this lesson?')) {
      try {
        await bookingService.cancelBooking(bookingId);
        // Refresh list
        fetchBookings();
      } catch (error) {
        alert('Failed to cancel booking');
      }
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const icon: Record<string, React.JSX.Element> = {
      pending: <Clock className="w-3 h-3" />,
      confirmed: <CheckCircle className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />,
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${styles[status]}`}>
        {icon[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && isFuture(parseISO(b.start_time)));
  const pastBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'completed' || !isFuture(parseISO(b.start_time)));

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container-main py-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {profile?.role === 'instructor' ? 'Instructor Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-gray-500 mt-1">
            {profile?.role === 'instructor' ? 'Manage your upcoming student lessons.' : 'Manage your driving lessons and schedule.'}
          </p>
        </div>
      </div>

      {profile?.role === 'instructor' && !profile?.instructor_profiles?.stripe_onboarding_complete && (
        <div className="container-main mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-blue-900">Set up Payments to Receive Bookings</h3>
              <p className="text-sm text-blue-700 mt-1">You need to complete your Stripe Connect Express onboarding to receive payouts for lessons.</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('create-connect-account');
                  if (error) throw error;
                  if (data?.url) window.location.href = data.url;
                } catch (err: any) {
                  alert(err.message || 'Failed to initialize Stripe Onboarding');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm whitespace-nowrap shadow-sm"
            >
              Set up Payments
            </button>
          </div>
        </div>
      )}

      <div className="container-main mt-8">
        <div className="grid gap-8">

          {/* Upcoming Lessons */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Lessons
            </h2>

            {upcomingBookings.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">You have no upcoming lessons scheduled.</p>
                {profile?.role !== 'instructor' && (
                  <a href="/search" className="btn-primary inline-flex items-center gap-2">
                    Book a Lesson
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map(booking => {
                  const otherPartyName = booking.other_party?.full_name || 'Unknown User';
                  // Use the helper flag from the Edge Function
                  const isLearner = booking.user_is_learner;
                  const title = isLearner ? `Lesson with ${otherPartyName}` : `Student: ${otherPartyName}`;

                  return (
                    <div key={booking.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                      {/* Date Box */}
                      <div className="bg-blue-50 p-4 rounded-lg text-center min-w-[100px] flex flex-col justify-center">
                        <span className="text-sm font-bold text-blue-600 uppercase">{format(parseISO(booking.start_time), 'MMM')}</span>
                        <span className="text-3xl font-bold text-gray-900">{format(parseISO(booking.start_time), 'd')}</span>
                        <span className="text-sm text-gray-500">{format(parseISO(booking.start_time), 'EEE')}</span>
                      </div>

                      {/* Details */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {title}
                          </h3>
                          <StatusBadge status={booking.status} />
                        </div>

                        <div className="space-y-2 text-gray-600">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {format(parseISO(booking.start_time), 'h:mm a')} - {format(parseISO(booking.end_time), 'h:mm a')}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {booking.pickup_address}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-3">
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Cancel Lesson
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Past/Cancelled Lessons */}
          {pastBookings.length > 0 && (
            <section className="opacity-75">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                Past & Cancelled
              </h2>
              <div className="space-y-4">
                {pastBookings.map(booking => (
                  <div key={booking.id} className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-500 font-medium text-sm">
                        {format(parseISO(booking.start_time), 'MMM d, yyyy')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Driving Lesson</p>
                        <p className="text-sm text-gray-500">{booking.pickup_address} • {booking.other_party?.full_name}</p>
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};