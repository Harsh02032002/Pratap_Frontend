import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, HelpCircle, Info, MessageCircle, ListPlus } from 'lucide-react';
import { getScopedStoredUser } from '../../utils/authScope';
import { useAuth } from '../../contexts/AuthContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsVisible(window.innerWidth < 768);
    };

    // Detect keyboard open (viewport height changes)
    const handleResize = () => {
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const windowHeight = window.innerHeight;
      // If viewport is significantly smaller than window, keyboard is likely open
      setIsKeyboardOpen(viewportHeight < windowHeight * 0.75);
    };

    checkMobile();
    handleResize();

    window.addEventListener('resize', checkMobile);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Don't show on login/signup pages
  const hiddenPaths = ['/website/login', '/website/signup', '/login', '/signup'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  if (!isVisible || isKeyboardOpen) return null;

  const [unreadCount, setUnreadCount] = useState(0);

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

        const { fetchJson } = await import('../../utils/api');
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

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Building2, path: '/website/ourproperty', label: 'Properties' },
    { icon: HelpCircle, path: '/website/faq', label: 'FAQ' },
    { icon: Info, path: '/website/about', label: 'About' },
    { icon: MessageCircle, path: '/website/chat', label: 'Chat', isChat: true },
    { icon: ListPlus, path: '/website/list', label: 'List' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/website/index';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                active 
                  ? 'text-[#0FA596]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {item.isChat && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-rose-500 text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border border-white shadow-xs animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
