import { Building2, Users, Search, MapPin, Home, MessageSquare, User, LogOut, Settings, ChevronDown, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchCities, fetchAreas } from '../../utils/api';
import LocationMapPicker from './LocationMapPicker';
import FloatingBidNowButton from './FloatingBidNowButton';
import FastBiddingModal from './FastBiddingModal';

export default function WebsiteNavbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);

  const propertyTypes = ['PG', 'Hostel', 'Flat', 'Villa', 'Shared Room', 'Private Room'];

  // STATIC MODE: cities and areas loaded from static data only
  // useEffect(() => {
  //   const loadCities = async () => {
  //     try {
  //       const citiesData = await fetchCities();
  //       if (Array.isArray(citiesData)) {
  //         setCities(citiesData);
  //       }
  //     } catch (error) {
  //       console.error('Error loading cities:', error);
  //       setCities(['Kota', 'Sikar', 'Indore']);
  //     }
  //   };
  //   loadCities();
  // }, []);

  // STATIC MODE: areas loaded from static data only
  // useEffect(() => {
  //   const loadAreas = async () => {
  //     if (selectedCity) {
  //       const selectedCityObj = cities.find(c => (typeof c === 'object' ? c.name : c) === selectedCity);
  //       const selectedCityId = selectedCityObj?._id || selectedCityObj?.id || '';
  // 
  //       try {
  //         const areasData = await fetchAreas();
  //         const filteredAreas = areasData.filter(a => {
  //           if (typeof a === 'string') return a.split('-')[0] === selectedCity;
  //           
  //           const cityName = (a.cityName || a.city?.name || '').toLowerCase().trim();
  //           const cityIdStr = (a.cityId || a.city?._id || a.city || '').toString();
  //           const selectedCityLower = selectedCity.toLowerCase().trim();
  // 
  //           return cityName === selectedCityLower || 
  //                  cityName.includes(selectedCityLower) || 
  //                  (selectedCityId && cityIdStr === selectedCityId);
  //         });
  //         setAreas(filteredAreas.map(a => typeof a === 'string' ? a : a.name));
  //       } catch (error) {
  //         console.error('Error loading areas:', error);
  //         setAreas([]);
  //       }
  //     }
  //   };
  //   loadAreas();
  // }, [selectedCity, cities]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCity) params.append('city', selectedCity);
    if (selectedArea) params.append('area', selectedArea);
    if (propertyType) params.append('type', propertyType);
    if (selectedLocation) {
      params.append('latitude', selectedLocation.latitude);
      params.append('longitude', selectedLocation.longitude);
    }
    navigate(`/website/ourproperty?${params.toString()}`);
    setShowSearch(false);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShowMapPicker(false);
    // Auto-populate city from location if possible
    console.log('Selected location:', location);
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    navigate('/website/index');
  };

  // Close dropdown when clicking outside
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
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12">
            <div className="flex items-center justify-between h-16 w-full">
              {/* Left: Logo */}
              <div className="flex-1 flex items-center justify-between md:justify-start h-full">
                <div className="flex items-center pr-6 md:border-r border-gray-200 h-full">
                  <Link to="/website/index" className="flex items-center space-x-2 group">
                    <img 
                      src="/website/images/logoroomhy_cropped.jpg" 
                      alt="Roohmy Logo" 
                      className="h-8 md:h-10 w-auto transition-transform group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/website/images/logoroomhy.jpg';
                      }}
                    />
                  </Link>
                </div>

                {/* Mobile Login / User Dropdown */}
                <div className="flex md:hidden items-center user-dropdown-mobile relative">
                  {isAuthenticated && user ? (
                    <>
                      <button
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm hover:bg-teal-700 transition-all active:scale-95 focus:outline-none"
                      >
                        {(user.name || user.firstName || 'U')[0]}
                      </button>

                      {showUserDropdown && (
                        <div className="absolute right-0 mt-2 top-full w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-[120] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                          {/* User info header inside dropdown */}
                          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                            <p className="text-xs font-bold text-slate-800 truncate">{user.name || user.firstName || 'User'}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user.email || user.loginId || ''}</p>
                          </div>
                          <button onClick={() => { setShowUserDropdown(false); navigate('/website/profile'); }} className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                            <User className="w-4 h-4 text-slate-400" /> Profile
                          </button>
                          <button onClick={() => { setShowUserDropdown(false); navigate('/website/mystays'); }} className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                            <Home className="w-4 h-4 text-slate-400" /> My Stays
                          </button>
                          <button onClick={() => { setShowUserDropdown(false); navigate('/website/chat'); }} className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                            <MessageSquare className="w-4 h-4 text-slate-400" /> Chat
                          </button>
                          <button onClick={() => { setShowUserDropdown(false); navigate('/website/reviews'); }} className="w-full px-4 py-2.5 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                            <Star className="w-4 h-4 text-slate-400" /> My Reviews
                          </button>
                          <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left text-xs text-red-650 hover:bg-red-50 flex items-center gap-3 border-t border-slate-50">
                            <LogOut className="w-4 h-4 text-red-500" /> Logout
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link to="/website/login" className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EE4266] text-white hover:bg-[#d63a5b] rounded-full text-xs font-bold transition-all shadow-md shadow-[#EE4266]/10 active:scale-[0.98]">
                      <User className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Center: Navigation Links */}
              <div className="hidden md:flex flex-none items-center justify-center space-x-5 text-sm font-semibold text-gray-700 px-6">
                <Link to="/website/index" className="hover:text-black transition-colors">Home</Link>
                <div className="w-px h-6 bg-gray-300"></div>
                <Link to="/website/ourproperty" className="hover:text-black transition-colors">Properties</Link>
                <div className="w-px h-6 bg-gray-300"></div>
                <Link to="/website/faq" className="hover:text-black transition-colors">FAQ</Link>
                <div className="w-px h-6 bg-gray-300"></div>
                <Link to="/website/about" className="hover:text-black transition-colors">About</Link>
                <div className="w-px h-6 bg-gray-300"></div>
                <Link to="/website/contact" className="hover:text-black transition-colors">Contact</Link>
              </div>

              {/* Right: Utilities */}
              <div className="hidden md:flex flex-1 justify-end items-center h-full text-sm font-semibold text-gray-700">
                {/* List Property */}
                <div className="flex items-center pl-6 border-l border-gray-200 h-full">
                  <Link to="/website/list" className="flex items-center space-x-2 hover:text-black transition-colors">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <span>List your property</span>
                  </Link>
                </div>

                {/* Bid Now */}
                <div className="flex items-center pl-6 ml-6 border-l border-gray-200 h-full">
                  <button 
                    onClick={() => setShowBidModal(true)}
                    className="flex items-center space-x-2 text-[#EE4266] hover:text-[#d63a5b] transition-colors font-bold"
                  >
                    <span>Bid Now</span>
                  </button>
                </div>

                {/* Login/User Dropdown */}
                <div className="flex items-center pl-6 ml-6 border-l border-gray-200 h-full">
                  {isAuthenticated && user ? (
                    <div
                      className="relative user-dropdown"
                    >
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center gap-2 hover:text-black transition-colors"
                    >
                      <User className="w-5 h-5 text-gray-600" />
                      <span>{user.name || user.firstName || 'User'}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                        <button onClick={() => { setShowUserDropdown(false); navigate('/website/profile'); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <User className="w-4 h-4 text-gray-500" /> Profile
                        </button>
                        <button onClick={() => { setShowUserDropdown(false); navigate('/website/mystays'); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <Home className="w-4 h-4 text-gray-500" /> My Stays
                        </button>
                        <button onClick={() => { setShowUserDropdown(false); navigate('/website/chat'); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-gray-500" /> Chat
                        </button>
                        <button onClick={() => { setShowUserDropdown(false); navigate('/website/reviews'); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                          <Star className="w-4 h-4 text-gray-500" /> My Reviews
                        </button>
                        <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-650 hover:bg-red-50 flex items-center gap-3">
                          <LogOut className="w-4 h-4 text-red-500" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                  ) : (
                    <Link to="/website/login" className="flex items-center space-x-2 hover:text-black transition-colors">
                      <User className="w-5 h-5 text-gray-600" />
                      <span>Login / Signup</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-gray-200 shadow-md">
          <div className="max-w-none w-full mx-auto px-4 md:px-8 lg:px-12 py-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-500" />
              Find Your Perfect Property
            </h3>
            
            {/* Selected Location Display */}
            {selectedLocation && (
              <div className="mb-4 p-3 bg-white border-2 border-teal-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">{selectedLocation.location}</p>
                  <p className="text-xs text-gray-500">
                    {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-sm text-red-500 hover:text-red-700 font-semibold"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* City Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedArea('');
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                >
                  <option value="">Select City</option>
                  {cities.map(city => {
                    const cityName = typeof city === 'object' ? city.name : city;
                    return <option key={cityName} value={cityName}>{cityName}</option>;
                  })}
                </select>
              </div>

              {/* Area Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Area</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  disabled={!selectedCity}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white disabled:bg-gray-100"
                >
                  <option value="">All Areas</option>
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                >
                  <option value="">All Types</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Map Button */}
              <div className="flex items-end">
                <button
                  onClick={() => setShowMapPicker(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Map
                </button>
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <LocationMapPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* Floating BidNow Button - Global */}
      <FloatingBidNowButton onOpenModal={() => setShowBidModal(true)} />

      {/* Bid Now Modal */}
      <FastBiddingModal 
        isOpen={showBidModal} 
        onClose={() => setShowBidModal(false)} 
      />
    </>
  );
}
