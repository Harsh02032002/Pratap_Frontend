import React, { useEffect, useMemo, useState } from "react";
import TrialGuard from "./TrialGuard";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, 
  BedDouble, 
  ClipboardList, 
  CalendarCheck, 
  MessageCircle, 
  User, 
  Settings, 
  CreditCard, 
  MapPin, 
  MessageSquare, 
  ChevronDown, 
  UserCircle, 
  LogOut, 
  Home, 
  X, 
  Plus, 
  Menu, 
  Bell, 
  Settings2,
  Search, Lock, ChevronRight, Crown, Zap, Users, BookOpen, FileText, Smartphone, Wallet, PieChart, Shield, Target, Navigation, Megaphone, Coffee, Receipt, Sparkles, LinkIcon, UserPlus, AlertCircle, Calendar, HelpCircle, Building2, Image as ImageIcon } from "lucide-react";
import { SILVER_NAV, GOLD_NAV } from './navConfig';
import { fetchOwnerProperties } from "../../utils/propertyowner";
import { getStaffPanelNav, filterNotificationsForStaff, hasStaffPermission } from "../../utils/staffAccess";
import { cacheGet, cacheSet, cacheInvalidate } from "../../utils/cache";
import PropertyOwnerMobileLayout from "./PropertyOwnerMobileLayout";

const DEFAULT_DESKTOP_ITEMS = [
  { href: "/propertyowner/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/propertyowner/rooms", label: "Rooms", icon: BedDouble },
  { href: "/propertyowner/room-photos", label: "Room Photos", icon: ImageIcon },
  { href: "/propertyowner/tenantrec", label: "Tenant Records", icon: ClipboardList },
  { href: "/propertyowner/booking_request", label: "Booking Requests", icon: CalendarCheck },
  { href: "/propertyowner/ownerchat", label: "Chat", icon: MessageCircle },
  { href: "/propertyowner/ownerprofile", label: "Profile", icon: User },
  { href: "/propertyowner/settings", label: "Settings", icon: Settings }
];

const FULL_NAV_ITEMS = [
  { href: "/propertyowner/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/propertyowner/rooms", label: "Rooms", icon: BedDouble },
  { href: "/propertyowner/room-photos", label: "Room Photos", icon: ImageIcon },
  { href: "/propertyowner/tenantrec", label: "Tenant Records", icon: ClipboardList },
  { href: "/propertyowner/payment", label: "Payments", icon: CreditCard },
  { href: "/propertyowner/booking_request", label: "Booking Requests", icon: CalendarCheck },
  { href: "/propertyowner/ownerchat", label: "Chat", icon: MessageCircle },
  { href: "/propertyowner/ownerprofile", label: "Profile", icon: User },
  { href: "/propertyowner/settings", label: "Settings", icon: Settings }
];

const SETTINGS_DESKTOP_ITEMS = [
  { href: "/propertyowner/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/propertyowner/rooms", label: "Rooms", icon: BedDouble },
  { href: "/propertyowner/room-photos", label: "Room Photos", icon: ImageIcon },
  { href: "/propertyowner/tenantrec", label: "Tenant Records", icon: ClipboardList },
  { href: "/propertyowner/payment", label: "Payments", icon: CreditCard },
  { href: "#", label: "Chat", icon: MessageSquare, disabled: true },
  { href: "/propertyowner/ownerprofile", label: "Profile", icon: User },
  { href: "/propertyowner/settings", label: "Settings", icon: Settings }
];

const CHAT_DESKTOP_ITEMS = [
  { href: "/propertyowner/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/propertyowner/rooms", label: "Rooms", icon: BedDouble },
  { href: "/propertyowner/room-photos", label: "Room Photos", icon: ImageIcon },
  { href: "/propertyowner/tenantrec", label: "Tenant Records", icon: ClipboardList },
  { href: "/propertyowner/payment", label: "Payments", icon: CreditCard },
  { href: "/propertyowner/ownerchat", label: "Chat", icon: MessageSquare },
  { href: "/propertyowner/ownerprofile", label: "Profile", icon: User },
  { href: "/propertyowner/settings", label: "Settings", icon: Settings }
];

const isActivePath = (pathname, href) => href !== "#" && (pathname === href || pathname.startsWith(`${href}/`));

const joinClassNames = (...values) => values.filter(Boolean).join(" ");

