import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, HelpCircle, Info, MessageCircle, ListPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebsiteUnread } from '../../hooks/useWebsiteUnread';

// Don't show on login/signup pages
const hiddenPaths = ['/website/login', '/website/signup', '/login', '/signup'];

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Shared with FloatingBidNowButton: one socket + 20s fallback poll instead of
  // a separate 3s inbox poll per component. Only subscribed while the nav can
  // actually be shown (mobile width, not a login/signup page). The keyboard
  // toggle is deliberately not part of this so typing doesn't resubscribe.
  const isHiddenPath = hiddenPaths.includes(location.pathname);
  const unreadCount = useWebsiteUnread({ user, enabled: isVisible && !isHiddenPath });

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

  if (isHiddenPath) {
    return null;
  }

  if (!isVisible || isKeyboardOpen) return null;

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
