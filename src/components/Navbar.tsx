import { Link, useNavigate } from 'react-router-dom';
import { Menu, Car, UserCircle, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await signOut();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container-main">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="bg-primary p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="font-extrabold text-2xl text-gray-900 tracking-tight">
                Skill<span className="text-primary">Drive</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/search" className="text-gray-600 hover:text-primary font-medium text-sm">
              Find an Instructor
            </Link>
            <Link to="/teach" className="text-gray-600 hover:text-primary font-medium text-sm">
              Become an Instructor
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-primary font-medium text-sm">
                  <UserCircle className="h-5 w-5" />
                  My Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-primary font-medium text-sm">
                  <UserCircle className="h-5 w-5" />
                  Log In
                </Link>
                <Link to="/signup" className="btn-secondary py-2 px-4 text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/search" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Find an Instructor
            </Link>
            <Link to="/teach" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Become an Instructor
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left block px-3 py-2 mt-4 font-bold bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Log In
                </Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 mt-4 text-center font-bold bg-secondary text-secondary-foreground rounded-md">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};