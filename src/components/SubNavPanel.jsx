import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const SUB_NAV_CONFIG = {
  home: {
    title: "Home",
    sections: [
      {
        header: "OVERVIEW",
        items: [
          { label: "Overview", path: "/superadmin/home-overview" },
          { label: "Total Properties", path: "/superadmin/total-properties" },
          { label: "Total Tenants", path: "/superadmin/tenant" },
          { label: "Revenue Overview", path: "/superadmin/home/revenue-overview" },
          { label: "Alerts (Pending Rent)", path: "/superadmin/rentcollection" },
        ],
      },
    ],
  },
  user_management: {
    title: "User Management",
    sections: [
      {
        header: "",
        items: [
          { label: "Overview", path: "/superadmin/user-overview" },
        ],
      },
      {
        header: "TEAM MANAGEMENT",
        items: [
          { label: "All Staff", path: "/superadmin/manager" },
          { label: "Roles & Permissions", path: "/superadmin/roles-permissions" },
        ],
      },
      {
        header: "ATTENDANCE",
        items: [
          { label: "Daily Logs", path: "/superadmin/log" },
          { label: "Leave", path: "/superadmin/attendance-leave" },
          { label: "Shifts", path: "/superadmin/attendance-shifts" },
        ],
      },
      {
        header: "PROPERTY OWNERS",
        items: [
          { label: "View All Owners", path: "/superadmin/owner" },
          { label: "Add Owner", path: "/superadmin/add-owner" },
          { label: "Approved / Pending", path: "/superadmin/owner-pending" },
          { label: "KYC / Documents", path: "/superadmin/kyc_verification" },
          { label: "Agreements", path: "/superadmin/agreements" },
          { label: "Owner Requests", path: "/superadmin/owner-requests" },
          { label: "Owner Subscriptions", path: "/superadmin/owner-subscriptions" },
        ],
      },
    ],
  },
  property_management: {
    title: "Property Management",
    sections: [
      {
        header: "PROPERTIES",
        items: [
          { label: "Overview", path: "/superadmin/property-overview" },
          { label: "Total Properties", path: "/superadmin/total-properties" },
          { label: "Add Property", path: "/superadmin/add-property" },
          { label: "Approve / Reject Properties", path: "/superadmin/property/approvals" },
          { label: "Pending Properties", path: "/superadmin/property/pending" },
          { label: "Rooms Management", path: "/superadmin/rooms" },
          { label: "Online Leads", path: "/superadmin/enquiry" },
          { label: "Property Categories", path: "/superadmin/property/categories" },
        ],
      },
    ],
  },
  accounting: {
    title: "Accounting",
    sections: [
      {
        header: "OVERVIEW",
        items: [
          { label: "Overview", path: "/superadmin/accounting" },
          { label: "Revenue Overview", path: "/superadmin/accounting-overview" },
        ],
      },
      {
        header: "TENANT ACCOUNTS",
        items: [
          { label: "Payment History", path: "/superadmin/accounting/transactions" },
          { label: "Other Charges", path: "/superadmin/accounting/other-charges" },
          { label: "Payment Tracking", path: "/superadmin/accounting/tracking" },
        ],
      },
      {
        header: "OWNER PAYOUT",
        items: [
          { label: "Owner Payouts", path: "/superadmin/accounting/payouts" },
          { label: "Pending Payouts", path: "/superadmin/accounting/payouts/pending" },
          { label: "Cash Received Details", path: "/superadmin/accounting/payouts/cash-received" },
          { label: "Failed Payout Alerts", path: "/superadmin/accounting/payouts/failed" },
        ],
      },
      {
        header: "REFUNDS",
        items: [
          { label: "Booking Amount Refund", path: "/superadmin/refund/booking" },
          { label: "Partial Refund", path: "/superadmin/refund/partial" },
          { label: "Refund Approval System", path: "/superadmin/refund/approvals" },
          { label: "Refund History", path: "/superadmin/refund/history" },
        ],
      },
      {
        header: "ANALYTICS",
        items: [
          { label: "Roomhy Monthly Revenue", path: "/superadmin/accounting/reports/roomhy-revenue" },
          { label: "Owners Monthly Revenue", path: "/superadmin/accounting/reports/owner-revenue" },
          { label: "Due Rents", path: "/superadmin/accounting/reports/due-rents" },
          { label: "Profit / Loss Report", path: "/superadmin/accounting/reports/profit-loss" },
          { label: "Cashflow Dashboard", path: "/superadmin/accounting/reports/cashflow" },
          { label: "Transaction Reports", path: "/superadmin/accounting/reports/transactions" },
        ],
      },
    ],
  },
  chat_management: {
    title: "Chat Management",
    sections: [
      {
        header: "CONVERSATIONS",
        items: [
          { label: "Live Conversations", path: "/superadmin/superchat" },
          { label: "Alerts & Violations", path: "/superadmin/chat/alerts" },
        ],
      },
    ],
  },
  visits: {
    title: "Visit Reports",
    sections: [
      {
        header: "VISIT REPORTS",
        items: [
          { label: "All Visit Reports", path: "/superadmin/visit" },
        ],
      },
    ],
  },
  report_analytics: {
    title: "Reports",
    sections: [
      {
        header: "REPORTS",
        items: [
          { label: "Overview", path: "/superadmin/reports" },
          { label: "Property Performance", path: "/superadmin/reports/performance" },
          { label: "Location Wise Data", path: "/superadmin/reports/locations" },
          { label: "Occupancy Rate", path: "/superadmin/reports/occupancy" },
          { label: "Growth Analytics", path: "/superadmin/reports/growth" },
          { label: "Staff Performance Reports", path: "/superadmin/reports/staff" },
          { label: "Revenue Report", path: "/superadmin/reports/revenue" },
        ],
      },
    ],
  },
  booking_leads: {
    title: "Bookings",
    sections: [
      {
        header: "BOOKINGS & LEADS",
        items: [
          { label: "Overview", path: "/superadmin/booking" },
          { label: "Total Leads", path: "/superadmin/booking/leads" },
          { label: "Bookings", path: "/superadmin/direct-bookings" },
          { label: "Conversion Rate", path: "/superadmin/booking/conversion" },
          { label: "Top Performing Locations", path: "/superadmin/booking/locations" },
        ],
      },
    ],
  },
  review: {
    title: "Reviews",
    sections: [
      {
        header: "REVIEWS",
        items: [
          { label: "Overview", path: "/superadmin/reviews" },
          { label: "All Reviews", path: "/superadmin/reviews/all" },
          { label: "Moderation", path: "/superadmin/reviews/moderation" },
          { label: "Analytics", path: "/superadmin/reviews/analytics" },
          { label: "New Review Feed", path: "/superadmin/reviews/new" },
        ],
      },
    ],
  },
  support: {
    title: "Support",
    sections: [
      {
        header: "SUPPORT",
        items: [
          { label: "Overview", path: "/superadmin/complaint-history" },
          { label: "Tenants Complaints", path: "/superadmin/complaints/tenants" },
          { label: "Owners Complaints", path: "/superadmin/complaints/owners" },
          { label: "Website Queries", path: "/superadmin/support/website-queries" },
          { label: "Verification System", path: "/superadmin/support/tickets" },
          { label: "Issues Resolution Tracking", path: "/superadmin/support/resolution" },
        ],
      },
    ],
  },
  settings: {
    title: "Settings",
    sections: [
      {
        header: "SETTINGS",
        items: [
          { label: "General Settings", path: "/superadmin/settings" },
        ],
      },
    ],
  },
};

