import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, HelpCircle, Info, MessageCircle, ListPlus } from 'lucide-react';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
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

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Building2, path: '/website/ourproperty', label: 'Properties' },
    { icon: HelpCircle, path: '/website/faq', label: 'FAQ' },
    { icon: Info, path: '/website/about', label: 'About' },
    { icon: MessageCircle, path: '/website/chat', label: 'Chat' },
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
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active 
                  ? 'text-[#1ab64f]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[9px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
