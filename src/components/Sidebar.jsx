import React, { useState } from "react";
import { 
  LayoutDashboard, Users, Building2, Wallet, 
  MessageSquare, BarChart3, Calendar, Star, 
  Headphones, Settings, LogOut,
  X, ClipboardCheck
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogoutDialog } from "./superadmin/LogoutDialog";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const MAIN_NAV = [
  { label: "Overview", id: "dashboard", icon: LayoutDashboard, path: "/superadmin/superadmin" },
  { label: "User Management", id: "user_management", icon: Users, path: "/superadmin/user-overview" },
  { label: "Property Management", id: "property_management", icon: Building2, path: "/superadmin/property-overview" },
  { label: "Accounting", id: "accounting", icon: Wallet, path: "/superadmin/accounting" },
  { label: "Chat Management", id: "chat_management", icon: MessageSquare, path: "/superadmin/superchat" },
  { label: "Visit Report", id: "visits", icon: ClipboardCheck, path: "/superadmin/visit" },
  { label: "Reports", id: "report_analytics", icon: BarChart3, path: "/superadmin/reports" },
  { label: "Bookings", id: "booking_leads", icon: Calendar, path: "/superadmin/booking" },
  { label: "Reviews", id: "review", icon: Star, path: "/superadmin/reviews" },
  { label: "Support", id: "support", icon: Headphones, path: "/superadmin/complaint-history" },
  { label: "Settings", id: "settings", icon: Settings, path: "/superadmin/settings" },
];

export function Sidebar({ open, isMobile, onClose, onLogout, activeModuleId, setActiveModuleId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      sessionStorage.clear();
      localStorage.clear();
      navigate("/superadmin/index");
    }
  };

  // Determine current active main module based on route
  const currentPath = (location.pathname || "").toLowerCase();
  let currentActiveId = activeModuleId;
  
  if (!currentActiveId || activeModuleId === "dashboard") {
    if (
      currentPath.includes("user") || 
      currentPath.includes("owner") || 
      currentPath.includes("tenant") || 
      currentPath.includes("roles") || 
      currentPath.includes("log") || 
      currentPath.includes("manager") ||
      currentPath.includes("kyc") ||
      currentPath.includes("agreements")
    ) {
      currentActiveId = "user_management";
    } else if (currentPath.includes("property") || currentPath.includes("rooms") || currentPath.includes("enquiry") || currentPath.includes("amenities")) {
      currentActiveId = "property_management";
    } else if (currentPath.includes("accounting") || currentPath.includes("refund") || currentPath.includes("revenue") || currentPath.includes("payout") || currentPath.includes("cashflow")) {
      currentActiveId = "accounting";
    } else if (currentPath.includes("chat") || currentPath.includes("superchat")) {
      currentActiveId = "chat_management";
    } else if (currentPath.includes("visit")) {
      currentActiveId = "visits";
    } else if (currentPath.includes("reports") || currentPath.includes("report")) {
      currentActiveId = "report_analytics";
    } else if (currentPath.includes("booking") || currentPath.includes("direct-bookings")) {
      currentActiveId = "booking_leads";
    } else if (currentPath.includes("review")) {
      currentActiveId = "review";
    } else if (currentPath.includes("complaint") || currentPath.includes("support")) {
      currentActiveId = "support";
    } else if (currentPath.includes("setting")) {
      currentActiveId = "settings";
    } else {
      currentActiveId = "dashboard";
    }
  }

  const sidebarClasses = cn(
    "w-[240px] min-w-[240px] xl:w-[260px] xl:min-w-[260px] h-screen bg-[#0F2A2E] text-[#C9DADD] flex flex-col z-50 shrink-0 transition-all duration-300 font-['Plus_Jakarta_Sans',sans-serif]",
    isMobile ? "fixed left-0 top-0 shadow-2xl" : "relative",
    isMobile && !open ? "-translate-x-full" : "translate-x-0"
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobile && open && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity" 
        />
      )}

      <aside className={sidebarClasses}>
        {/* Brand / Logo Header */}
        <div className="pt-5 pb-4 px-6 flex items-center justify-center relative shrink-0">
          <div className="flex flex-col items-center select-none">
            {/* Teal Roof Icon over "OO" */}
            <svg className="w-5 h-2.5 text-[#00A79D] ml-[44px] -mb-[3px]" viewBox="0 0 16 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 7L8 1L15 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="flex items-baseline leading-none">
              <span className="font-extrabold text-[24px] text-[#00A79D] tracking-tight font-sans">ROOMHY</span>
              <span className="font-bold text-[15px] text-white tracking-normal ml-[1px]">.com</span>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="absolute right-4 text-[#C9DADD] hover:text-white p-1 rounded-lg hover:bg-[#17434A] transition-colors"
              aria-label="Close sidebar"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          )}
        </div>

        {/* Navigation List - Main Modules Only */}
        <nav className="flex-1 overflow-y-auto px-0 space-y-[2px] custom-sidebar-scrollbar py-2">
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = currentActiveId === item.id;

            return (
              <div key={item.id} className="my-[2px] mx-[12px]">
                <div
                  onClick={() => {
                    if (setActiveModuleId) setActiveModuleId(item.id);
                    if (item.path) navigate(item.path);
                    if (isMobile && onClose) onClose();
                  }}
                  className={cn(
                    "w-full h-[44px] px-[14px] rounded-[8px] flex items-center justify-between transition-colors duration-150 cursor-pointer group select-none font-['Plus_Jakarta_Sans',sans-serif] text-[14px] font-medium",
                    isActive
                      ? "bg-[#0E7C86] text-white font-semibold"
                      : "text-[#C9DADD] hover:bg-[#17434A] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-[12px] min-w-0">
                    {Icon && (
                      <Icon
                        size={20}
                        strokeWidth={1.8}
                        className={cn(
                          "shrink-0 transition-colors",
                          isActive ? "text-white" : "text-[#C9DADD] group-hover:text-white"
                        )}
                      />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout Action at Bottom */}
        <div className="pb-5 pt-2 shrink-0 border-t border-[#17434A]/40">
          <div className="mx-[12px] my-[2px]">
            <button 
              onClick={() => setShowLogoutDialog(true)}
              className="w-full h-[44px] px-[14px] rounded-[8px] flex items-center gap-[12px] text-[#C9DADD] hover:bg-[#17434A] hover:text-white transition-colors duration-150 font-['Plus_Jakarta_Sans',sans-serif] text-[14px] font-medium group cursor-pointer"
            >
              <LogOut size={20} strokeWidth={1.8} className="shrink-0 text-[#C9DADD] group-hover:text-white transition-colors" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog 
        open={showLogoutDialog} 
        onClose={() => setShowLogoutDialog(false)} 
        onConfirm={handleLogout} 
      />
    </>
  );
}

export default Sidebar;
