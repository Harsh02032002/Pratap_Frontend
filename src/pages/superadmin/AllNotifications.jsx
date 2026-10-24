import React, { useEffect, useState, useMemo } from "react";
import { 
  Bell, Check, Trash2, IndianRupee, UserCheck, AlertTriangle, 
  Info, RefreshCw, Loader2, Calendar, ClipboardCheck, ArrowUpRight, MessageSquare
} from "lucide-react";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function AllNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);

  // Resolve current user from session or local storage
  const user = useMemo(() => {
    try {
      const isEmpPath = typeof window !== "undefined" && window.location.pathname.startsWith("/employee");
      const raw = isEmpPath
        ? (
            sessionStorage.getItem("staff_user") ||
            sessionStorage.getItem("manager_user") ||
            localStorage.getItem("staff_user") ||
            localStorage.getItem("manager_user") ||
            sessionStorage.getItem("user") ||
            localStorage.getItem("user") ||
            "{}"
          )
        : (
            sessionStorage.getItem("manager_user") ||
            sessionStorage.getItem("user") ||
            localStorage.getItem("staff_user") ||
            localStorage.getItem("manager_user") ||
            localStorage.getItem("user") ||
            "{}"
          );
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }, []);

  const loginId = useMemo(() => {
    const isEmpPath = typeof window !== "undefined" && window.location.pathname.startsWith("/employee");
    const roleLower = String(user?.role || "").toLowerCase();
    const isSuperAdmin = !isEmpPath && (roleLower === "superadmin" || roleLower === "admin");
    return isSuperAdmin ? "superadmin" : String(user?.loginId || "").trim();
  }, [user]);

  const loadData = async () => {
    if (!loginId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Fetch notifications filtered by recipient's loginId
      const res = await fetchJson(`/api/notifications?toLoginId=${encodeURIComponent(loginId)}`);
      if (Array.isArray(res)) {
        const formatted = res.map(n => {
          const meta = typeof n.meta === 'string' ? JSON.parse(n.meta) : (n.meta || {});
          return {
            id: n._id,
            type: n.type || "system",
            title: meta.title || n.title || getDefaultTitle(n.type),
            msg: meta.message || n.message || getDefaultMessage(n.type, meta),
            time: new Date(n.createdAt).toLocaleString(),
            read: n.read,
            raw: n
          };
        });
        setNotifications(formatted);
      }
    } catch (err) { 
      console.error("Failed to load notifications:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (loginId) loadData(); 
  }, [loginId]);

  const getDefaultTitle = (type) => {
    switch (type) {
      case "new_booking": return "New Booking Received 🎉";
      case "new_enquiry": return "New Property Enquiry ✉️";
      case "owner_new_booking_request": return "New Booking Request";
      case "owner_new_chat": return "New Message";
      case "chat_violation": return "⚠️ Chat Policy Violation Detected";
      default: return "System Alert";
    }
  };

  const getDefaultMessage = (type, meta) => {
    switch (type) {
      case "new_booking":
        return `Guest ${meta.guestName || "User"} booked ${meta.propertyName || "Property"} for INR ${meta.amount || 0}`;
      case "new_enquiry":
        return `Enquiry from ${meta.userName || "User"} on ${meta.propertyName || "Property"}: "${meta.message || ""}"`;
      case "chat_violation":
        return meta.message || "A chat policy violation attempt was detected between owner and tenant.";
      default:
        return "You have a new alert on your Roomhy dashboard.";
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await fetchJson('/api/notifications/mark-all-read', {
        method: 'PUT',
        body: JSON.stringify({ toLoginId: loginId })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await fetchJson(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      // Opt-out from backend if delete endpoint is missing, filter in UI
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === "all") return true;
      if (activeTab === "unread") return !n.read;
      if (activeTab === "bookings") return n.type === "new_booking" || n.type === "owner_new_booking_request";
      if (activeTab === "enquiries") return n.type === "new_enquiry";
      if (activeTab === "alerts") return !["new_booking", "new_enquiry", "owner_new_booking_request"].includes(n.type);
      return true;
    });
  }, [notifications, activeTab]);

  const getIcon = (type) => {
    switch (type) {
      case "new_booking":
      case "owner_new_booking_request":
        return <IndianRupee size={16} className="text-emerald-600" />;
      case "new_enquiry":
        return <MessageSquare size={16} className="text-blue-600" />;
      case "complaint":
      case "chat_violation":
        return <AlertTriangle size={16} className="text-rose-600" />;
      default:
        return <Info size={16} className="text-slate-600" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "new_booking":
      case "owner_new_booking_request":
        return "bg-emerald-50 border-emerald-100";
      case "new_enquiry":
        return "bg-blue-50 border-blue-100";
      case "complaint":
      case "chat_violation":
        return "bg-rose-50 border-rose-100";
      default:
        return "bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="p-8 space-y-10 bg-[#F8FAFC] min-h-full font-inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifications Hub</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Real-time governance pulse, system alerts & stakeholder actions</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleMarkAllRead}
            disabled={markingAll || notifications.filter(n => !n.read).length === 0}
            className="px-6 py-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {markingAll ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Mark all read
          </button>
          <button onClick={loadData} className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-blue-600 transition-all active:scale-95">
             <RefreshCw className={cn("w-4.5 h-4.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        {[
          { id: "all", label: "All Events" },
          { id: "unread", label: "Unread" },
          { id: "bookings", label: "Bookings" },
          { id: "enquiries", label: "Enquiries" },
          { id: "alerts", label: "Alerts" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                : "text-slate-400 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Feed Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="py-32 text-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Querying Event Log...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-32 text-center">
              <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No notifications in this ledger</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "p-6 flex items-start gap-5 transition-all hover:bg-slate-50/50",
                  !item.read ? "bg-blue-50/10" : ""
                )}
              >
                {/* Icon Wrapper */}
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", getIconBg(item.type))}>
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      {item.title}
                      {!item.read && <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 shadow-sm" />}
                    </h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">{item.msg}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-center">
                  {!item.read && (
                    <button 
                      onClick={() => handleMarkSingleRead(item.id)}
                      className="p-2 rounded-lg bg-white border border-slate-100 text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteNotification(item.id)}
                    className="p-2 rounded-lg bg-white border border-slate-100 text-rose-500 hover:bg-rose-50 transition-colors shadow-sm"
                    title="Dismiss"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
