import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, Outlet, useNavigate } from "react-router-dom";
import { resolveSectionFromPath, sharedNavConfig } from "./sharedNavConfig";
import { Menu, Search, Bell, ChevronRight, X, MessageSquare, Building2, HelpCircle, Plus, ChevronDown, UserPlus, Wallet, AlertCircle, Calendar, Receipt, Smartphone } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { SubNavPanel } from "./SubNavPanel";
import { fetchJson } from "../utils/api";
import { requestNotificationPermission, showNativeNotification } from "../utils/notificationManager";
import NotificationPromptBanner from "./NotificationPromptBanner";
import AdminNotificationPrompt from "./AdminNotificationPrompt";
import { getModuleActionPermissions } from "../utils/employeePermissions";

const SAFE_BUTTON_TEXT_RE = /^(all|active|inactive|pending|verified|approved|rejected|published|overview|details|view|view details|preview|cancel|close|back|next|prev|previous|reset|clear|refresh|retry|filter|filters|search|export|export csv|export excel|download|print|ok|got it|\d+|✕|×)$/i;

const DELETE_ACTION_RE = /\b(delete|remove|trash|destroy|permanent\s*delete|bulk\s*delete|clear\s+all)\b/i;

const CREATE_ACTION_RE = /(^\+\s*\S+)|\b(add\s+new|add\s+property|add\s+tenant|add\s+owner|add\s+staff|add\s+employee|add\s+member|add\s+role|new\s+role|create\s+role|add\s+room|add\s+category|add\s+amenity|add\s+location|add\s+city|add\s+area|add\s+charge|add\s+record|create\s+new|create\s+property|create\s+user|create\s+ticket|record\s+payment|submit\s+visit|new\s+visit|add\s+visit|generate\s+invoice|new\s+entry|add\s+expense|add\s+payout)\b/i;

const EDIT_ACTION_RE = /\b(edit|update|modify|save|save\s+changes|save\s+settings|save\s+details|approve|bulk\s*approve|reject|bulk\s*reject|verify|deactivate|activate|enable|disable|block|unblock|suspend|assign|reassign|resolve|escalate|moderate|publish|unpublish|process\s+payout|initiate\s+refund|approve\s+refund|reject\s+refund|send\s+payout|mark\s+paid|mark\s+as|change\s+status|reset\s+password|feature|unfeature)\b/i;

