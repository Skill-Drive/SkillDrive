import { Star, Shield, Car, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Instructor {
  id: string;
  name: string;
  location: string;
  vehicle: string;
  transmission: 'Auto' | 'Manual';
  rating: number;
  reviews: number;
  price: number;
  image: string;
  nextAvailable: string;
  suburbs_covered?: string[];
}

interface InstructorCardProps {
  instructor: Instructor;
}

export const InstructorCard = ({ instructor }: InstructorCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row">
      {/* Image Section */}
      <div className="md:w-64 h-48 md:h-auto relative bg-gray-100 flex-shrink-0">
        <img
          src={instructor.image}
          alt={instructor.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm uppercase tracking-wide">
          {instructor.transmission}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{instructor.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Shield className="h-3 w-3 text-green-600" />
                Verified Instructor • {instructor.location}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                <Star className="h-4 w-4 text-secondary fill-secondary" />
                <span className="font-bold text-gray-900">{instructor.rating}</span>
                <span className="text-xs text-gray-500">({instructor.reviews})</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <Car className="h-4 w-4 text-primary" />
              {instructor.vehicle}
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <Clock className="h-4 w-4 text-primary" />
              Next: {instructor.nextAvailable}
            </div>
          </div>

          {/* Suburbs Covered */}
          {instructor.suburbs_covered && instructor.suburbs_covered.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Service Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {instructor.suburbs_covered.slice(0, 4).map((suburb, index) => (
                  <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {suburb}
                  </span>
                ))}
                {instructor.suburbs_covered.length > 4 && (
                  <Link
                    to={`/instructor/${instructor.id}`}
                    className="text-xs text-primary font-bold hover:underline py-0.5"
                  >
                    + {instructor.suburbs_covered.length - 4} more
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-gray-900">${instructor.price}</span>
            <span className="text-gray-500 text-sm">/hr</span>
          </div>
          <Link
            to={`/instructor/${instructor.id}`}
            className="btn-primary py-2 px-6 text-sm"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};