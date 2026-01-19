import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Calendar, ShieldCheck, ChevronRight } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-primary pt-16 pb-32 overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10">
           <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
           </svg>
        </div>

        <div className="container-main relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Find the perfect <br/> driving instructor
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Compare and book local driving instructors online. Real-time availability, secure payments, and instant confirmations.
          </p>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="bg-white p-2 rounded-xl shadow-2xl flex flex-col md:flex-row gap-2">
              <div className="flex-grow flex items-center px-4 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <MapPin className="h-6 w-6 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Enter suburb or postcode (e.g. 2000)"
                  className="w-full py-4 bg-transparent outline-none text-lg text-gray-900 placeholder-gray-500"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-secondary md:w-auto w-full text-lg px-8 flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" />
                Compare Now
              </button>
            </form>
            <p className="text-blue-200 mt-4 text-sm font-medium">
              Over 500+ Instructors • 50,000+ Bookings • 4.9/5 Average Rating
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-20 bg-white">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">The easiest way to get your license</h2>
            <p className="mt-4 text-lg text-gray-600">Book your first lesson in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10 transform scale-x-75"></div>

            <StepCard 
              icon={<Search className="h-8 w-8 text-primary" />}
              title="1. Search & Compare"
              description="Enter your postcode to see instructors in your area. Filter by transmission, price, and rating."
            />
            <StepCard 
              icon={<Calendar className="h-8 w-8 text-primary" />}
              title="2. Book Online"
              description="View real-time availability and book a time that works for you. No more phone tag."
            />
            <StepCard 
              icon={<ShieldCheck className="h-8 w-8 text-primary" />}
              title="3. Learn to Drive"
              description="Manage your bookings online. Reschedule easily up to 24 hours before your lesson."
            />
          </div>
        </div>
      </div>

      {/* Featured Benefits */}
      <div className="bg-gray-50 py-20 border-t border-gray-200">
        <div className="container-main">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why learners choose Skill Drive</h2>
              <ul className="space-y-6">
                <BenefitItem text="Real-time availability calendar" />
                <BenefitItem text="Change instructors anytime" />
                <BenefitItem text="Secure online payments" />
                <BenefitItem text="Track your progress online" />
              </ul>
              <div className="mt-8">
                <button 
                  onClick={() => navigate('/search')}
                  className="btn-primary flex items-center gap-2"
                >
                  Find an Instructor <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-2xl transform rotate-3 opacity-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                alt="Happy learner driver" 
                className="rounded-2xl shadow-xl relative z-10 w-full object-cover h-80 md:h-96"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg z-20 flex items-center gap-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <Star className="h-6 w-6 text-green-600 fill-current" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">4.9/5 Rating</p>
                  <p className="text-sm text-gray-500">Based on verified reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const BenefitItem = ({ text }: { text: string }) => (
  <li className="flex items-center gap-3">
    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <span className="text-lg text-gray-700 font-medium">{text}</span>
  </li>
);