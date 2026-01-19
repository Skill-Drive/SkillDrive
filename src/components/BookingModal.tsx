import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, MapPin, Loader2 } from 'lucide-react';
import type { InstructorProfile } from '../types';
import { bookingService } from '../services/bookingService';

interface BookingModalProps {
  instructor: InstructorProfile;
  slot: Date;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal = ({ instructor, slot, onClose, onSuccess }: BookingModalProps) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await bookingService.createBooking({
        instructor_id: instructor.id,
        learner_id: 'current-user-id', // Mock user ID
        start_time: slot.toISOString(),
        end_time: new Date(slot.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        pickup_address: address,
        price: instructor.hourly_rate
      });
      onSuccess();
      alert('Booking Confirmed! You would now be redirected to payment.');
    } catch (err: any) {
      setError(err.message || 'Failed to book slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900">Complete Booking</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleBooking} className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100">
               <img src={instructor.vehicle.image_url} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{instructor.full_name}</p>
              <p className="text-sm text-gray-500">{instructor.vehicle.model}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
               <div>
                 <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Date & Time</p>
                 <p className="font-medium text-blue-900">{format(slot, 'EEEE, MMM do')}</p>
                 <p className="text-lg font-bold text-primary">{format(slot, 'h:mm a')}</p>
               </div>
               <div className="text-right">
                 <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Price</p>
                 <p className="text-2xl font-bold text-gray-900">${instructor.hourly_rate}</p>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter your pickup address"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">We'll verify this is within the instructor's zone.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 btn-primary py-3.5 flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Processing...
              </>
            ) : (
              'Confirm & Pay'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};