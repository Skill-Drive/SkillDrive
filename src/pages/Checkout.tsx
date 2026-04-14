import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Calendar, User, MapPin } from 'lucide-react';

export const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isCanceled = searchParams.get('canceled') === 'true';
  const amount = searchParams.get('amount') || '75';
  const instructorName = searchParams.get('instructor') || 'Instructor';
  const bookingDate = searchParams.get('date') || 'Not specified';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-main max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 font-medium group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Back to Profile
        </button>

        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-yellow-600" />
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
            {isCanceled ? 'Booking Canceled' : 'Payment Required'}
          </h1>
          
          <p className="text-gray-600 mb-10 text-lg">
            {isCanceled 
              ? "Your payment session was canceled. No charges were made, and your lesson has not been booked."
              : "Something went wrong with your booking request. Please try again from the instructor's profile."}
          </p>

          <div className="bg-gray-50 p-6 rounded-xl text-left border border-gray-100 mb-10">
            <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-widest text-center">Booking Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                <span className="flex items-center gap-2 text-gray-500 text-sm">
                  <User className="h-4 w-4" /> Instructor
                </span>
                <span className="font-bold text-gray-900">{instructorName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                <span className="flex items-center gap-2 text-gray-500 text-sm">
                  <Calendar className="h-4 w-4" /> Date & Time
                </span>
                <span className="font-bold text-gray-900">{bookingDate}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200/50">
                <span className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin className="h-4 w-4" /> Duration
                </span>
                <span className="font-bold text-gray-900">1 hour</span>
              </div>
              <div className="flex items-center justify-between py-2 pt-4">
                <span className="text-gray-900 font-black">Total Price</span>
                <span className="text-2xl font-black text-primary">${amount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-grow btn-primary py-4 text-lg"
            >
              Try Booking Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-grow bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl transition-all border border-gray-200"
            >
              Return Home
            </button>
          </div>
        </div>
        
        <p className="text-center text-gray-400 text-sm mt-8">
          Having trouble? <a href="mailto:support@skilldrive.com.au" className="text-primary hover:underline font-bold">Contact our support team</a>
        </p>
      </div>
    </div>
  );
};
