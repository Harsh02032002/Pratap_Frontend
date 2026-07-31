import React, { useEffect, useMemo, useState } from "react";
import TrialGuard from "./TrialGuard";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, BedDouble, ClipboardList, CalendarCheck, MessageCircle, 
  User, Settings, CreditCard, MapPin, MessageSquare, ChevronDown, 
  UserCircle, LogOut, Home, X, Plus, Menu, Bell, Settings2, Search, 
  Lock, ChevronRight, Crown, Zap, Users, BookOpen, FileText, Smartphone, 
  Wallet, PieChart, Shield, Target, Navigation, Megaphone, Coffee, 
  Receipt, Sparkles, LinkIcon, UserPlus, AlertCircle, Calendar, HelpCircle, Building2,
  IndianRupee, Headset, Briefcase, Globe, BarChart3, Database, History
} from "lucide-react";
import { SILVER_NAV, GOLD_NAV } from './navConfig';
import { cacheInvalidate } from "../../utils/cache";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function PropertyOwnerMobileLayout({
  owner,
  title,
  children,
  mainClassName = "flex-1 overflow-y-auto p-4 pb-24",
  contentClassName = "",
  headerRight = null,
  notificationCount = 0,
  notifications = [],
  onLogout,
  disableSubmenuStrip = false,
  // Props passed from PropertyOwnerLayout to avoid duplicate fetches
  properties: propsProperies = null,
  activePropertyId: propsActivePropertyId = null,
  handlePropertySwitch: propsHandlePropertySwitch = null,
  allowAllProperties = true,
  // New props for rooms page
  rooms = [],
  loading = false,
  // Permission-filtered nav for staff members sharing this panel; owners omit it.
  navItems = null,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Navigation lists. When `navItems` is supplied this is a permission-filtered
  // staff member sharing the panel, so the whole mobile chrome (bottom bar, More
  // drawer, quick actions) must follow that nav instead of the owner defaults.
  const CURRENT_NAV = navItems || GOLD_NAV;
  const staffMode = Array.isArray(navItems) && navItems.length > 0;

  const activeParent = useMemo(() => {
    return CURRENT_NAV.find(item => 
      item.href === pathname || 
      (item.submenus && item.submenus.some(sub => sub.href === pathname || pathname.startsWith(sub.href + '/')))
    );
  }, [pathname, CURRENT_NAV]);

  // Drawer / Menu states
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Property Switcher state — use props from parent if provided, else fall back to local state
  const [localProperties, setLocalProperties] = useState([]);
  const [localActivePropertyId, setLocalActivePropertyId] = useState('all');

  const properties = propsProperies !== null ? propsProperies : localProperties;
  const activePropertyId = propsActivePropertyId !== null ? propsActivePropertyId : localActivePropertyId;

  useEffect(() => {
    // Only run local fetch if parent didn't supply properties
    if (propsProperies !== null) return;
    const storedActive = localStorage.getItem('owner_active_property');
    if (storedActive) setLocalActivePropertyId(storedActive);
  }, [propsProperies]);

  const handlePropertySwitch = propsHandlePropertySwitch 
    ? (propId) => { setSwitcherOpen(false); propsHandlePropertySwitch(propId); }
    : (propId) => {
        localStorage.setItem('owner_active_property', propId);
        setLocalActivePropertyId(propId);
        setSwitcherOpen(false);
        window.location.reload();
      };

  // Notifications — use props passed from parent (no duplicate fetch)
  const [localClearedNotifications, setLocalClearedNotifications] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState(notifications);

  useEffect(() => {
    if (!localClearedNotifications) {
      setDisplayNotifications(notifications);
    }
  }, [notifications, localClearedNotifications]);

  const displayNotificationCount = displayNotifications.filter(n => !n.read).length || notificationCount;

  const displayName = useMemo(() => owner?.name || owner?.ownerName || "Owner", [owner]);
  const ownerInitial = useMemo(() => String(displayName).charAt(0).toUpperCase() || "O", [displayName]);
  const activePropertyName = useMemo(() => {
    if (activePropertyId === 'all') return "All Properties";
    return properties.find(p => String(p._id || p.id) === activePropertyId)?.title || "Active Property";
  }, [activePropertyId, properties]);

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (_) {}
    window.location.href = "/propertyowner/ownerlogin";
  };

  // Helper to determine active tab
  const isTabActive = (paths) => {
    return paths.some(path => pathname === path || pathname.startsWith(`${path}/`));
  };

  // Quick Action handler
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;
  const [totalRooms, setTotalRooms] = useState(0);

  // Close drawers on route change
  useEffect(() => {
    setMoreDrawerOpen(false);
    setNotifDrawerOpen(false);
    setProfileDrawerOpen(false);
    setSwitcherOpen(false);
    setQuickActionsOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 font-sans relative overflow-hidden">
      
      {/* 1. PREMIUM HEADER */}
      <header className="sticky top-0 z-40 bg-white text-slate-800 px-4 py-3 flex flex-col justify-between shadow-sm shrink-0 border-b border-slate-100">
        <div className="flex items-center justify-between w-full">
          {/* Menu & Brand Logo & Name */}
          <div className="flex items-center gap-2">
            {/* Hamburger Menu trigger */}
            <button 
              onClick={() => setMoreDrawerOpen(true)}
              className="p-1 text-slate-700 hover:text-slate-900 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={22} className="stroke-[2.5]" />
            </button>
            <span className="text-lg font-black tracking-tight text-slate-900 font-sans flex items-center shrink-0">
              Roomhy<span className="text-blue-600">.com</span>
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button 
              onClick={() => setNotifDrawerOpen(true)}
              className="relative p-1.5 text-slate-700 transition-all"
              aria-label="Notifications"
            >
              <Bell size={21} className="stroke-[2]" />
              {displayNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 bg-[#E11D48] text-white text-[8px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                  {displayNotificationCount}
                </span>
              )}
            </button>

            {/* Profile Avatar */}
            <button 
              onClick={() => setProfileDrawerOpen(true)}
              className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center border-2 border-white/30 shadow-md shrink-0 hover:scale-105 transition-transform"
            >
              {ownerInitial}
            </button>
          </div>
        </div>

        {/* Context Switcher / Active Property Bar */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-lg text-slate-700 transition-all text-[11px] font-semibold max-w-[170px]"
          >
            <Building2 size={12} className="text-blue-600 shrink-0" />
            <span className="truncate">{activePropertyName}</span>
            <ChevronDown size={11} className={cn("text-slate-500 transition-transform shrink-0", switcherOpen && "rotate-180")} />
          </button>

          {/* Mini Stats Indicator */}
          <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Active</span>
          </div>
        </div>

      </header>

      {/* 2. BODY CONTENT */}
      <main className={cn("flex-1 overflow-y-auto bg-slate-50 custom-scrollbar", mainClassName)}>

        {title && (
  <div className="px-4 pt-5 pb-2 text-center">
    <h2 className="text-[24px] font-black text-slate-900 tracking-tight font-sans">{title}</h2>
    <div className="w-10 h-1 bg-blue-600 rounded-full mx-auto mt-2 opacity-80" />
  </div>
)}
        {activeParent?.submenus && !disableSubmenuStrip && (
          <div className="px-4 py-2 overflow-x-auto flex gap-2 border-b border-slate-100 bg-white" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {activeParent.submenus.map((sub, i) => {
              const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
              return (
                <Link
                  key={i}
                  to={sub.href}
                  className={cn(
                    "shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all whitespace-nowrap",
                    isSubActive 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        )}
        <div className={cn("w-full px-2.5 py-2 mobile-page-container", contentClassName)}>
          <TrialGuard owner={owner}>
            {children}
          </TrialGuard>
        </div>
      </main>

      {/* 3. PREMIUM BOTTOM NAVBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 px-2 py-1 flex items-center justify-around text-slate-500 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.03)] shrink-0">

        {staffMode ? (
          /* Staff: first four permitted destinations */
          CURRENT_NAV.slice(0, 4).map((item) => {
            const Icon = item.icon || Home;
            const active = isTabActive([item.href]) ||
              (item.submenus && item.submenus.some((s) => isTabActive([s.href])));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-14 py-1.5 transition-all rounded-xl",
                  active ? "text-blue-600 scale-105 font-bold" : "hover:text-slate-800"
                )}
              >
                <Icon size={18} />
                <span className="text-[9px] mt-1 font-bold truncate max-w-[52px]">{item.label}</span>
              </Link>
            );
          })
        ) : (
          <>
            {/* Tab 1: Dashboard */}
            <Link
              to="/propertyowner/admin"
              className={cn(
                "flex flex-col items-center justify-center w-14 py-1.5 transition-all rounded-xl",
                isTabActive(["/propertyowner/admin"])
                  ? "text-blue-600 scale-105 font-bold"
                  : "hover:text-slate-800"
              )}
            >
              <Home size={18} />
              <span className="text-[9px] mt-1 font-bold">Home</span>
            </Link>

            {/* Tab 2: Properties */}
            <Link
              to="/propertyowner/properties"
              className={cn(
                "flex flex-col items-center justify-center w-14 py-1.5 transition-all rounded-xl",
                isTabActive(["/propertyowner/properties", "/propertyowner/rooms", "/propertyowner/add-property", "/propertyowner/amenities", "/propertyowner/location"])
                  ? "text-blue-600 scale-105 font-bold"
                  : "hover:text-slate-800"
              )}
            >
              <Building2 size={18} />
              <span className="text-[9px] mt-1 font-bold">Properties</span>
            </Link>

            {/* Tab 3: Tenants */}
            <Link
              to="/propertyowner/tenants"
              className={cn(
                "flex flex-col items-center justify-center w-14 py-1.5 transition-all rounded-xl",
                isTabActive(["/propertyowner/tenants", "/propertyowner/tenantrec", "/propertyowner/active-tenants", "/propertyowner/upcoming-moveins", "/propertyowner/moveout-requests", "/propertyowner/ex-tenants", "/propertyowner/tenant-docs", "/propertyowner/police-verification", "/propertyowner/review"])
                  ? "text-blue-600 scale-105 font-bold"
                  : "hover:text-slate-800"
              )}
            >
              <Users size={18} />
              <span className="text-[9px] mt-1 font-bold">Tenants</span>
            </Link>

            {/* Tab 4: Leads */}
            <Link
              to="/propertyowner/enquiry"
              className={cn(
                "flex flex-col items-center justify-center w-14 py-1.5 transition-all rounded-xl",
                isTabActive(["/propertyowner/booking", "/propertyowner/booking_request", "/propertyowner/enquiry"])
                  ? "text-blue-600 scale-105 font-bold"
                  : "hover:text-slate-800"
              )}
            >
              <CalendarCheck size={18} />
              <span className="text-[9px] mt-1 font-bold">Leads</span>
            </Link>
          </>
        )}

        {/* Tab 5: More Trigger */}
        <button
          onClick={() => setMoreDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center w-14 py-1.5 transition-all rounded-xl",
            moreDrawerOpen 
              ? "text-blue-600 scale-105 font-bold" 
              : "hover:text-slate-800"
          )}
        >
          <Menu size={18} />
          <span className="text-[9px] mt-1 font-bold">More</span>
        </button>
      </nav>

      {/* ======================================================== */}
      {/* 4. GLOBAL FLOATING ACTION BUTTON (FAB)                    */}
      {/* ======================================================== */}
      {/* Owner-only quick actions (Add Property/Tenant/Lead) — hidden for staff */}
      {!staffMode && (
        <button
          onClick={() => setQuickActionsOpen(true)}
          className="fixed bottom-[80px] right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center z-30 hover:scale-105 active:scale-95 transition-all"
          aria-label="Add Action"
        >
          <Plus size={28} className="stroke-[2.5]" />
        </button>
      )}

      {/* ======================================================== */}
      {/* 5. MODALS & SLIDE-UP DRAWER OVERLAYS (GLASSMORPHISM)      */}
      {/* ======================================================== */}

      {/* BACKDROP SHIELD */}
      {(moreDrawerOpen || notifDrawerOpen || profileDrawerOpen || switcherOpen || quickActionsOpen) && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-45 transition-opacity duration-300"
          onClick={() => {
            setMoreDrawerOpen(false);
            setNotifDrawerOpen(false);
            setProfileDrawerOpen(false);
            setSwitcherOpen(false);
            setQuickActionsOpen(false);
          }}
        />
      )}

      {/* GLOBAL FAB ACTION MENU (BOTTOM SHEET) */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 p-6 transition-transform duration-300 ease-out transform",
        quickActionsOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setQuickActionsOpen(false)} />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-5 text-center">What would you like to add?</h3>
        
        <div className="space-y-3">
          <Link to="/propertyowner/add-property" onClick={() => setQuickActionsOpen(false)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-indigo-600" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-[15px] font-black text-indigo-900 leading-tight">Add Property</h4>
              <p className="text-[11px] font-semibold text-indigo-600/70 mt-0.5">List a new PG, Hostel or Flat</p>
            </div>
            <ChevronRight size={20} className="text-indigo-300" />
          </Link>

          <Link to="/propertyowner/tenantrec" onClick={() => setQuickActionsOpen(false)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <UserPlus size={24} className="text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-[15px] font-black text-emerald-900 leading-tight">Add Tenant</h4>
              <p className="text-[11px] font-semibold text-emerald-600/70 mt-0.5">Onboard a new resident</p>
            </div>
            <ChevronRight size={20} className="text-emerald-300" />
          </Link>

          <Link to="/propertyowner/add-staff" onClick={() => {
              setQuickActionsOpen(false);
              // If the PWA beforeinstallprompt was captured, prompt now (must be a user gesture)
              try {
                if (window.deferredPwaPrompt) {
                  window.deferredPwaPrompt.prompt();
                  window.deferredPwaPrompt.userChoice.then(choice => {
                    if (choice.outcome === 'accepted') {
                      localStorage.setItem('pwa_prompt_installed', 'true');
                    } else {
                      const hideUntil = Date.now() + 24 * 60 * 60 * 1000;
                      localStorage.setItem('pwa_prompt_dismissed_until', hideUntil.toString());
                    }
                    try { window.deferredPwaPrompt = null; } catch (_) {}
                  }).catch(() => { try { window.deferredPwaPrompt = null; } catch (_) {} });
                }
              } catch (_) {}
            }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
              <UserPlus size={24} className="text-violet-600" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-[15px] font-black text-violet-900 leading-tight">Add Staff</h4>
              <p className="text-[11px] font-semibold text-violet-600/70 mt-0.5">Register a guard, cleaner or manager</p>
            </div>
            <ChevronRight size={20} className="text-violet-300" />
          </Link>

          <Link to="/propertyowner/booking" onClick={() => setQuickActionsOpen(false)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <CalendarCheck size={24} className="text-amber-600" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-[15px] font-black text-amber-900 leading-tight">Add Lead</h4>
              <p className="text-[11px] font-semibold text-amber-600/70 mt-0.5">Record a new inquiry or booking</p>
            </div>
            <ChevronRight size={20} className="text-amber-300" />
          </Link>
        </div>
        <button onClick={() => setQuickActionsOpen(false)} className="w-full mt-6 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors">
          Cancel
        </button>
      </div>

      {/* PROPERTY SWITCHER DRAWER (BOTTOM SHEET) */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 rounded-t-[2rem] shadow-2xl z-50 p-6 transition-all duration-500 ease-out transform max-h-[70vh] flex flex-col",
        switcherOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setSwitcherOpen(false)} />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Switch Property</h3>
          <button onClick={() => setSwitcherOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {/* All Properties overview — owners only; staff are locked to their hostel */}
          {allowAllProperties && (
            <button
              onClick={() => handlePropertySwitch('all')}
              className={cn(
                "w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold transition-all border text-left",
                activePropertyId === 'all'
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "border-slate-100 hover:bg-slate-50 text-slate-600"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <LayoutDashboard size={14} className="text-slate-500" />
                </div>
                <span>All Properties (Overview)</span>
              </div>
              {activePropertyId === 'all' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
            </button>
          )}

          {/* Properties loop */}
          {properties.map(p => {
            const pId = String(p._id || p.id);
            const isActive = activePropertyId === pId;
            return (
              <button
                key={pId}
                onClick={() => handlePropertySwitch(pId)}
                className={cn(
                  "w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold transition-all border text-left",
                  isActive 
                    ? "bg-blue-50 border-blue-200 text-blue-600" 
                    : "border-slate-100 hover:bg-slate-50 text-slate-600"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Building2 size={14} className={isActive ? "text-blue-500" : "text-slate-400"} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-slate-800">{p.title || p.name || "Property"}</span>
                    <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{p.city || p.area || "No Location"}</span>
                  </div>
                </div>
                {isActive && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* NOTIFICATIONS SLIDE-UP DRAWER */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 rounded-t-[2rem] shadow-2xl z-50 p-6 transition-all duration-500 ease-out transform max-h-[80vh] flex flex-col",
        notifDrawerOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setNotifDrawerOpen(false)} />
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Alerts & Logs</h3>
          </div>
          <div className="flex gap-4">
            {/* Staff must not clear the owner's notification feed */}
            {!staffMode && displayNotifications.length > 0 && (
              <button
                onClick={async () => {
                  setGlobalNotifications([]);
                  if (owner?.loginId) {
                    cacheInvalidate(`notifications:${owner.loginId}`);
                    try {
                      const { fetchJson } = await import("../../utils/api");
                      await fetchJson(`/api/notifications/mark-all-read`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toLoginId: owner.loginId })
                      });
                    } catch (e) {
                      console.error("Failed to clear notifications", e);
                    }
                  }
                }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
              >
                Mark Read
              </button>
            )}
            <button onClick={() => setNotifDrawerOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5">
          {displayNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto opacity-30 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">No notifications yet</p>
            </div>
          ) : (
            displayNotifications.map((n, i) => (
              <div key={i} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-[11px] font-black text-slate-800 leading-tight mb-1">{n.title}</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PROFILE & LOGOUT SLIDE-UP DRAWER */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 rounded-t-[2rem] shadow-2xl z-50 p-6 transition-all duration-500 ease-out transform",
        profileDrawerOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setProfileDrawerOpen(false)} />
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Account</h3>
          <button onClick={() => setProfileDrawerOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center font-black text-lg text-white">
            {ownerInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-900 truncate leading-none mb-1">{displayName}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider italic leading-none">{owner?.loginId}</p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Profile Settings is owner-only — hidden for staff */}
          {!staffMode && (
            <Link
              to="/propertyowner/ownerprofile"
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-center text-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <UserCircle size={15} className="text-blue-500" />
              <span>Profile Settings</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-rose-200"
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* MORE SERVICES SLIDE-UP DRAWER (THE SYSTEM PORTAL) */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-200 rounded-t-[2.5rem] shadow-2xl z-50 p-6 pb-8 transition-all duration-500 ease-out transform max-h-[85vh] flex flex-col",
        moreDrawerOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setMoreDrawerOpen(false)} />
        <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500 fill-blue-200" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Extended Panel</h3>
          </div>
          <button onClick={() => setMoreDrawerOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={18} />
          </button>
        </div>

        {/* GROUPED SERVICES */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4 space-y-4">

          {staffMode ? (
            /* Staff: every permitted destination, permission-filtered */
            <div className="grid grid-cols-3 gap-3">
              {CURRENT_NAV.map((item) => (
                <GridItem
                  key={item.href}
                  to={item.href}
                  icon={item.icon || Home}
                  label={item.label}
                  active={pathname === item.href || (item.submenus && item.submenus.some((s) => pathname.startsWith(s.href.split("?")[0])))}
                />
              ))}
            </div>
          ) : (
          <>
          {/* TENANTS GROUP */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              <GridItem to="/propertyowner/tenants" icon={Users} label="All Tenants" active={pathname.startsWith("/propertyowner/tenants")} />
              <GridItem to="/propertyowner/tenantrec" icon={UserPlus} label="Add Tenant" active={pathname.startsWith("/propertyowner/tenantrec")} />
              <GridItem to="/propertyowner/tenant-docs" icon={FileText} label="Tenant Docs" active={pathname.startsWith("/propertyowner/tenant-docs")} />
              <GridItem to="/propertyowner/upcoming-moveins" icon={CalendarCheck} label="Upcoming Move-ins" active={pathname.startsWith("/propertyowner/upcoming-moveins")} />
              <GridItem to="/propertyowner/ex-tenants" icon={History} label="Ex-Tenants" active={pathname.startsWith("/propertyowner/ex-tenants")} />
            </div>
          </div>

          {/* BUSINESS GROUP */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              <GridItem to="/propertyowner/payment" icon={IndianRupee} label="Rent & Payments" active={pathname.startsWith("/propertyowner/payment")} />
              <GridItem to="/propertyowner/collection-report" icon={Wallet} label="Accounting" active={pathname.startsWith("/propertyowner/collection-report")} />
              <GridItem to="/propertyowner/reports" icon={BarChart3} label="Reports" active={pathname.startsWith("/propertyowner/reports")} />
            </div>
          </div>

          {/* OPERATIONS GROUP */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              <GridItem to="/propertyowner/complaints" icon={Headset} label="Complaints" active={pathname.startsWith("/propertyowner/complaints")} />
              <GridItem to="/propertyowner/all-staff" icon={Briefcase} label="Staff Mgmt" active={pathname.startsWith("/propertyowner/all-staff")} />
              <GridItem to="/propertyowner/tenant-attendance" icon={ClipboardList} label="Attendance" active={pathname.startsWith("/propertyowner/tenant-attendance")} />
            </div>
          </div>

          {/* MARKETING GROUP */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              <GridItem to="/propertyowner/ownerchat" icon={MessageCircle} label="Chat & Msgs" active={pathname.startsWith("/propertyowner/ownerchat")} />
              <GridItem to="/propertyowner/vacancy-promotion" icon={Megaphone} label="Marketing" active={pathname.startsWith("/propertyowner/vacancy-promotion")} />
            </div>
          </div>

          {/* SYSTEM GROUP */}
          <div>
            <div className="grid grid-cols-3 gap-3">
              <GridItem to="/propertyowner/ownerprofile" icon={Settings} label="Settings" active={pathname.startsWith("/propertyowner/ownerprofile") || pathname.startsWith("/propertyowner/bank-accounts")} />
              <button 
                onClick={() => {
                  setMoreDrawerOpen(false);
                  setSwitcherOpen(true);
                }}
                className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-slate-600"
              >
                <Building2 size={20} className="text-blue-500 mb-1.5" />
                <span className="text-[10px] font-bold tracking-tight text-center leading-tight text-slate-600">Switch Prop.</span>
              </button>
            </div>
          </div>
          </>
          )}

        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-200 pt-4 shrink-0 flex items-center justify-between">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Roomhy Owner Pro v2.0</p>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600"
          >
            <LogOut size={12} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact grid item helper for the "More" bottom sheet
function GridItem({ to, icon: Icon, label, active }) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all",
        active 
          ? "bg-blue-50 border-blue-200 text-blue-600" 
          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
      )}
    >
      <Icon size={20} className={cn("mb-1.5", active ? "text-blue-500" : "text-slate-500")} />
      <span className="text-[10px] font-bold tracking-tight text-center leading-tight">{label}</span>
    </Link>
  );
}
