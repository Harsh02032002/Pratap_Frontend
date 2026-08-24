import { Building2, Users, Search, MapPin, Home, MessageSquare, User, LogOut, Settings, ChevronDown, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LocationMapPicker from './LocationMapPicker';
import FloatingBidNowButton from './FloatingBidNowButton';
import FastBiddingModal from './FastBiddingModal';

export default function WebsiteNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname || '';
  const { user, logout, isAuthenticated } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);

  const cities = ['Kota', 'Sikar', 'Indore', 'Jaipur', 'Delhi', 'Bhopal'];
  const propertyTypes = ['PG', 'Hostel', 'Co-living', 'Apartment'];

  const handleSearch = () => {
    if (selectedCity && selectedArea) {
      navigate(`/properties-in-${selectedArea.toLowerCase().replace(/\s+/g, '-')}-${selectedCity.toLowerCase().replace(/\s+/g, '-')}`);
    } else if (selectedCity) {
      navigate(`/properties-in-${selectedCity.toLowerCase().replace(/\s+/g, '-')}`);
    } else {
      navigate('/properties');
    }
    setShowSearch(false);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShowMapPicker(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown') && !event.target.closest('.user-dropdown-mobile')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  return (
    <>
      <div className="sticky top-0 z-50 flex flex-col">
        {/* Top Row: Main Navbar */}
        <nav className="bg-white border-b border-gray-100 shadow-sm">
          <div className="w-full px-3 sm:px-4 md:px-6">
            <div className="flex items-center justify-between h-16 w-full">
              {/* Left: Logo */}
              <div className="flex-1 flex items-center justify-start">
                <Link to="/" className="flex items-center space-x-2 group">
                  <img 
                    src="/website/roomhy_logo.jpeg" 
                    alt="Roomhy Logo" 
                    className="h-9 md:h-11 max-h-11 w-auto object-contain transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/website/roomhy_logo.jpeg';
                    }}
                  />
                </Link>
              </div>

              {/* Center: Navigation Links */}
              <div className="hidden md:flex flex-1 items-center justify-center space-x-6 text-sm font-semibold text-gray-700">
                <Link to="/" className="hover:text-teal-600 transition-colors">Home</Link>
                <div className="w-px h-5 bg-gray-200"></div>
                <Link to="/properties" className="hover:text-teal-600 transition-colors">Properties</Link>
                <div className="w-px h-5 bg-gray-200"></div>
                <Link to="/faq" className="hover:text-teal-600 transition-colors">FAQ</Link>
                <div className="w-px h-5 bg-gray-200"></div>
                <Link to="/about-us" className="hover:text-teal-600 transition-colors">About</Link>
                <div className="w-px h-5 bg-gray-200"></div>
                <Link to="/contact-us" className="hover:text-teal-600 transition-colors">Contact</Link>
              </div>

              {/* Right: Utilities */}
              <div className="hidden md:flex flex-1 items-center justify-end space-x-4 text-sm font-semibold text-gray-700">
                <Link to="/list-property" className="flex items-center space-x-1.5 hover:text-teal-600 transition-colors px-3 py-1.5 border border-gray-200 rounded-lg hover:border-teal-500">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>List your property</span>
                </Link>

                <button 
                  onClick={() => setShowBidModal(true)}
                  className="flex items-center space-x-1.5 text-[#EE4266] hover:text-[#d63a5b] transition-colors font-bold px-3 py-1.5 rounded-lg border border-[#EE4266]/20 bg-[#EE4266]/5"
                >
                  <span>Bid Now</span>
                </button>

                <div className="flex items-center pl-2 border-l border-gray-200">
                  {isAuthenticated && user ? (
                    <div className="relative user-dropdown">
                      <button
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className="flex items-center gap-2 hover:text-teal-600 transition-colors"
                      >
                        <User className="w-5 h-5 text-gray-600" />
                        <span>{user.name || user.firstName || 'User'}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showUserDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                          <button onClick={() => { setShowUserDropdown(false); navigate('/website/profile'); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-500" /> Profile
                          </button>
                          <button onClick={() => { setShowUserDropdown(false); navigate('/website/mystays'); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                            <Home className="w-4 h-4 text-gray-500" /> My Stays
                          </button>
                          <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-650 hover:bg-red-50 flex items-center gap-3 border-t border-gray-100">
                            <LogOut className="w-4 h-4 text-red-500" /> Logout
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to="/login" className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm">
                      <User className="w-4 h-4" />
                      <span>Login / Signup</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile Right Menu */}
              <div className="flex md:hidden items-center space-x-3">
                <Link to="/login" className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <LocationMapPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* Floating BidNow Button */}
      <FloatingBidNowButton onOpenModal={() => setShowBidModal(true)} />

      {/* Bid Now Modal */}
      <FastBiddingModal 
        isOpen={showBidModal} 
        onClose={() => setShowBidModal(false)} 
      />
    </>
  );
}
