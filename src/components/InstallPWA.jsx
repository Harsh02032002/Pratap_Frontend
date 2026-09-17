import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ShieldCheck, Building2, User, ShieldAlert, Wrench } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Clear old localStorage key so users aren't locked out of install prompt
    if (localStorage.getItem('pwa_prompt_shown')) {
      localStorage.removeItem('pwa_prompt_shown');
    }

    // Check if already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      try { window.deferredPwaPrompt = e; } catch (_) {}
      console.log('[PWA] beforeinstallprompt event captured.');
    };

    window.addEventListener('beforeinstallprompt', handler);

    const appInstalledHandler = () => {
      console.log('[PWA] App installed successfully.');
      localStorage.setItem('pwa_prompt_installed', 'true');
      setDeferredPrompt(null);
      setShowPrompt(false);
    };
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  useEffect(() => {
    if (!deferredPrompt) {
      setShowPrompt(false);
      return;
    }

    // Check if already installed
    if (localStorage.getItem('pwa_prompt_installed') === 'true') {
      setShowPrompt(false);
      return;
    }

    // Check if dismissed previously and if 24 hours have passed
    const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
    if (dismissedUntil) {
      const now = Date.now();
      if (now < parseInt(dismissedUntil, 10)) {
        setShowPrompt(false);
        return;
      }
    }

    setShowPrompt(true);
  }, [deferredPrompt, location.pathname]);

  const getPwaDetails = (pathname) => {
    if (pathname.startsWith('/superadmin')) {
      return {
        title: "Install Roomhy Admin App",
        description: "Manage platform operations, property approvals, payouts & tickets directly from your home screen.",
        badge: "SuperAdmin App",
        icon: ShieldAlert,
        btnColor: "bg-[#102A43] hover:bg-[#081B2C]"
      };
    }
    if (pathname.startsWith('/propertyowner')) {
      return {
        title: "Install Roomhy Owner App",
        description: "Get instant access to your PG/Hostel bookings, tenant rent collections & smart bids.",
        badge: "Property Owner App",
        icon: Building2,
        btnColor: "bg-[#0FA89C] hover:bg-[#0C8B81]"
      };
    }
    if (pathname.startsWith('/tenant')) {
      return {
        title: "Install Roomhy Tenant App",
        description: "Quick access to your room details, rent payment receipts, complaint tracking & visitor gate passes.",
        badge: "Tenant App",
        icon: User,
        btnColor: "bg-[#0FA89C] hover:bg-[#0C8B81]"
      };
    }
    if (pathname.startsWith('/employee') || pathname.startsWith('/staff')) {
      return {
        title: "Install Roomhy Staff App",
        description: "Access field lead tasks, property inspections, site visits & attendance punch-in on the go.",
        badge: "Staff & Field Operations App",
        icon: Wrench,
        btnColor: "bg-indigo-600 hover:bg-indigo-700"
      };
    }
    // Default Main Website
    return {
      title: "Install Roomhy App",
      description: "Discover top PGs, Hostels & Co-living spaces with Smart Bidding.",
      badge: "Roomhy Mobile & Desktop",
      icon: Smartphone,
      btnColor: "bg-[#0FA89C] hover:bg-[#0C8B81]"
    };
  };

  const pwaInfo = getPwaDetails(location.pathname);
  const IconComponent = pwaInfo.icon;

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("App is already installed or not supported on this browser.");
      setShowPrompt(false);
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
      localStorage.setItem('pwa_prompt_installed', 'true');
      setShowPrompt(false);
    } else {
      console.log('[PWA] User dismissed the install prompt');
      const hideUntil = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('pwa_prompt_dismissed_until', hideUntil.toString());
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
    try { window.deferredPwaPrompt = null; } catch (_) {}
  };

  const handleClose = () => {
    setShowPrompt(false);
    const hideUntil = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('pwa_prompt_dismissed_until', hideUntil.toString());
  };

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-[#DDE9E8] rounded-2xl shadow-2xl p-5 z-[9998] flex flex-col gap-4 animate-in slide-in-from-bottom-5"
      style={{ boxShadow: '0 20px 40px -15px rgba(16, 42, 67, 0.2)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3 items-[flex-start]">
          <div className="w-11 h-11 bg-[#F3FBFA] border border-[#0FA89C]/20 rounded-xl flex items-center justify-center shrink-0">
            <IconComponent className="w-5 h-5 text-[#0FA89C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[15px] text-[#102A43] leading-tight">{pwaInfo.title}</h3>
            </div>
            <span className="inline-block mt-1 bg-[#F3FBFA] border border-[#DDE9E8] text-[#0FA89C] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              {pwaInfo.badge}
            </span>
            <p className="text-[12px] text-slate-600 mt-1.5 leading-snug">{pwaInfo.description}</p>
          </div>
        </div>
        <button 
          onClick={handleClose} 
          className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstallClick}
          className={`flex-1 ${pwaInfo.btnColor} text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md text-[13px] flex items-center justify-center gap-2`}
        >
          <Download className="w-4 h-4" /> Install App Now
        </button>
        <button 
          onClick={handleClose}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2.5 px-3 rounded-xl transition-all text-[12px]"
        >
          Later
        </button>
      </div>
    </div>
  );
}
