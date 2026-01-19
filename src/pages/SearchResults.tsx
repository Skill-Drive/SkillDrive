import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown } from 'lucide-react';
import { InstructorCard, type Instructor } from '../components/InstructorCard';

// Mock Data
const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: '1',
    name: 'Sarah Wilson',
    location: 'Surry Hills, NSW',
    vehicle: '2023 Toyota Corolla (5 Star Safety)',
    transmission: 'Auto',
    rating: 4.9,
    reviews: 124,
    price: 75,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    nextAvailable: 'Tomorrow, 10:00 AM'
  },
  {
    id: '2',
    name: 'David Chen',
    location: 'Redfern, NSW',
    vehicle: '2022 Mazda 3',
    transmission: 'Manual',
    rating: 5.0,
    reviews: 89,
    price: 85,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    nextAvailable: 'Wed, 2:00 PM'
  },
  {
    id: '3',
    name: 'Michael Brown',
    location: 'Waterloo, NSW',
    vehicle: '2021 Hyundai i30',
    transmission: 'Auto',
    rating: 4.8,
    reviews: 215,
    price: 70,
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80',
    nextAvailable: 'Today, 4:00 PM'
  }
];

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const postcode = searchParams.get('postcode') || 'Unknown Location';
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-20 z-40">
        <div className="container-main py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Driving Instructors near {postcode}</h1>
            <p className="text-sm text-gray-500">{MOCK_INSTRUCTORS.length} instructors available</p>
          </div>
          
          <button 
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md font-medium text-gray-700"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      <div className="container-main pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Filters Sidebar */}
          <div className={`lg:w-64 flex-shrink-0 ${filterOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-8 sticky top-36">
              
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Transmission</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" defaultChecked />
                    <span className="text-gray-700">Automatic</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" defaultChecked />
                    <span className="text-gray-700">Manual</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Price Range</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span>$50</span>
                  <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <span>$120</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Gender</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                    <span className="text-gray-700">Male</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                    <span className="text-gray-700">Female</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Availability</h3>
                <button className="w-full text-left flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-200 text-sm text-gray-700">
                  <span>Any time</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>

          {/* Results Grid */}
          <div className="flex-grow space-y-4">
            {MOCK_INSTRUCTORS.map(instructor => (
              <InstructorCard key={instructor.id} instructor={instructor} />
            ))}
            
            <div className="mt-8 text-center">
              <button className="text-primary font-bold hover:underline">Show more instructors</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};