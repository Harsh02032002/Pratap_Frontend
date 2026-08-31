import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function FloatingBidNowButton({ onOpenModal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsScrolledDown(true);
      } else {
        setIsScrolledDown(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (location.pathname === '/website/chat') {
    return null;
  }

  const handleBidClick = () => {
    if (window.innerWidth < 768) {
      if (onOpenModal) onOpenModal();
    } else {
      navigate('/bidding');
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Link
        to="/website/chat"
        className="flex fixed bottom-36 md:bottom-24 right-4 md:right-6 z-50 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full font-bold hover:shadow-2xl transition-all duration-300 items-center shadow-xl group p-3.5 md:px-4 md:py-4 overflow-hidden active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.232-3.696A7.965 7.965 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className={`text-xs overflow-hidden transition-all duration-300 whitespace-nowrap group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 ${isScrolledDown ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-1.5'}`}>
          Chat Now
        </span>
      </Link>

      {/* Floating BidNow Button: Modal on Mobile, /bidding on Desktop */}
      <button
        onClick={handleBidClick}
        className="flex fixed bottom-20 md:bottom-8 right-4 md:right-6 z-50 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-bold hover:shadow-2xl transition-all duration-300 items-center shadow-xl group p-3.5 md:px-4 md:py-4 overflow-hidden active:scale-95 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className={`text-xs overflow-hidden transition-all duration-300 whitespace-nowrap group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1.5 ${isScrolledDown ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-1.5'}`}>
          BidNow
        </span>
      </button>
    </>
  );
}
