import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, MapPin, Star, Shield, CheckCircle } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { bookingService } from '../services/bookingService';
import type { InstructorProfile as IInstructorProfile } from '../types';
import { BookingModal } from '../components/BookingModal';
import 'react-day-picker/dist/style.css';

export const InstructorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [instructor, setInstructor] = useState<IInstructorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        const data = await bookingService.getInstructor(id);
        setInstructor(data);
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    const loadSlots = async () => {
      if (id && selectedDate) {
        const slots = await bookingService.getAvailableSlots(id, selectedDate);
        setAvailableSlots(slots);
      }
    };
    loadSlots();
  }, [id, selectedDate]);

  if (loading || !instructor) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-main py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
              <img src={instructor.vehicle.image_url} alt={instructor.full_name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-gray-900">{instructor.full_name}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-secondary fill-secondary" />
                  <span className="font-bold text-gray-900">{instructor.rating}</span> 
                  ({instructor.review_count} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-5 w-5 text-green-600" />
                  Verified Instructor
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  {instructor.suburbs_covered[0]} + {instructor.suburbs_covered.length - 1} more
                </span>
              </div>
              <p className="mt-4 text-gray-600 max-w-2xl">{instructor.bio}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-center min-w-[150px]">
              <p className="text-gray-500 text-sm font-medium">Hourly Rate</p>
              <p className="text-3xl font-bold text-primary">${instructor.hourly_rate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-main mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg"><CheckCircle className="h-5 w-5 text-primary" /></div>
                Vehicle Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-medium text-gray-900">{instructor.vehicle.model} ({instructor.vehicle.year})</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Transmission</p>
                  <p className="font-medium text-gray-900">{instructor.vehicle.transmission}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Service Areas</h2>
              <div className="flex flex-wrap gap-2">
                {instructor.suburbs_covered.map(suburb => (
                  <span key={suburb} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {suburb}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Booking Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 sticky top-24">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Select a Time
              </h2>
              
              <div className="flex justify-center mb-4">
                 <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={{ before: new Date() }}
                    modifiersClassNames={{
                      selected: 'bg-primary text-white font-bold rounded-full',
                      today: 'text-primary font-bold'
                    }}
                    footer={
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-2 font-medium">Available Slots for {selectedDate ? format(selectedDate, 'MMM do') : '...'}</p>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                          {availableSlots.length > 0 ? (
                            availableSlots.map(slot => (
                              <button
                                key={slot.toISOString()}
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setIsModalOpen(true);
                                }}
                                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-primary hover:text-white transition-colors text-center font-medium"
                              >
                                {format(slot, 'h:mm a')}
                              </button>
                            ))
                          ) : (
                            <p className="col-span-2 text-center text-gray-400 text-sm py-2">No slots available</p>
                          )}
                        </div>
                      </div>
                    }
                  />
              </div>
            </div>
          </div>

        </div>
      </div>

      {isModalOpen && selectedSlot && (
        <BookingModal
          instructor={instructor}
          slot={selectedSlot}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
             setIsModalOpen(false);
             // Refresh slots
             if (selectedDate) {
               bookingService.getAvailableSlots(instructor.id, selectedDate).then(setAvailableSlots);
             }
          }}
        />
      )}
    </div>
  );
};