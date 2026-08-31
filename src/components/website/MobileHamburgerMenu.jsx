import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, Home, Building2, Heart, MessageCircle, User, PlusCircle, HelpCircle, FileText, Gavel, Menu } from 'lucide-react';

export default function MobileHamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasUserData, setHasUserData] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const checkAuth = () => {
      const userData = localStorage.getItem('userData');
      setHasUserData(!!userData);
    };
    
    checkMobile();
    checkAuth();
    
    window.addEventListener('resize', checkMobile);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isMobile) return null;

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Building2, label: 'Our Properties', path: '/properties' },
    { icon: Gavel, label: 'Fast Bidding', path: '/bidding' },
    { icon: PlusCircle, label: 'List Property', path: '/list-property' },
    { icon: Heart, label: 'My Stays', path: '/website/mystays' },
    { icon: MessageCircle, label: 'Chat Support', path: '/website/chat' },
    { icon: User, label: hasUserData ? 'My Account' : 'Login / Signup', path: hasUserData ? '/website/mystays' : '/login' },
    { icon: HelpCircle, label: 'FAQs', path: '/faq' },
    { icon: FileText, label: 'Terms & Privacy', path: '/website/terms' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Trigger Button - Only on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <img 
              src="/website/roomhy_logo.jpeg" 
              alt="Roomhy Logo" 
              className="h-9 w-auto object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/website/roomhy_logo.jpeg';
              }}
            />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="py-2 overflow-y-auto h-[calc(100%-70px)]">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                            (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={index}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-4 px-5 py-3.5 transition-colors ${
                  isActive 
                    ? 'bg-[#1ab64f]/10 text-[#1ab64f]' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
