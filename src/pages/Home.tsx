import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Car, User } from 'lucide-react';

export const Home = () => {
  const [postcode, setPostcode] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (postcode.trim()) {
      navigate(`/search?postcode=${postcode}`);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-30"
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Driving lesson"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Learn to drive with confidence
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl">
            Book top-rated driving instructors in your area. Real-time availability, secure payments, and easy rescheduling.
          </p>
          
          <div className="mt-10 max-w-xl w-full">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 bg-white p-2 rounded-lg shadow-lg">
              <div className="flex-grow flex items-center px-4 bg-gray-50 rounded-md">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Enter suburb or postcode"
                  className="w-full py-3 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-500 outline-none"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-bold rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Search className="h-5 w-5" />
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Value Props */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Compare Instructors</h3>
              <p className="text-gray-600">View profiles, ratings, and vehicle details to find your perfect match.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Book Online</h3>
              <p className="text-gray-600">See real-time availability and book lessons instantly 24/7.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Management</h3>
              <p className="text-gray-600">Reschedule lessons up to 24 hours before directly from your dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
