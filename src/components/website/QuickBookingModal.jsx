import { useState, useEffect } from 'react';
import { X, Mail, Phone, User, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function QuickBookingModal({ property, isOpen, onClose, onSubmit }) {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    bidAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && property) {
      const defaultRent = property.price || property.monthlyRent || property.rent || '';
      if (isAuthenticated && user) {
        setFormData({
          name: user.name || user.firstName || '',
          email: user.email || '',
          phone: user.phone || '',
          message: '',
          bidAmount: defaultRent ? String(defaultRent) : ''
        });
      } else {
        setFormData(prev => ({
          ...prev,
          bidAmount: defaultRent ? String(defaultRent) : ''
        }));
      }
    }
  }, [isOpen, isAuthenticated, user, property]);

  if (!isOpen || !property) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        propertyId: property._id || property.id,
        propertyName: property.name || property.title,
        propertyPrice: property.price || property.monthlyRent,
        propertyLocation: property.location || property.city,
        bookingType: formData.bidAmount ? 'bid' : 'direct'
      });
      
      // Reset form
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit booking');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isAuthenticated ? 'Confirm Booking' : 'Quick Booking'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Property Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2">{property.name || property.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {property.location}
            </div>
            <div className="font-bold text-orange-500">
              ₹{property.price}/month
            </div>
          </div>
        </div>

        {/* Form or Confirmation Page */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {isAuthenticated ? (
            // DIRECT BOOKING FOR LOGGED-IN USERS
            <div className="space-y-4">
              <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-gray-800 font-semibold text-base">
                  Do you want to book this property?
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Your booking request will be shared with the owner immediately.
                </p>
              </div>

              {/* Registered details preview */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Your Registered Details
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{formData.name}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{formData.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{formData.phone}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-teal-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Your Offered Rent / Bid Amount (₹)</span>
                  <span className="text-[10px] text-gray-400 font-normal">Listed: ₹{property.price || property.monthlyRent}/mo</span>
                </label>
                <input
                  type="number"
                  name="bidAmount"
                  value={formData.bidAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-teal-300 bg-teal-50/40 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-bold text-teal-900"
                  placeholder={`e.g. ${property.price || property.monthlyRent || 8000}`}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  💡 Enter your target rent budget. Owner can connect with you via Chat to negotiate.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Special Notes (Optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  placeholder="E.g. move-in date, roommate preference..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0FA596] hover:bg-teal-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors disabled:cursor-not-allowed text-base shadow-lg shadow-teal-500/20 active:scale-[0.98] cursor-pointer"
              >
                {loading ? 'Submitting Bid Request...' : 'Submit Bid / Booking Request'}
              </button>
            </div>
          ) : (
            // STANDARD FORM FOR NON-LOGGED-IN USERS
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-350 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-350 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-350 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-teal-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Your Offered Rent / Bid Amount (₹)</span>
                  <span className="text-[10px] text-gray-400 font-normal">Listed: ₹{property.price || property.monthlyRent}/mo</span>
                </label>
                <input
                  type="number"
                  name="bidAmount"
                  value={formData.bidAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-teal-300 bg-teal-50/40 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-bold text-teal-900"
                  placeholder={`e.g. ${property.price || property.monthlyRent || 8000}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Any special requirements or questions..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0FA596] hover:bg-teal-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-colors disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Submitting Bid Request...' : 'Submit Bid / Booking Request'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
