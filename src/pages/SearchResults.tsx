import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, Loader2 } from 'lucide-react';
import { InstructorCard, type Instructor } from '../components/InstructorCard';
import { bookingService } from '../services/bookingService';

export const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const postcode = searchParams.get('postcode') || 'Unknown Location';
  const [filterOpen, setFilterOpen] = useState(false);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filters, setFilters] = useState({
    transmission: ['Auto', 'Manual'],
    maxPrice: 150
  });

  useEffect(() => {
    const fetchInstructors = async () => {
      setLoading(true);
      try {
        const data = await bookingService.searchInstructors(filters);
        setInstructors(data);
      } catch (error) {
        console.error("Failed to search instructors", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, [filters]);

  const toggleTransmission = (type: string) => {
    setFilters(prev => {
      const trans = [...prev.transmission];
      if (trans.includes(type)) {
        return { ...prev, transmission: trans.filter(t => t !== type) };
      } else {
        trans.push(type);
        return { ...prev, transmission: trans };
      }
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-20 z-40">
        <div className="container-main py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Driving Instructors near {postcode}</h1>
            <p className="text-sm text-gray-500">{loading ? 'Searching...' : `${instructors.length} instructors available`}</p>
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
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      checked={filters.transmission.includes('Auto')}
                      onChange={() => toggleTransmission('Auto')}
                    />
                    <span className="text-gray-700">Automatic</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      checked={filters.transmission.includes('Manual')}
                      onChange={() => toggleTransmission('Manual')}
                    />
                    <span className="text-gray-700">Manual</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Max Price Range</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span>$50</span>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                  />
                  <span>${filters.maxPrice}</span>
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-gray-500">Finding the best instructors for you...</p>
              </div>
            ) : instructors.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">No instructors found</h3>
                <p className="text-gray-500">We couldn't find any instructors matching your filters in this area.</p>
                <button
                  onClick={() => setFilters({ transmission: ['Auto', 'Manual'], maxPrice: 150 })}
                  className="mt-6 text-primary font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                {instructors.map(instructor => (
                  <InstructorCard key={instructor.id} instructor={instructor} />
                ))}
                <div className="mt-8 text-center">
                  <button className="text-primary font-bold hover:underline">Show more instructors</button>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};