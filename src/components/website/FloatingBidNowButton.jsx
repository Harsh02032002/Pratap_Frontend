import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Zap } from 'lucide-react';
import { fetchJson } from '../../utils/api';
import { getScopedStoredUser } from '../../utils/authScope';
import { useAuth } from '../../contexts/AuthContext';

export default function FloatingBidNowButton({ onOpenModal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Real-time unread messages count polling (WhatsApp style badge)
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const userObj = user || getScopedStoredUser() || {};
        let userId = userObj?.loginId || userObj?.email;
        if (!userId && userObj?.email) {
          let hash = 0;
          const safeEmail = String(userObj.email).trim().toLowerCase();
          for (let i = 0; i < safeEmail.length; i += 1) {
            hash = (hash * 31 + safeEmail.charCodeAt(i)) % 1000000;
          }
          userId = `roomhyweb${String(hash).padStart(6, "0")}`;
        }
        if (!userId) return;

        const data = await fetchJson(`/api/chat/inbox/${encodeURIComponent(userId)}`).catch(() => null);
        if (data?.conversations && Array.isArray(data.conversations)) {
          const total = data.conversations.reduce((acc, c) => acc + (Number(c.unread_count) || 0), 0);
          setUnreadCount(total);
        }
      } catch (_) {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 3000);
    return () => clearInterval(interval);
  }, [user]);

  if (location.pathname === '/website/chat' || location.pathname === '/properties' || location.pathname.startsWith('/properties') || location.pathname === '/bidding' || location.pathname.startsWith('/bidding')) {
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
    <div className="fixed bottom-6 right-4 md:right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-auto">
      {/* Floating Chat Button with WhatsApp Style Unread Counter Badge */}
      <Link
        to="/website/chat"
        className="flex bg-gradient-to-r from-[#0FA596] to-teal-600 text-white rounded-full font-bold hover:shadow-2xl transition-all duration-300 items-center shadow-2xl group p-3.5 md:px-4 md:py-3.5 active:scale-95 relative border border-white/30"
      >
        <div className="relative flex items-center">
          <MessageCircle className="w-5 h-5 flex-shrink-0 text-white" />

          {/* WhatsApp Style Red Badge Counter */}
          {unreadCount > 0 && (
            <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-black min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce z-10">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        <span className={`text-xs font-extrabold overflow-hidden transition-all duration-300 whitespace-nowrap group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 ${isScrolledDown ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-2'}`}>
          Chat Now
        </span>
      </Link>

      {/* Floating BidNow Button */}
      <button
        onClick={handleBidClick}
        className="flex bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-bold hover:shadow-2xl transition-all duration-300 items-center shadow-2xl group p-3.5 md:px-4 md:py-3.5 active:scale-95 cursor-pointer border border-white/30"
      >
        <Zap className="w-5 h-5 flex-shrink-0 text-white fill-white" />
        <span className={`text-xs font-extrabold overflow-hidden transition-all duration-300 whitespace-nowrap group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 ${isScrolledDown ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-2'}`}>
          BidNow
        </span>
      </button>
    </div>
  );
}