function classifyCrudElement(el) {
  if (!el || !(el instanceof HTMLElement)) return null;
  if (el.dataset.crudIgnore === "true" || el.closest("[data-crud-ignore='true']")) return null;
  const explicit = String(el.dataset.crudAction || "").toLowerCase();
  if (explicit === "create" || explicit === "edit" || explicit === "delete") return explicit;

  if (el.getAttribute("role") === "tab") return null;

  const rawText = String(el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  const title = String(el.getAttribute("title") || el.dataset.originalCrudTitle || "").trim();
  const ariaLabel = String(el.getAttribute("aria-label") || "").trim();
  const href = String(el.getAttribute("href") || "").toLowerCase();
  const combined = [rawText, title, ariaLabel].filter(Boolean).join(" ");

  const hasTrashIcon = Boolean(
    el.querySelector("svg.lucide-trash, svg.lucide-trash-2, svg.lucide-trash2, [data-lucide='trash'], [data-lucide='trash-2']")
  );
  const hasPlusIcon = Boolean(
    el.querySelector("svg.lucide-plus, svg.lucide-user-plus, svg.lucide-plus-circle, svg.lucide-circle-plus, svg.lucide-file-plus, [data-lucide='plus'], [data-lucide='user-plus']")
  );
  const hasEditIcon = Boolean(
    el.querySelector("svg.lucide-edit, svg.lucide-edit-2, svg.lucide-edit-3, svg.lucide-pencil, svg.lucide-square-pen, svg.lucide-pen, svg.lucide-save, svg.lucide-user-cog, [data-lucide='edit'], [data-lucide='pencil'], [data-lucide='save']")
  );

  if (!hasTrashIcon && !hasPlusIcon && !hasEditIcon && SAFE_BUTTON_TEXT_RE.test(rawText)) {
    return null;
  }

  if (hasTrashIcon || DELETE_ACTION_RE.test(combined)) {
    return "delete";
  }

  if (
    href.includes("/add-owner") ||
    href.includes("/add-tenant") ||
    href.includes("/add-property") ||
    CREATE_ACTION_RE.test(rawText) ||
    CREATE_ACTION_RE.test(combined) ||
    (hasPlusIcon && (!rawText || /\b(add|new|create|record)\b/i.test(combined)))
  ) {
    return "create";
  }

  if (hasEditIcon || EDIT_ACTION_RE.test(combined)) {
    return "edit";
  }

  if (String(el.getAttribute("type") || "").toLowerCase() === "submit") {
    const formOrDialog = el.closest("form, [role='dialog']");
    const headingText = String(formOrDialog?.querySelector("h1, h2, h3, h4")?.textContent || "");
    if (/\b(add|create|new|record)\b/i.test(headingText)) return "create";
    return "edit";
  }

  return null;
}

export default function SharedShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const pathName = location.pathname || "";
  const isEmbed = useMemo(() => {
    try {
      return new URLSearchParams(location.search || "").get("embed") === "1";
    } catch (e) {
      return false;
    }
  }, [location.search]);
  const section = useMemo(
    () => resolveSectionFromPath(location.pathname),
    [location.pathname]
  );
  const config = section ? sharedNavConfig[section] : null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const resolveUser = () => {
    try {
      return JSON.parse(
        sessionStorage.getItem("manager_user") ||
        sessionStorage.getItem("user") ||
        localStorage.getItem("staff_user") ||
        localStorage.getItem("manager_user") ||
        localStorage.getItem("user") ||
        "{}"
      );
    } catch {
      return {};
    }
  };
  const [user, setUser] = useState(resolveUser);
  useEffect(() => {
    const syncUser = () => setUser(resolveUser());
    window.addEventListener("roomhy-access-updated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("roomhy-access-updated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [location.pathname]);

  const userName = user?.name || "User";
  const roleLower = String(user?.role || "").toLowerCase();
  const userRole = (roleLower === "employee" || roleLower === "areamanager" || roleLower === "manager") 
    ? (user?.team || "Area Admin") 
    : (user?.role || "Superadmin");
  const initial = userName.charAt(0).toUpperCase();

  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [seenNotifIds, setSeenNotifIds] = useState(new Set());

  const fetchRecentNotifications = async () => {
    try {
      const loginId = (user?.role === 'superadmin' || user?.role === 'admin') ? "superadmin" : (user?.loginId || "superadmin");
      const data = await fetchJson(`/api/notifications?toLoginId=${encodeURIComponent(loginId)}`);
      if (Array.isArray(data)) {
        const formatted = data.map(n => {
          const meta = typeof n.meta === 'string' ? (JSON.parse(n.meta) || {}) : (n.meta || {});
          
          let title = n.title || n.subject || meta.title || meta.subject || '';
          let msg = n.message || n.msg || meta.message || meta.body || meta.description || '';

          // Rich fallback title generation based on event type & meta
          if (!title || title === "System Alert") {
            if (meta.TicketID || n.type === 'ticket') {
              title = `🎫 Support Ticket: ${meta.TicketID || 'New Ticket'}`;
            } else if (n.type === 'visit_report' || meta.VisitID || n.type === 'new_enquiry') {
              title = `📋 Visit Report: ${meta.propertyName || meta.Property || meta.VisitID || 'Property Visit'}`;
            } else if (n.type === 'owner_kyc' || n.type === 'new_signup') {
              title = `🏢 Owner Registration: ${meta.userName || meta.OwnerName || meta.firstName || 'New User'}`;
            } else if (n.type === 'website_enquiry' || n.type === 'contact_us') {
              title = `💬 Website Inquiry: ${meta.Name || meta.userName || n.from || 'User Message'}`;
            } else if (n.type === 'payment_success' || n.type === 'booking') {
              title = `💳 Payment / Booking: ${meta.Amount || 'Payment Received'}`;
            } else {
              title = `🔔 Roomhy ${String(n.type || 'System').toUpperCase()} Alert`;
            }
          }

          // Rich fallback message generation based on meta fields
          if (!msg || msg === "You have a new notification") {
            const parts = [];
            if (meta.RaisedBy || meta.userName || meta.Name) parts.push(`By: ${meta.RaisedBy || meta.userName || meta.Name}`);
            if (meta.Type) parts.push(`Type: ${meta.Type}`);
            if (meta.Property || meta.propertyName) parts.push(`Property: ${meta.Property || meta.propertyName}`);
            if (meta.Location || meta.city) parts.push(`Location: ${meta.Location || meta.city}`);
            if (meta.Amount) parts.push(`Amount: ${meta.Amount}`);
            if (meta.SubmittedBy) parts.push(`Staff: ${meta.SubmittedBy}`);
            if (meta.Phone) parts.push(`Phone: ${meta.Phone}`);

            msg = parts.length > 0 ? parts.join(' • ') : `New update received from ${n.from || 'system'}.`;
          }

          return {
            id: n._id,
            type: n.type || "system",
            title,
            msg,
            time: new Date(n.createdAt).toLocaleDateString(),
            read: n.read
          };
        });

        // Live pop-up for brand new unread notifications
        setSeenNotifIds(prevSeen => {
          if (prevSeen.size > 0) {
            const newUnreads = formatted.filter(n => !n.read && !prevSeen.has(n.id));
            newUnreads.forEach(n => {
              showNativeNotification(n.title, { body: n.msg });
            });
          }
          const updated = new Set(prevSeen);
          formatted.forEach(n => updated.add(n.id));
          return updated;
        });

        setNotifications(formatted.slice(0, 6));
        setUnreadCount(formatted.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications in header:", err);
    }
  };

  useEffect(() => {
    fetchRecentNotifications();
    // Every 10s while the tab is visible, as before. In a background tab only
    // every 6th tick (60s) — not stopped entirely, because this poll is also
    // what raises the native desktop pop-up for new notifications while the
    // user is on another tab. Coming back to the tab refreshes immediately.
    let hiddenTicks = 0;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        hiddenTicks += 1;
        if (hiddenTicks % 6 !== 0) return;
      } else {
        hiddenTicks = 0;
      }
      fetchRecentNotifications();
    }, 10000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchRecentNotifications();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?.loginId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const [activeModuleId, setActiveModuleId] = useState(null);

  useEffect(() => {
    setActiveModuleId(null);
  }, [location.pathname]);

  const isStaffUser = roleLower === "employee" || roleLower === "areamanager";
  const currentModuleCrud = useMemo(
    () => getModuleActionPermissions(user, location.pathname),
    [user, location.pathname]
  );

  useEffect(() => {
    const root = mainContentRef.current;
    if (!root) return undefined;

    const applyCrudButtonStates = () => {
      const elements = root.querySelectorAll("button, a[href], input[type='submit'], [role='button']");
      elements.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;

        if (!isStaffUser) {
          if (el.dataset.crudDisabled === "true") {
            if ("disabled" in el) el.disabled = false;
            el.removeAttribute("aria-disabled");
            delete el.dataset.crudDisabled;
            delete el.dataset.crudBlockedAction;
            el.classList.remove("opacity-50", "cursor-not-allowed");
            if (el.dataset.originalCrudTitle !== undefined) {
              if (el.dataset.originalCrudTitle) el.setAttribute("title", el.dataset.originalCrudTitle);
              else el.removeAttribute("title");
              delete el.dataset.originalCrudTitle;
            }
          }
          return;
        }

        const action = classifyCrudElement(el);
        if (!action) return;

        const isAllowed =
          action === "create"
            ? Boolean(currentModuleCrud.create)
            : action === "edit"
              ? Boolean(currentModuleCrud.edit)
              : action === "delete"
                ? Boolean(currentModuleCrud.delete)
                : true;

        if (!isAllowed) {
          if (el.dataset.crudDisabled !== "true") {
            el.dataset.originalCrudTitle = el.getAttribute("title") || "";
          }
          if ("disabled" in el) el.disabled = true;
          el.setAttribute("aria-disabled", "true");
          el.dataset.crudDisabled = "true";
          el.dataset.crudBlockedAction = action;
          el.classList.add("opacity-50", "cursor-not-allowed");
          const label = action.charAt(0).toUpperCase() + action.slice(1);
          el.setAttribute("title", `${label} permission is disabled for your role in this module`);
        } else if (el.dataset.crudDisabled === "true") {
          if ("disabled" in el) el.disabled = false;
          el.removeAttribute("aria-disabled");
          delete el.dataset.crudDisabled;
          delete el.dataset.crudBlockedAction;
          el.classList.remove("opacity-50", "cursor-not-allowed");
          if (el.dataset.originalCrudTitle !== undefined) {
            if (el.dataset.originalCrudTitle) el.setAttribute("title", el.dataset.originalCrudTitle);
            else el.removeAttribute("title");
            delete el.dataset.originalCrudTitle;
          }
        }
      });
    };

    applyCrudButtonStates();

    let rafId = null;
    const observer = new MutationObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(applyCrudButtonStates);
    });
    observer.observe(root, { childList: true, subtree: true });

    const handleBlockedClick = (e) => {
      if (!isStaffUser) return;
      const target = e.target instanceof Element
        ? e.target.closest("button, a[href], input[type='submit'], [role='button']")
        : null;
      if (!target || !(target instanceof HTMLElement)) return;
      const blockedAction = target.dataset.crudBlockedAction || classifyCrudElement(target);
      if (!blockedAction) return;
      const allowed =
        blockedAction === "create"
          ? Boolean(currentModuleCrud.create)
          : blockedAction === "edit"
            ? Boolean(currentModuleCrud.edit)
            : blockedAction === "delete"
              ? Boolean(currentModuleCrud.delete)
              : true;
      if (!allowed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    root.addEventListener("click", handleBlockedClick, true);
    root.addEventListener("submit", handleBlockedClick, true);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      root.removeEventListener("click", handleBlockedClick, true);
      root.removeEventListener("submit", handleBlockedClick, true);
    };
  }, [isStaffUser, currentModuleCrud, location.pathname]);

  if (isEmbed) return <Outlet />;
  if (!config) return <div className="shared-shell"><Outlet /></div>;

  if (section === "superadmin" || section === "employee") {
    return (
      <div className="flex h-screen w-full bg-[#F4F6F8] overflow-hidden font-sans text-[#10242A]">
        <Sidebar 
          open={sidebarOpen} 
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)} 
          activeModuleId={activeModuleId}
          setActiveModuleId={setActiveModuleId}
          onLogout={() => {
            const role = String(user?.role || "").toLowerCase();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = (role === "employee" || role === "areamanager" || role === "manager") ? "/employee/index" : "/superadmin/index";
          }}
        />

        {/* Main Workspace Column to the right of Primary Dark Sidebar */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Global Header (Design Spec Section 3: 72px high, white, bottom border 1px #E1E6EA, padding 0 32px) */}
          <header className="h-[72px] bg-white border-b border-[#E1E6EA] flex items-center justify-between px-[32px] z-30 shrink-0">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              
              {/* Search Field - Design Spec Section 3: 44px high, radius 8px, border 1px #CBD3D9 */}
              <div className="hidden md:flex items-center bg-white border border-[#CBD3D9] rounded-[8px] px-3.5 h-[44px] w-96 focus-within:border-[#0E7C86] focus-within:ring-1 focus-within:ring-[#0E7C86] transition-all">
                <Search size={17} className="text-[#4A5961] shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search users, properties, bookings..." 
                  className="bg-transparent border-none outline-none text-sm ml-2.5 w-full text-[#10242A] placeholder:text-[#708088]"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Push Notifications Button - Only shown when permission is not granted */}
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <button
                  onClick={async () => {
                    const res = await requestNotificationPermission(user?.loginId || 'superadmin');
                    if (res?.status === 'granted') {
                      showNativeNotification("🔔 Push Notifications Activated!", {
                        body: "You will now receive instant push alerts for complaints & updates."
                      });
                      window.location.reload();
                    }
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
                  title="Click to allow browser push notifications"
                >
                  <Bell size={14} className="animate-bounce" />
                  <span>Enable Push Notifications</span>
                </button>
              )}

              {/* Messages */}
              <button onClick={() => navigate(section === "employee" ? "/employee/superchat" : "/superadmin/superchat")} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative group hidden sm:block">
                <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    if (!notifDropdownOpen) {
                      fetchRecentNotifications();
                    }
                  }}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative group"
                >
                  <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                  )}
                </button>

                {notifDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setNotifDropdownOpen(false)} 
                    />
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Alerts</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{unreadCount} unread</span>
                        )}
                      </div>

                      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                        <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-[11px] font-medium text-amber-900">Enable Phone Push Alerts</span>
                          </div>
                          <button
                            onClick={async () => {
                              await requestNotificationPermission(user?.loginId || 'superadmin');
                              setNotifDropdownOpen(false);
                            }}
                            className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg transition-colors shrink-0"
                          >
                            Enable
                          </button>
                        </div>
                      )}
                      
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs font-medium">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-blue-600' : 'bg-transparent'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{n.msg}</p>
                                <span className="text-[9px] font-bold text-slate-400 mt-1 block uppercase">{n.time}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2 border-t border-slate-50 bg-slate-50/50">
                        <button 
                          onClick={() => {
                            setNotifDropdownOpen(false);
                            navigate(section === "superadmin" ? "/superadmin/notifications" : "/employee/notifications");
                          }}
                          className="w-full py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors bg-white border border-slate-100 rounded-xl shadow-sm block"
                        >
                          All Notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Help Center */}
              <button onClick={() => navigate(section === "employee" ? "/employee/complaint-history" : "/superadmin/complaint-history")} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative group hidden sm:block">
                <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              {/* Profile Identity - Screenshot Style */}
              <div className="flex items-center gap-4 pl-6 border-l border-slate-100 group cursor-pointer relative">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-[#0E7C86] transition-colors">{userName}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">{userRole}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0F2A2E] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#0F2A2E]/20 group-hover:scale-105 transition-transform">
                  {initial}
                </div>
                <div className="absolute top-full right-0 mt-4 w-48 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all -translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">
                  <div className="p-2 space-y-1">
                    <button onClick={() => navigate(section === "employee" ? "/employee/settings" : "/superadmin/settings")} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm text-slate-600 font-medium transition-colors">Profile Settings</button>
                    <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = section === "employee" ? "/employee/index" : "/superadmin/index"; }} className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 rounded-lg text-sm font-medium transition-colors">Log Out</button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Row Container Below Header: SubNavPanel + Main Content Area */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Secondary Sub-navigation Sidebar Panel (Below Header) */}
            {!isMobile && <SubNavPanel activeModuleId={activeModuleId} />}

            {/* Main Content Area */}
            <main ref={mainContentRef} className="flex-1 min-w-0 overflow-y-auto custom-scrollbar p-6 lg:px-[32px] lg:pt-[18px] lg:pb-[24px] bg-[#F4F6F8]">
              <div className="w-full max-w-[1600px] mx-auto">
                <Outlet />
              </div>
            </main>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <NotificationPromptBanner userLoginId={user?.loginId} />
      </div>
    );
  }

  // Fallback for other sections
  return (
    <div className="shared-shell h-screen flex overflow-hidden">
      <aside className={`w-64 bg-slate-900 text-white shrink-0 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative z-50 h-full`}>
        <div className="p-6 text-xl font-bold border-b border-white/10">{config.title}</div>
        <nav className="p-4 space-y-1">
          {config.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <NotificationPromptBanner userLoginId={user?.loginId} />
      </div>
    </div>
  );
}