function detectActiveModuleId(pathname, activeModuleIdProp) {
  const path = (pathname || "").toLowerCase();
  
  if (path.includes("complaint") || path.includes("support") || path.includes("tickets") || path.includes("website-queries") || path.includes("resolution")) {
    return "support";
  }
  if (path.includes("review") || path.includes("reviews")) {
    return "review";
  }
  if (path.includes("superchat") || path.includes("chat")) {
    return "chat_management";
  }
  if (path.includes("visit")) {
    return null; // Visit Report has no sub-modules
  }
  if (
    path.startsWith("/superadmin/accounting") || 
    path.includes("accounting") ||
    path.includes("refund") || 
    path.includes("payout") || 
    path.includes("cashflow") || 
    path.includes("profit-loss")
  ) {
    return "accounting";
  }
  if (path.startsWith("/superadmin/reports") || path.includes("/reports/")) {
    return "report_analytics";
  }
  if (path.includes("booking") || path.includes("direct-bookings")) {
    return "booking_leads";
  }
  if (path.includes("reports") || path.includes("report")) {
    return "report_analytics";
  }
  if (path.includes("property") || path.includes("total-properties") || path.includes("rooms") || path.includes("enquiry") || path.includes("add-property") || path.includes("amenities")) {
    return "property_management";
  }
  if (path.includes("user") || path.includes("owner") || path.includes("tenant") || path.includes("roles") || path.includes("log") || path.includes("manager") || path.includes("add-tenant") || path.includes("kyc") || path.includes("attendance") || path.includes("agreements") || path.includes("add-owner")) {
    return "user_management";
  }
  if (path.includes("setting") || path.includes("settings")) {
    return "settings";
  }
  if (path.includes("home") || path.includes("rentcollection")) {
    return "home";
  }
  if (activeModuleIdProp && SUB_NAV_CONFIG[activeModuleIdProp]) {
    return activeModuleIdProp;
  }
  return null;
}

export function SubNavPanel({ activeModuleId }) {
  const location = useLocation();
  const navigate = useNavigate();

  const targetModuleId = detectActiveModuleId(location.pathname, activeModuleId);
  const moduleConfig = SUB_NAV_CONFIG[targetModuleId];
  if (!moduleConfig) return null;

  const currentPath = location.pathname + location.search;

  return (
    <aside className="w-[230px] min-w-[230px] xl:w-[250px] xl:min-w-[250px] h-full bg-white border-r border-[#E1E6EA] flex flex-col shrink-0 z-40 transition-all duration-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sections and Items */}
      <div className="flex-1 overflow-y-auto px-3 pt-5 pb-4 space-y-3 custom-sidebar-scrollbar">
        {moduleConfig.sections.map((section, sIdx) => (
          <div key={sIdx} className={cn("space-y-1", sIdx > 0 && "mt-3")}>
            {section.header && (
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#708088] tracking-[0.12em] uppercase select-none font-['Plus_Jakarta_Sans',sans-serif]">
                {section.header}
              </div>
            )}

            <div className="space-y-[1px]">
              {section.items.map((item, iIdx) => {
                const isActive =
                  currentPath === item.path ||
                  location.pathname === item.path ||
                  (item.path.includes("?") && location.pathname + location.search === item.path);

                const hasLeftBorder = isActive && item.label !== "Overview";

                return (
                  <button
                    key={iIdx}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full text-left px-3 h-[36px] flex items-center rounded-[8px] text-[13px] font-medium transition-colors duration-150 cursor-pointer block truncate select-none border-l-[3.5px]",
                      isActive
                        ? "bg-[#E6F4F5] text-[#0E7C86] font-bold"
                        : "text-[#4A5961] hover:bg-[#F4F6F8] hover:text-[#10242A]",
                      hasLeftBorder ? "border-[#0E7C86]" : "border-transparent"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default SubNavPanel;
