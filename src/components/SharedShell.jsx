import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, Outlet, useNavigate } from "react-router-dom";
import { resolveSectionFromPath, sharedNavConfig } from "./sharedNavConfig";
import { Menu, Search, Bell, ChevronRight, X, MessageSquare, Building2, HelpCircle, Plus, ChevronDown, UserPlus, Wallet, AlertCircle, Calendar, Receipt } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { fetchJson } from "../utils/api";

export default function SharedShell() {
  const location = useLocation();
  const navigate = useNavigate();
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
  const user = resolveUser();
  const userName = user?.name || "User";
  const roleLower = String(user?.role || "").toLowerCase();
  const userRole = (roleLower === "employee" || roleLower === "areamanager" || roleLower === "manager") 
    ? (user?.team || "Area Admin") 
    : (user?.role || "Superadmin");
  const initial = userName.charAt(0).toUpperCase();

  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchRecentNotifications = async () => {
    try {
      const loginId = user?.loginId || "superadmin";
      const data = await fetchJson(`/api/notifications?toLoginId=${encodeURIComponent(loginId)}`);
      if (Array.isArray(data)) {
        const formatted = data.map(n => {
          const meta = typeof n.meta === 'string' ? JSON.parse(n.meta) : (n.meta || {});
          return {
            id: n._id,
            type: n.type || "system",
            title: meta.title || n.title || "System Alert",
            msg: meta.message || n.message || "You have a new notification",
            time: new Date(n.createdAt).toLocaleDateString(),
            read: n.read
          };
        });
        setNotifications(formatted.slice(0, 4));
        setUnreadCount(formatted.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error("Error fetching notifications in header:", err);
    }
  };

  useEffect(() => {
    if (user?.loginId) {
      fetchRecentNotifications();
      const interval = setInterval(fetchRecentNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.loginId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1024px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (isEmbed) return <Outlet />;
  if (!config) return <div className="shared-shell"><Outlet /></div>;

  if (section === "superadmin" || section === "employee") {
    return (
      <div className="flex h-screen w-full bg-white overflow-hidden font-inter">
        <Sidebar 
          open={sidebarOpen} 
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)} 
          onLogout={() => {
            const role = String(user?.role || "").toLowerCase();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = (role === "employee" || role === "areamanager" || role === "manager") ? "/employee/index" : "/superadmin/index";
          }}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Global Header - Screenshot Perfect */}
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-30 shrink-0">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              
              {/* Search Matrix */}
              <div className="hidden md:flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 w-96 group focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500 transition-all">
                <Search size={18} className="text-slate-400 group-focus-within:text-blue-600" />
                <input 
                  type="text" 
                  placeholder="Search anything..." 
                  className="bg-transparent border-none outline-none text-sm font-medium ml-3 w-full text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
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
                  <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-blue-600 transition-colors">{userName}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-60">{userRole}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
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

          <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <Outlet />
          </main>
        </div>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}
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
      </div>
    </div>
  );
}