export function getPropertyOwnerNavConfig(variant = "default") {
  switch (variant) {
    case "full":
      return { desktopItems: FULL_NAV_ITEMS, mobileItems: FULL_NAV_ITEMS };
    case "settings":
      return { desktopItems: SETTINGS_DESKTOP_ITEMS, mobileItems: FULL_NAV_ITEMS };
    case "chat":
      return { desktopItems: CHAT_DESKTOP_ITEMS, mobileItems: CHAT_DESKTOP_ITEMS };
    default:
      return { desktopItems: DEFAULT_DESKTOP_ITEMS, mobileItems: FULL_NAV_ITEMS };
  }
}

const cn = (...classes) => classes.filter(Boolean).join(" ");

const _NOTIF_TTL = 2 * 60 * 1000; // 2 minutes — shared with notifications.jsx page

export default function PropertyOwnerLayout({
  owner,
  title,
  children,
  mainClassName = "flex-1 overflow-y-auto p-6 md:p-8",
  contentClassName = "",
  headerRight = null,
  actions = null,
  navVariant = "default",
  headerVariant = "default",
  notificationCount = 0,
  notifications = [],
  showNotificationSettings = false,
  onNotificationSettingsClick,
  onLogout,
  disableSubmenuStrip = false,
  rooms,
  loading,
  skipNotificationFetch = false,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('gold');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [properties, setProperties] = useState([]);
  const [activePropertyId, setActivePropertyId] = useState('all');
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 1024 : false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('propertyowner_subscription_tier', 'gold');
    const storedActive = localStorage.getItem('owner_active_property');
    if (storedActive) {
      setActivePropertyId(storedActive);
    }
  }, []);

  useEffect(() => {
    if (owner?.loginId) {
      fetchOwnerProperties(owner.loginId, true).then(props => {
        setProperties(props || []);
      }).catch(err => console.error("Failed to fetch properties for switcher", err));
    }
  }, [owner?.loginId]);

  const handlePropertySwitch = (propId) => {
    localStorage.setItem('owner_active_property', propId);
    setActivePropertyId(propId);
    setSwitcherOpen(false);
    window.location.reload();
  };

  // Staff are locked to their assigned property: they cannot pick "All Properties"
  // and only see that one hostel. Owners are unrestricted.
  const isStaffProxy = !!owner?.isStaffProxy;

  // Header "Add Quick" actions. `perm` gates the action for staff (owner sees all);
  // `staffTo` re-points staff at their own screen where one exists. perm:null =
  // owner-only (never shown to staff).
  const QUICK_ACTIONS = [
    { label: "Add Tenant",      icon: UserPlus,   color: "text-blue-600",    to: "/propertyowner/tenantrec",         perm: "Tenants" },
    { label: "Collect Rent",    icon: Wallet,     color: "text-emerald-600", to: "/propertyowner/payment",           perm: "Rent Collection" },
    { label: "Add Complaint",   icon: AlertCircle,color: "text-rose-600",    to: "/propertyowner/complaints",        staffTo: "/propertyowner/staff-complaints", perm: "Complaints" },
    { label: "Add Expense",     icon: Receipt,    color: "text-amber-600",   to: "/propertyowner/expense-tracking",  perm: null },
    { label: "Add Property",    icon: Building2,  color: "text-indigo-600",  to: "/propertyowner/add-property",      perm: "Properties" },
    { label: "Book Bed",        icon: Calendar,   color: "text-violet-600",  to: "/propertyowner/booking",           perm: "Bookings" },
    { label: "Send Reminder",   icon: Bell,       color: "text-orange-600",  to: "/propertyowner/ownerchat",         perm: null },
    { label: "Generate Receipt",icon: Receipt,    color: "text-slate-600",   to: "/propertyowner/receipts",          perm: null },
  ];
  const visibleQuickActions = isStaffProxy
    ? QUICK_ACTIONS.filter(a => a.perm && hasStaffPermission(owner, a.perm)).map(a => ({ ...a, to: a.staffTo || a.to }))
    : QUICK_ACTIONS;
  const assignedPropId = owner?.assignedProperty ? String(owner.assignedProperty) : "";
  const switcherProperties = (isStaffProxy && assignedPropId)
    ? properties.filter(p => String(p._id || p.id) === assignedPropId)
    : properties;
  const allowAllProperties = !isStaffProxy;

  useEffect(() => {
    if (!isStaffProxy || !assignedPropId) return;
    if (activePropertyId !== assignedPropId) {
      localStorage.setItem('owner_active_property', assignedPropId);
      setActivePropertyId(assignedPropId);
    }
  }, [isStaffProxy, assignedPropId, activePropertyId]);

  const [globalNotifications, setGlobalNotifications] = useState([]);
  
  useEffect(() => {
    if (!owner?.loginId) return;
    // If the dashboard (or parent page) already passed notifications via props, use them
    // and skip the independent API call — the dashboard aggregation already fetched them.
    if (skipNotificationFetch) return;

    const isStaff = !!owner?.isStaffProxy;
    const staffId = owner?.staffLoginId;

    const fetchNotifs = async () => {
      const cacheKey = `notifications:${isStaff ? (staffId || owner.loginId) : owner.loginId}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        setGlobalNotifications(cached);
        return;
      }
      try {
        const { fetchJson } = await import("../../utils/api");
        // A staff proxy pulls TWO feeds: their own (notifications addressed directly
        // to them, e.g. an assigned task) plus the owner feed (role-relevant items,
        // filtered downstream). Owners just pull their own.
        const targets = isStaff && staffId
          ? [{ id: staffId, own: true }, { id: owner.loginId, own: false }]
          : [{ id: owner.loginId, own: false }];

        const lists = await Promise.all(
          targets.map((t) =>
            fetchJson(`/api/notifications?toLoginId=${encodeURIComponent(t.id)}`)
              .then((r) => (Array.isArray(r) ? r.map((n) => ({ ...n, _ownFeed: t.own })) : []))
              .catch(() => [])
          )
        );

        const seen = new Set();
        const formatted = lists.flat().map(n => {
          const meta = typeof n.meta === 'string' ? JSON.parse(n.meta) : (n.meta || {});
          return {
            ...n,
            title: meta.title || n.title || "Notification",
            message: meta.message || n.message || "",
            type: n.type || "system",
            meta: meta
          };
        }).filter((n) => {
          const key = String(n._id || `${n.title}-${n.message}`);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        cacheSet(cacheKey, formatted, _NOTIF_TTL);
        setGlobalNotifications(formatted);
      } catch (e) {
        console.error("Failed to fetch global notifications", e);
      }
    };
    fetchNotifs();
  }, [owner?.loginId, owner?.isStaffProxy, owner?.staffLoginId, skipNotificationFetch]);

  const rawNotifications = globalNotifications.length > 0 ? globalNotifications : notifications;
  // Staff share the owner's feed via the proxy session — route only what belongs
  // to them (never owner-sensitive cash/OTP/financial notifications).
  const displayNotifications = owner?.isStaffProxy
    ? filterNotificationsForStaff(owner, rawNotifications)
    : rawNotifications;
  const displayNotificationCount = owner?.isStaffProxy
    ? displayNotifications.filter(n => !n.read).length
    : (globalNotifications.length > 0 ? globalNotifications.filter(n => !n.read).length : notificationCount);

  // Staff members share this exact panel, but see only a permission-filtered
  // navigation. Owners get the full nav. This is what makes it a single panel.
  const CURRENT_NAV = useMemo(
    () => (owner?.isStaffProxy ? getStaffPanelNav(owner) : GOLD_NAV),
    [owner]
  );

  const handleParentClick = (e, item) => {
    if (subscriptionTier === 'silver' && item.goldOnly) {
      e.preventDefault();
      setShowUpgradeModal(true);
      return;
    }
    if (item.submenus) {
      e.preventDefault();
      setExpandedMenus(prev => ({ [item.label]: !prev[item.label] }));
    } else {
      if (window.innerWidth < 1024) setMobileOpen(false);
    }
  };

  const handleSubLinkClick = (e, sub) => {
    if (subscriptionTier === 'silver' && sub.goldOnly) {
      e.preventDefault();
      setShowUpgradeModal(true);
      return;
    }
    if (window.innerWidth < 1024) setMobileOpen(false);
  };
  const [profileOpen, setProfileOpen] = useState(false);
  const navConfig = useMemo(() => getPropertyOwnerNavConfig(navVariant), [navVariant]);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationOpen(false);
    setProfileOpen(false);
    
    // Auto-expand the active section's menu so it doesn't collapse
    const activeParent = CURRENT_NAV.find(item => 
      item.href === pathname || 
      (item.submenus && item.submenus.some(sub => sub.href === pathname))
    );
    if (activeParent) {
      setExpandedMenus(prev => ({ ...prev, [activeParent.label]: true }));
    }
  }, [pathname, CURRENT_NAV]);

  const displayName = useMemo(() => owner?.name || owner?.ownerName || "Owner", [owner]);
  const ownerInitial = useMemo(() => String(displayName).charAt(0).toUpperCase() || "O", [displayName]);
  const displayLoginId = useMemo(() => owner?.managerLoginId || owner?.loginId, [owner]);
  const accountRole = useMemo(() => owner?.role === 'manager' ? 'Property Manager' : 'Property Owner', [owner]);
  const accountLabel = useMemo(() => (displayLoginId ? `Account: ${displayLoginId}` : accountRole), [displayLoginId, accountRole]);

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    try {
      sessionStorage.removeItem("owner_session");
      localStorage.removeItem("owner_session");
      sessionStorage.removeItem("owner_user");
      localStorage.removeItem("owner_user");
      sessionStorage.removeItem("manager_user");
      localStorage.removeItem("managerData");
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
    } catch (_) {
      // ignore
    }
    window.location.href = "/propertyowner/ownerlogin";
  };


  const renderDynamicNavItem = (item) => {
    const isParentActive = isActivePath(pathname, item.href) || 
      (item.submenus && item.submenus.some(sub => isActivePath(pathname, sub.href)));
    const isParentLocked = subscriptionTier === 'silver' && item.goldOnly;
    const isExpanded = expandedMenus[item.label];

    return (
      <div key={item.label} className="space-y-1">
        <Link
          to={item.href || '#'}
          onClick={(e) => handleParentClick(e, item)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group cursor-pointer',
            isParentActive 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50',
            isParentLocked && 'opacity-60 hover:opacity-100'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {item.icon ? <item.icon size={18} className={cn(isParentActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} /> : <span className="w-[18px]" />}
            <span className="font-bold text-sm truncate">{item.label}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {isParentLocked && <Lock size={12} className="text-yellow-500 shrink-0" />}
            {!isParentLocked && item.submenus && (
              <ChevronRight 
                size={14} 
                className={cn('text-slate-500 transition-transform duration-300', isExpanded && 'rotate-90 text-white')} 
              />
            )}
          </div>
        </Link>

        {isExpanded && item.submenus && (
          <div className="pl-6 space-y-1 mt-1 border-l-2 border-slate-700 ml-6">
            {item.submenus.map((sub) => {
              const isSubActive = isActivePath(pathname, sub.href);
              const isSubLocked = subscriptionTier === 'silver' && sub.goldOnly;

              return (
                <Link
                  key={sub.label}
                  to={sub.href}
                  onClick={(e) => handleSubLinkClick(e, sub)}
                  className={cn(
                    'flex items-center justify-between py-2 px-4 rounded-lg text-xs font-bold transition-all',
                    isSubActive 
                      ? 'bg-slate-800 text-white' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50',
                    isSubLocked && 'opacity-60 hover:opacity-100'
                  )}
                >
                  <span className="truncate">{sub.label}</span>
                  {isSubLocked && <Lock size={10} className="text-yellow-500 shrink-0" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const bellButton = (
    <div className="relative">
      <button
        id="notificationBellBtn"
        type="button"
        className={joinClassNames(
          "relative text-slate-400 hover:text-slate-600 transition-colors",
          headerVariant === "default" && "p-2 hover:bg-gray-100 rounded-lg"
        )}
        onClick={() => setNotificationOpen((prev) => !prev)}
      >
        <Bell className="w-5 h-5" />
        {displayNotificationCount > 0 ? (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {displayNotificationCount}
          </span>
        ) : headerVariant === "compact" ? (
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></span>
        ) : null}
      </button>
      <div
        id="notificationDropdown"
        className={joinClassNames(
          "absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-2 ring-1 ring-black ring-opacity-5 z-50",
          notificationOpen ? "block" : "hidden"
        )}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
        </div>
        <div id="notificationList" className="max-h-96 overflow-y-auto custom-scrollbar">
          {displayNotifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              <p>No notifications yet</p>
            </div>
          ) : (
            displayNotifications.map((item, index) => (
              <div key={`${item.title || item.message || "notification"}-${index}`} className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                <p className="text-sm font-bold text-gray-800">{item.title || item.meta?.title || (item.type ? item.type.replace(/_/g, ' ').toUpperCase() : "Notification")}</p>
                <p className="text-xs text-gray-600 mt-1">{item.message || item.meta?.message || (item.type === 'user_filter_match' ? 'A user is viewing properties matching your profile.' : "New update from system")}</p>
                {item.meta?.chatEnabled && (
                  <div className="mt-3 flex gap-2">
                    <Link 
                      to={`/propertyowner/ownerchat?user=${item.meta?.userLoginId || ''}${item.meta?.bookingId ? `&booking=${item.meta.bookingId}` : ''}`} 
                      className="text-[10px] bg-[#EE4266] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#d63a5b] transition-all flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" /> Enable Chat
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const profileMenu = (
    <div className="relative">
      <button
        type="button"
        className={joinClassNames(
          "flex items-center gap-3",
          headerVariant === "compact"
            ? "max-w-xs text-sm rounded-full focus:outline-none"
            : "hover:bg-gray-50 p-1.5 rounded-full transition-colors"
        )}
        onClick={() => setProfileOpen((prev) => !prev)}
      >
        <div
          id={headerVariant === "compact" ? "headerAvatar" : "headerAvatar"}
          className={joinClassNames(
            headerVariant === "compact" ? "h-9 w-9 text-purple-700" : "w-8 h-8 text-purple-600",
            "rounded-full bg-purple-100 flex items-center justify-center font-bold border border-purple-200"
          )}
        >
          {ownerInitial}
        </div>
        {headerVariant === "compact" ? (
          <div className="hidden md:block text-left">
            <p id="headerOwnerName" className="text-xs font-bold text-gray-800">{displayName}</p>
            <p id="headerOwnerId" className="text-[10px] text-gray-500">{`ID: ${owner?.loginId || "..."}`}</p>
          </div>
        ) : (
          <div className="text-left hidden sm:block">
            <p id="headerName" className="text-xs font-semibold text-gray-700">{displayName}</p>
            <p id="headerAccountId" className="text-[10px] text-gray-500">{accountLabel}</p>
          </div>
        )}
        <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
      </button>
      <div
        className={joinClassNames(
          "absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50",
          profileOpen ? "block" : "hidden"
        )}
      >
        {headerVariant === "compact" && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{`ID: ${owner?.loginId || "..."}`}</p>
          </div>
        )}
        {!owner?.isStaffProxy && (
          <Link to="/propertyowner/ownerprofile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            <UserCircle className="w-4 h-4 inline mr-2" />
            {headerVariant === "compact" ? "Your Profile" : "Profile"}
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4 inline mr-2" />
          Logout
        </button>
      </div>
    </div>
  );

  const renderMobileSidebar = () => {
    if (headerVariant === "compact" && navVariant === "chat") {
      return (
        <>
          <div
            id="mobile-sidebar-overlay"
            className={joinClassNames("fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm", mobileOpen ? "block" : "hidden")}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            id="mobile-sidebar"
            className={joinClassNames(
              "fixed inset-y-0 left-0 w-72 bg-[#0f172a] z-40 transition-transform duration-300 md:hidden flex flex-col shadow-2xl",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
              <div className="flex flex-col items-center gap-0 text-white font-bold">
                <span className="text-xl font-black tracking-tighter">ROOMHY<span className="text-teal-500">.com</span></span>
              </div>
              <button id="mobile-sidebar-close" type="button" className="p-2 text-gray-400 hover:text-white" onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
              {CURRENT_NAV.map(renderDynamicNavItem)}
            </nav>
          </aside>
        </>
      );
    }

    return (
      <div className={joinClassNames("md:hidden fixed inset-0 z-50", mobileOpen ? "flex" : "hidden")}>
        <button type="button" className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
        <aside className="w-72 flex-shrink-0 bg-[#0f172a] text-slate-400 flex flex-col relative z-10 shadow-2xl overflow-hidden">
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#0f172a]">
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tighter">ROOMHY<span className="text-teal-500">.com</span></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OWNER PANEL</span>
            </div>
            <button type="button" className="p-2 text-slate-400 hover:text-white" onClick={() => setMobileOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
            {CURRENT_NAV.map(renderDynamicNavItem)}
          </nav>
        </aside>
      </div>
    );
  };

  if (isMobile) {
    return (
      <PropertyOwnerMobileLayout
        owner={owner}
        title={title === "Dashboard" ? "" : title}
        mainClassName="flex-1 overflow-y-auto p-0 pb-24"
        contentClassName={contentClassName}
        headerRight={headerRight}
        notificationCount={displayNotificationCount}
        notifications={displayNotifications}
        onLogout={onLogout || handleLogout}
        disableSubmenuStrip={disableSubmenuStrip}
        properties={switcherProperties}
        activePropertyId={activePropertyId}
        handlePropertySwitch={handlePropertySwitch}
        allowAllProperties={allowAllProperties}
        rooms={rooms}
        loading={loading}
        navItems={owner?.isStaffProxy ? CURRENT_NAV : null}
      >
        {children}
      </PropertyOwnerMobileLayout>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
      {/* Sidebar - EXACT Superadmin Style */}
      <aside className={joinClassNames(
        "w-72 h-screen bg-[#0F172A] text-slate-300 flex flex-col z-50 shrink-0 transition-transform duration-300",
        mobileOpen ? "fixed left-0 top-0 translate-x-0" : "fixed left-0 top-0 -translate-x-full lg:relative lg:translate-x-0"
      )}>
        {/* Profile Header in Sidebar (Property Switcher) */}
        {owner?.role !== 'manager' ? (
          <div className="relative p-4 shrink-0 border-b border-slate-800/50">
            <button 
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-2xl transition-all border",
                activePropertyId !== 'all' 
                  ? "border-blue-500/30 bg-blue-500/10" 
                  : "border-slate-700/50 hover:bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 shadow-lg shrink-0 transition-colors",
                  activePropertyId !== 'all' ? "bg-blue-600 border-blue-400 shadow-blue-600/20" : "bg-slate-700 border-slate-600 shadow-slate-900/20"
                )}>
                  {activePropertyId !== 'all' ? <Building2 size={18} /> : ownerInitial}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <p className="text-sm font-bold text-white leading-none truncate">
                    {activePropertyId === 'all' 
                      ? displayName 
                      : (properties.find(p => String(p._id || p.id) === activePropertyId)?.title || displayName)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest truncate">
                    {activePropertyId === 'all' ? "All Properties" : "Active Property"}
                  </p>
                </div>
              </div>
              <ChevronDown size={16} className={cn("text-slate-500 shrink-0 transition-transform", switcherOpen && "rotate-180")} />
            </button>

            {/* Switcher Dropdown */}
            <div className={cn(
              "absolute left-4 right-4 top-full mt-2 bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 overflow-hidden transition-all transform origin-top",
              switcherOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
            )}>
              <div className="px-4 py-2 border-b border-slate-700/50 mb-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Switch Context</h3>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                {allowAllProperties && (
                  <>
                    <button
                      onClick={() => handlePropertySwitch('all')}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors text-left",
                        activePropertyId === 'all' ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <LayoutDashboard size={16} className={activePropertyId === 'all' ? "text-blue-400" : "text-slate-500"} />
                        <span>All Properties (Overview)</span>
                      </div>
                      {activePropertyId === 'all' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </button>

                    <div className="my-2 border-t border-slate-700/50"></div>
                  </>
                )}

                {switcherProperties.map(p => {
                  const pId = String(p._id || p.id);
                  const isActive = activePropertyId === pId;
                  return (
                    <button
                      key={pId}
                      onClick={() => handlePropertySwitch(pId)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors text-left mb-1 last:mb-0",
                        isActive ? "bg-blue-500/20 text-blue-400" : "text-slate-300 hover:bg-slate-800"
                      )}
                    >
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate">{p.title || p.name || "Property"}</span>
                        <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{p.city || p.area || "No Location"}</span>
                      </div>
                      {isActive && <div className="w-2 h-2 shrink-0 rounded-full bg-blue-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white/10 shadow-lg shadow-blue-600/20">
              {ownerInitial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-none truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest truncate opacity-60">Property Manager</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 space-y-0.5 custom-scrollbar pb-6">
          {CURRENT_NAV.map(renderDynamicNavItem)}

          <div className="pt-4 mt-4 border-t border-slate-800/50">
             <button 
               onClick={handleLogout}
               className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all group"
             >
                <LogOut size={18} />
                <span className="text-sm font-bold">Logout</span>
             </button>
          </div>
        </nav>

        {/* Sidebar Footer Card */}
        <div className="p-4 mt-auto shrink-0">
           <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-800 shadow-xl">
              <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-tight">Roomhy Hub</h4>
              <p className="text-[10px] text-slate-500 mb-4 leading-tight font-medium">Access owner resources and support documentation</p>
              <button className="w-full py-2.5 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                View Resources
              </button>
           </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Global Header - EXACT Superadmin Style */}
        <header className="h-16 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              aria-label="Open Menu"
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <h2 className="hidden md:block text-lg font-black text-slate-900 tracking-tight">{title}</h2>
          </div>

          <div className="flex items-center gap-3">
            {(actions || headerRight) && (
              <div className="flex items-center gap-2">
                {actions || headerRight}
              </div>
            )}
            {/* Search Box */}
            {/* Quick Actions Dropdown — permission-filtered for staff */}
            {visibleQuickActions.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm font-bold">
                  <Plus size={16} />
                  <span className="hidden sm:inline">Add Quick</span>
                  <ChevronDown size={14} className="opacity-70" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all -translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">
                  <div className="p-2 space-y-1">
                    {visibleQuickActions.map((a) => {
                      const Icon = a.icon;
                      return (
                        <button key={a.label} onClick={() => navigate(a.to)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-600 font-medium transition-colors">
                          <Icon size={16} className={a.color} /> {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Search Box */}
            <div className="hidden lg:flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 w-72 group focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500 transition-all">
              <Search size={16} className="text-slate-400 group-focus-within:text-blue-600" />
              <input 
                type="text" 
                placeholder="Search..." 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // navigate to global search or just alert for now since we don't have a search page
                    console.log("Searching for:", e.target.value);
                  }
                }}
                className="bg-transparent border-none outline-none text-xs font-bold ml-3 w-full text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Messages — owner chat, hidden for staff */}
            {!isStaffProxy && (
              <button aria-label="Messages" onClick={() => navigate("/propertyowner/ownerchat")} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative group hidden sm:block">
                <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            )}

            {/* Help Center → owner complaints, or the staff complaints screen for staff (hidden if they lack it) */}
            {(!isStaffProxy || hasStaffPermission(owner, "Complaints")) && (
              <button title="Complaints/Help" onClick={() => navigate(isStaffProxy ? "/propertyowner/staff-complaints" : "/propertyowner/complaints")} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative group hidden sm:block">
                <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            )}

            <div className="relative">
              <button 
                aria-label="Notifications"
                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative group"
                onClick={() => setNotificationOpen(!notificationOpen)}
              >
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                {displayNotificationCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                )}
              </button>
              
              {/* Notifications Dropdown */}
              <div className={cn(
                "absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 overflow-hidden transition-all transform origin-top-right",
                notificationOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
              )}>
                <div className="px-5 py-2 border-b border-slate-50 mb-2 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                  {displayNotifications.length > 0 && (
                    <button 
                      onClick={async () => {
                        // Clear notifications visually and invalidate shared cache
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
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {displayNotifications.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <Bell className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No messages yet</p>
                    </div>
                  ) : (
                    displayNotifications.map((n, i) => (
                      <div key={i} className="px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer">
                        <p className="text-[11px] font-bold text-slate-900 leading-tight mb-1">{n.title}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-50 bg-slate-50/50">
                  <button 
                    onClick={() => {
                      setNotificationOpen(false);
                      navigate("/propertyowner/notifications");
                    }}
                    className="w-full py-2 text-center text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors bg-white border border-slate-100 rounded-xl shadow-sm block"
                  >
                    See All Notifications
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Identity */}
            <div className="flex items-center gap-4 pl-6 border-l border-slate-100 group cursor-pointer relative" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none group-hover:text-blue-600 transition-colors">{displayName}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">ID: {owner?.loginId || "..."}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                {ownerInitial}
              </div>
              <div className={cn("absolute top-full right-0 mt-4 w-48 bg-white rounded-xl shadow-xl border border-slate-100 transition-all z-50 overflow-hidden", profileOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2")}>
                <div className="p-2 space-y-1">
                  {/* Profile Settings is an owner-only screen — hidden for staff */}
                  {!owner?.isStaffProxy && (
                    <button onClick={() => navigate("/propertyowner/ownerprofile")} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-600 font-medium transition-colors">Profile Settings</button>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 rounded-lg text-sm font-medium transition-colors">Log Out</button>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className={cn("flex-1 overflow-y-auto custom-scrollbar bg-background p-8", mainClassName)}>
          <TrialGuard owner={owner}>
            <div className={contentClassName}>{children}</div>
          </TrialGuard>
        </main>

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
