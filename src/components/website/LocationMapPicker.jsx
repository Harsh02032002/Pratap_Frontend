import { useState, useEffect } from 'react';
import { MapPin, X, Navigation, Search, Building2 } from 'lucide-react';

// Popular colleges and institutes
const POPULAR_COLLEGES = [
  // Kota
  { name: 'Allen Institute, Kota', city: 'Kota', lat: 25.1972, lng: 75.8245, type: 'Coaching' },
  { name: 'FIITJEE Kota', city: 'Kota', lat: 25.2150, lng: 75.8350, type: 'Coaching' },
  { name: 'Bansal Classes, Kota', city: 'Kota', lat: 25.1950, lng: 75.8200, type: 'Coaching' },
  { name: 'Resonance Kota', city: 'Kota', lat: 25.2100, lng: 75.8400, type: 'Coaching' },
  
  // Sikar
  { name: 'Sikar Coaching Hub', city: 'Sikar', lat: 27.6106, lng: 75.1393, type: 'Coaching' },
  { name: 'Sikar Study Center', city: 'Sikar', lat: 27.6150, lng: 75.1450, type: 'Coaching' },
  
  // Indore
  { name: 'IIT Indore', city: 'Indore', lat: 22.5181, lng: 75.8945, type: 'IIT' },
  { name: 'Devi Ahilya University', city: 'Indore', lat: 22.7196, lng: 75.8577, type: 'University' },
  { name: 'MITS Indore', city: 'Indore', lat: 22.7147, lng: 75.8676, type: 'Engineering' },
];

export default function LocationMapPicker({ onLocationSelect, onClose }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [latitude, setLatitude] = useState(25.2048); // Kota default
  const [longitude, setLongitude] = useState(75.8615);
  const [selectedLocation, setSelectedLocation] = useState('Kota, Rajasthan');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // Initialize map
  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => {
      initializeMap();
      setMapLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const initializeMap = () => {
    const L = window.L;
    if (!L) return;

    const mapInstance = L.map('map').setView([latitude, longitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapInstance);

    const markerInstance = L.marker([latitude, longitude], {
      draggable: true
    }).addTo(mapInstance)
      .bindPopup('Your Location')
      .openPopup();

    markerInstance.on('dragend', () => {
      const pos = markerInstance.getLatLng();
      setLatitude(pos.lat);
      setLongitude(pos.lng);
      updateLocationName(pos.lat, pos.lng);
    });

    mapInstance.on('click', (e) => {
      markerInstance.setLatLng(e.latlng);
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
      updateLocationName(e.latlng.lat, e.latlng.lng);
    });

    setMap(mapInstance);
    setMarker(markerInstance);
  };

  const updateLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const address = data.address;
      
      let location = '';
      if (address.city) location += address.city;
      if (address.state) location += ', ' + address.state;
      if (location) setSelectedLocation(location);
    } catch (error) {
      console.error('Error getting location name:', error);
    }
  };

  // Live search as user types (like Google)
  const handleLiveSearch = async (query) => {
    setSearchQuery(query);

    // Show instant college suggestions when empty
    if (!query.trim()) {
      setSearchResults(POPULAR_COLLEGES.slice(0, 8));
      return;
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Search OpenStreetMap directly (primary search - like Google)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`
      );
      const results = await response.json();
      
      // First add colleges from our list that match
      const collegeMatches = POPULAR_COLLEGES.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.city.toLowerCase().includes(query.toLowerCase())
      );

      // Then add OpenStreetMap results
      const osmResults = results.map((r) => ({
        name: r.display_name.split(',')[0] || r.display_name,
        fullName: r.display_name,
        city: r.address?.city || r.address?.state || r.address?.country || 'India',
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        type: r.type === 'university' || r.type === 'school' ? 'College' : 'Location',
        _original: r
      }));

      // Combine: colleges first, then OSM results
      const combined = [...collegeMatches, ...osmResults];
      
      // Remove duplicates based on name similarity
      const unique = [];
      const seen = new Set();
      combined.forEach(item => {
        const key = item.name.toLowerCase();
        if (!seen.has(key)) {
          unique.push(item);
          seen.add(key);
        }
      });

      setSearchResults(unique.slice(0, 10)); // Show top 10 results
    } catch (error) {
      console.error('Error searching:', error);
      // Show college suggestions on error
      setSearchResults(POPULAR_COLLEGES.slice(0, 8));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !map) return;

    // First check if it's a college/institute in our list
    const collegeMatch = POPULAR_COLLEGES.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (collegeMatch.length > 0) {
      // Show colleges suggestions
      setSearchResults(collegeMatch);
      return;
    }

    try {
      // If not in list, search using OpenStreetMap (works for any college/place)
      console.log('Searching OpenStreetMap for:', searchQuery);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const results = await response.json();
      
      if (results.length > 0) {
        // Create custom result objects for display
        const customResults = results.map((r, idx) => ({
          name: r.display_name.split(',')[0] || r.display_name,
          city: r.address?.city || r.address?.state || 'India',
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          type: 'Location',
          _original: r
        }));
        
        setSearchResults(customResults);
      } else {
        alert('Location not found. Try searching for city name or exact college name.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error searching. Please try another search.');
    }
  };

  const handleCollegeSelect = (location) => {
    if (!map || !marker) return;

    setLatitude(location.lat);
    setLongitude(location.lng);
    setSelectedLocation(location.name);
    
    // Move map and marker
    map.setView([location.lat, location.lng], 14);
    marker.setLatLng([location.lat, location.lng]);
    marker.setPopupContent(location.name).openPopup();
    
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          if (map && marker) {
            map.setView([lat, lng], 12);
            marker.setLatLng([lat, lng]);
          }
          updateLocationName(lat, lng);
        },
        (error) => {
          alert('Unable to get your location. Please enable location services.');
        }
      );
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      latitude,
      longitude,
      location: selectedLocation
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-500" />
            <h2 className="text-lg font-bold text-gray-900">Select Location</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="flex gap-2 mb-2 relative">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleLiveSearch(e.target.value)}
                placeholder="Search: Chandigarh, Allen, IIT, FIITJEE, any location..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm"
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">💡 Searches live like Google - type any city, college, or place</p>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg max-h-64 overflow-y-auto shadow-lg">
              {searchResults.map((location, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCollegeSelect(location)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors flex items-start gap-3 active:bg-blue-100"
                >
                  <Building2 className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{location.name}</p>
                    <p className="text-xs text-gray-500 truncate">{location.type} • {location.city}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative overflow-hidden">
          <div id="map" className="w-full h-full" style={{ minHeight: '400px' }} />
          
          {/* Position Indicator */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 text-sm">
            <p className="text-gray-700 font-semibold">{selectedLocation}</p>
            <p className="text-gray-500 text-xs">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          </div>

          {/* Use My Location Button */}
          <button
            onClick={handleUseMyLocation}
            className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all flex items-center justify-center"
            title="Use my current location"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 hover:border-gray-400 rounded-lg font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-all"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
