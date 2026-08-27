import { useState, useEffect } from 'react';
import { Heart, MapPin, Star, ArrowLeft, Trash2, Building2, Wifi, Wind, Droplets, Bed, ExternalLink, Loader, Edit2, X, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import WebsiteNavbar from '../../components/website/WebsiteNavbar';
import WebsiteFooter from '../../components/website/WebsiteFooter';
import MobileBottomNav from '../../components/website/MobileBottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFavourites, removeFromFavourites, getUserReviews, updateReview, deleteReview, getPropertyDetailsUrl } from '../../utils/api';

export default function FavouritesPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [favourites, setFavourites] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [showReviewsSection, setShowReviewsSection] = useState(false);

  // Load favourites from API
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/website/login');
      return;
    }

    const loadFavourites = async () => {
      try {
        setLoading(true);
        const data = await getUserFavourites();
        if (data.success) {
          setFavourites(data.favourites || []);
        }
      } catch (error) {
        console.error('Failed to load favourites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavourites();
  }, [isAuthenticated, navigate]);

  const removeFavourite = async (id) => {
    try {
      setRemovingId(id);
      const result = await removeFromFavourites(id);
      if (result.success) {
        setFavourites(prev => prev.filter(item => item._id !== id && item.id !== id));
      }
    } catch (error) {
      console.error('Failed to remove favourite:', error);
    } finally {
      setRemovingId(null);
    }
  };

  // Load user reviews
  const loadReviews = async () => {
    try {
      const data = await getUserReviews();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  // Handle edit review
  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditReviewText(review.text);
    setEditReviewRating(review.rating);
  };

  // Save edited review
  const handleSaveReview = async () => {
    if (!editingReview) return;
    try {
      const result = await updateReview(editingReview._id, {
        text: editReviewText,
        rating: editReviewRating
      });
      if (result.success) {
        setReviews(prev => prev.map(r =>
          r._id === editingReview._id ? { ...r, text: editReviewText, rating: editReviewRating } : r
        ));
        setEditingReview(null);
      }
    } catch (error) {
      console.error('Failed to update review:', error);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const result = await deleteReview(reviewId);
      if (result.success) {
        setReviews(prev => prev.filter(r => r._id !== reviewId));
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  // Toggle reviews section
  const toggleReviews = () => {
    if (!showReviewsSection) {
      loadReviews();
    }
    setShowReviewsSection(!showReviewsSection);
  };

  const getAmenityIcon = (amenity) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return Wifi;
      case 'ac': return Wind;
      case 'food': return Droplets;
      default: return Building2;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WebsiteNavbar />
        <div className="pt-24 pb-24 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-teal-500" />
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WebsiteNavbar />

      <main className="pt-20 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link to="/website/mystays" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to My Stays</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Favourites</h1>
                <p className="text-gray-500">{favourites.length} saved properties</p>
              </div>
            </div>
          </div>

          {favourites.length === 0 ? (
            // Empty State
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-12 h-12 text-pink-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Favourites Yet</h2>
              <p className="text-gray-500 mb-6">Start exploring and save properties you like!</p>
              <Link
                to="/website/ourproperty"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Building2 className="w-5 h-5" />
                Browse Properties
              </Link>
            </div>
          ) : (
            // Favourites Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favourites.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-lg transition-all"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={property.images?.[0] || property.image || `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 100)}`}
                      alt={property.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold">
                        {property.type}
                      </span>
                      <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {property.gender}
                      </span>
                    </div>
                    {/* Rating */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{property.rating}</span>
                    </div>
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFavourite(property._id || property.id)}
                      disabled={removingId === (property._id || property.id)}
                      className="absolute bottom-3 right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {removingId === (property._id || property.id) ? (
                        <Loader className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{property.name}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{property.location} - {property.area}</span>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(property.amenities || []).slice(0, 3).map((amenity, idx) => {
                        const Icon = getAmenityIcon(amenity);
                        return (
                          <span key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg text-xs text-gray-600">
                            <Icon className="w-3 h-3" />
                            {amenity}
                          </span>
                        );
                      })}
                      {(property.amenities || []).length > 3 && (
                        <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs text-gray-600">
                          +{(property.amenities || []).length - 3}
                        </span>
                      )}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">₹{(property.price || 0).toLocaleString()}</span>
                        <span className="text-gray-500 text-sm">/mo</span>
                      </div>
                      <Link
                        to={getPropertyDetailsUrl(property)}
                        className="flex items-center gap-1 bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-600 transition-colors"
                      >
                        View
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reviews Section Toggle */}
          <div className="mt-8 mb-4">
            <button
              onClick={toggleReviews}
              className="flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700"
            >
              <Star className="w-5 h-5" />
              {showReviewsSection ? 'Hide My Reviews' : 'Show My Reviews'}
              <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs">
                {reviews.length}
              </span>
            </button>
          </div>

          {/* Reviews Section */}
          {showReviewsSection && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                My Reviews
              </h2>

              {reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">You haven't written any reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="border border-gray-200 rounded-xl p-4">
                      {/* Property Info */}
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={review.propertyImage || `https://picsum.photos/100/100?random=${Math.floor(Math.random() * 100)}`}
                          alt={review.propertyName}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{review.propertyName}</h3>
                          <div className="flex items-center gap-1 text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Edit Mode */}
                      {editingReview?._id === review._id ? (
                        <div className="space-y-3">
                          {/* Rating Edit */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Rating:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setEditReviewRating(star)}
                                  className="p-1"
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      star <= editReviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Text Edit */}
                          <textarea
                            value={editReviewText}
                            onChange={(e) => setEditReviewText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            rows={3}
                            placeholder="Write your review..."
                          />
                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveReview}
                              className="flex items-center gap-1 bg-teal-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                            >
                              <Send className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingReview(null)}
                              className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Review Display */
                        <>
                          <p className="text-gray-700 text-sm mb-3">{review.text}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditReview(review)}
                              className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <WebsiteFooter />
      <MobileBottomNav />
    </div>
  );
}
