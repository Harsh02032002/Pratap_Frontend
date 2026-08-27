import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { fetchFeaturedReviews } from '../../utils/api';

const chooseUsPoints = [
  {
    title: "Zero Brokerage",
    description: "Save your money for what matters. We connect you directly with property owners, with no hidden fees.",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Fully Furnished",
    description: "Move in with just your suitcase. Our properties come with all the essential furniture and amenities.",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "24/7 Support",
    description: "From booking to move-out, our dedicated support team is always here to help you.",
    image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Verified Listings",
    description: "Every property is verified by our team. No fake photos, no scams.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Flexible Booking",
    description: "Book for any duration - short term or long term. Cancel anytime with refund.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Student Community",
    description: "Join a community of thousands of students. Make friends and share experiences.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
  },
];

const fallbackReviews = [
  {
    _id: '1',
    name: 'Rahul Sharma',
    rating: 5,
    review: 'Roomhy made finding my hostel so easy! Zero brokerage and the bidding feature got me a great deal.',
    designation: 'Delhi Student',
    location: 'Kota',
    avatar: 'https://i.pravatar.cc/80?img=12',
    isVerified: true
  },
  {
    _id: '2',
    name: 'Priya Patel',
    rating: 5,
    review: 'The 24/7 support team helped me find a safe PG near my college. Best platform for students!',
    designation: 'Medical Student',
    location: 'Indore',
    avatar: 'https://i.pravatar.cc/80?img=32',
    isVerified: true
  },
  {
    _id: '3',
    name: 'Vikram Singh',
    rating: 5,
    review: 'Verified properties and direct owner contact saved me time and money. Highly recommended!',
    designation: 'Allen Student',
    location: 'Kota',
    avatar: 'https://i.pravatar.cc/80?img=15',
    isVerified: true
  },
  {
    _id: '4',
    name: 'Anjali Mehta',
    rating: 5,
    review: 'Love the variety of options. Co-living spaces are amazing and budget friendly.',
    designation: 'IT Professional',
    location: 'Indore',
    avatar: 'https://i.pravatar.cc/80?img=47',
    isVerified: true
  }
];

export default function WhyStudentsChooseUs() {
  const [reviews, setReviews] = useState(fallbackReviews);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await fetchFeaturedReviews(10);
        if (data && data.length > 0) {
          setReviews(data);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };
    loadReviews();
  }, []);

  const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
  ));

  const duplicatedReviews = [...reviews, ...reviews];

  return (
    <section className="bg-gray-50 py-5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Desktop 6-card grid */}
        <div className="hidden md:block text-center mb-6 md:mb-12">
          <h2 className="text-lg md:text-4xl font-bold text-gray-900 mb-1 md:mb-4">Why Students Choose Us</h2>
          <p className="text-xs md:text-lg text-gray-600 mt-1 md:mt-2 max-w-2xl mx-auto">Here's what makes us the preferred choice for students.</p>
        </div>

        <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {chooseUsPoints.map((point, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-5 border border-gray-100">
              <div className="relative mb-4">
                <img src={point.image} alt={point.title} className="rounded-lg h-40 w-full object-cover" loading="lazy" width="400" height="160" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white">{index + 1}</div>
              </div>
              <h3 className="font-bold text-lg text-gray-900 text-center">{point.title}</h3>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed text-center">{point.description}</p>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* MOBILE "WHAT STUDENTS SAY" (Smooth Continuous Marquee - 100% SS 2 Match)   */}
        {/* ========================================================================= */}
        <div className="md:hidden">
          <div className="text-center mb-3">
            <h2 className="text-lg font-bold text-gray-900 mb-0.5">What Students Say</h2>
            <p className="text-[11px] text-gray-500 font-medium">Trusted by 10,000+ students across India</p>
          </div>

          <div className="relative w-full overflow-hidden">
            <div className="flex gap-3 animate-scroll-left w-max py-2">
              {duplicatedReviews.map((r, idx) => (
                <div
                  key={idx}
                  className="w-[230px] shrink-0 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      {r.avatar ? (
                        <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-full object-cover border border-teal-100" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-500 text-white font-bold flex items-center justify-center text-xs">
                          {r.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xs text-gray-900 leading-tight">{r.name}</h4>
                        <p className="text-[10px] text-gray-400 font-medium">{r.designation || 'Student'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1.5">
                      {renderStars(r.rating || 5)}
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium italic line-clamp-3">
                      "{r.review}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DESKTOP TESTIMONIAL BOX */}
        <div className="hidden md:block bg-gradient-to-r from-teal-500 to-blue-600 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-4 md:mb-8">
            <h2 className="text-lg md:text-4xl font-bold text-white mb-1 md:mb-3">What Our Students Say</h2>
            <p className="text-white/80 text-xs md:text-lg max-w-2xl mx-auto">Real experiences from real students who found their perfect stay</p>
          </div>

          {reviews.length > 0 && (
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-shrink-0">
                    {reviews[currentReviewIndex]?.avatar ? (
                      <img src={reviews[currentReviewIndex].avatar} alt={reviews[currentReviewIndex].name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-teal-100" />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-teal-100">
                        {reviews[currentReviewIndex]?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Quote className="w-8 h-8 text-teal-200 mb-2" />
                    <p className="text-gray-700 text-lg leading-relaxed mb-4 italic">"{reviews[currentReviewIndex]?.review}"</p>
                    <div className="flex items-center gap-1 mb-3">{renderStars(reviews[currentReviewIndex]?.rating || 5)}</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="font-bold text-gray-900">{reviews[currentReviewIndex]?.name}</h4>
                      {reviews[currentReviewIndex]?.isVerified && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Verified Student</span>}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{reviews[currentReviewIndex]?.designation}{reviews[currentReviewIndex]?.location && <span className="text-teal-600"> • {reviews[currentReviewIndex].location}</span>}</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-white text-teal-600 w-12 h-12 rounded-full shadow-lg hover:shadow-xl hover:bg-teal-50 transition-all flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={() => setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-white text-teal-600 w-12 h-12 rounded-full shadow-lg hover:shadow-xl hover:bg-teal-50 transition-all flex items-center justify-center"><ChevronRight className="w-6 h-6" /></button>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-left {
          animation: scroll-left 25s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
