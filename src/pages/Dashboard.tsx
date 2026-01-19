import { useEffect, useState } from 'react';
import { format, parseISO, isFuture } from 'date-fns';
import { Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import type { Booking, InstructorProfile } from '../types';

export const Dashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorCache, setInstructorCache] = useState<Record<string, InstructorProfile>>({});

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getBookings('current-user-id');
      // Sort by date: upcoming first
      const sorted = data.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      setBookings(sorted);

      // Fetch instructor details for unique instructors
      const instructorIds = [...new Set(data.map(b => b.instructor_id))];
      const profiles: Record<string, InstructorProfile> = {};
      for (const id of instructorIds) {
        if (!instructorCache[id]) {
          const profile = await bookingService.getInstructor(id);
          if (profile) profiles[id] = profile;
        }
      }
      setInstructorCache(prev => ({ ...prev, ...profiles }));
    } catch (error) {
      console.error("Failed to fetch bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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

  const StatusBadge = ({ status }: { status: Booking['status'] }) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const icon = {
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
          <p className="text-gray-500">Loading your lessons...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your driving lessons and schedule.</p>
        </div>
      </div>

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
                <a href="/search" className="btn-primary inline-flex items-center gap-2">
                  Book a Lesson
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map(booking => {
                  const instructor = instructorCache[booking.instructor_id];
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
                             Lesson with {instructor ? instructor.full_name : 'Instructor'}
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
                          <button className="btn-secondary py-1.5 px-4 text-sm">
                            Reschedule
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
                        <p className="text-sm text-gray-500">{booking.pickup_address}</p>
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