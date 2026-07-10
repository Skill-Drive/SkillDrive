import { useEffect, useState } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { Loader2, X } from 'lucide-react';
import { bookingService } from '../services/bookingService';
import { platformService } from '../services/platformService';
import type { Booking } from '../types';

interface RescheduleModalProps {
  booking: Booking;
  onClose: () => void;
  onRescheduled: () => void;
}

export const RescheduleModal = ({ booking, onClose, onRescheduled }: RescheduleModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(addDays(new Date(), 2)));
  const [slots, setSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    bookingService
      .getAvailableSlots(booking.instructor_id, selectedDate)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [booking.instructor_id, selectedDate]);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setSaving(true);
    setError('');
    try {
      await platformService.rescheduleBooking(booking.id, selectedSlot.toISOString());
      onRescheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule');
    } finally {
      setSaving(false);
    }
  };

  const dayOptions = Array.from({ length: 14 }, (_, i) => startOfDay(addDays(new Date(), i + 2)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900">Reschedule lesson</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-500">
            Current time: <strong>{format(new Date(booking.start_time), "EEE d MMM, h:mm a")}</strong>.
            Free rescheduling up to 24 hours before the lesson.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New date</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dayOptions.map((d) => (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className={`px-3 py-2 rounded-xl border text-sm whitespace-nowrap ${
                    d.getTime() === selectedDate.getTime()
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {format(d, 'EEE d MMM')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available times</label>
            {loadingSlots ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-400">No open slots this day — try another date.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.toISOString()}
                    onClick={() => setSelectedSlot(s)}
                    className={`py-2 rounded-lg border text-sm ${
                      selectedSlot?.getTime() === s.getTime()
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {format(s, 'h:mm a')}
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot || saving}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm new time
          </button>
        </div>
      </div>
    </div>
  );
};
