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
      {
        header: "TENANTS",
        items: [
          { label: "View All Tenants", path: "/superadmin/tenant" },
          { label: "Add Tenant", path: "/superadmin/add-tenant" },
          { label: "KYC / Documents", path: "/superadmin/kyc_verification" },
          { label: "Request KYC Approve", path: "/superadmin/tenant-kyc-requests" },
          { label: "Rent History", path: "/superadmin/rentcollection" },
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
          { label: "Revenue Overview", path: "/superadmin/home/revenue-overview" },
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
  if (activeModuleIdProp && SUB_NAV_CONFIG[activeModuleIdProp]) {
    return activeModuleIdProp;
  }
  const path = (pathname || "").toLowerCase();
  
  if (path.includes("user") || path.includes("owner") || path.includes("tenant") || path.includes("roles") || path.includes("log") || path.includes("manager") || path.includes("add-tenant") || path.includes("kyc") || path.includes("attendance") || path.includes("agreements") || path.includes("add-owner")) {
    return "user_management";
  }
  if (path.includes("property") || path.includes("total-properties") || path.includes("rooms") || path.includes("enquiry") || path.includes("add-property")) {
    return "property_management";
  }
  if (path.includes("accounting") || path.includes("refund") || path.includes("revenue") || path.includes("payout") || path.includes("cashflow") || path.includes("profit-loss")) {
    return "accounting";
  }
  if (path.includes("superchat") || path.includes("chat")) {
    return "chat_management";
  }
  if (path.includes("visit")) {
    return "visits";
  }
  if (path.includes("reports") || path.includes("report")) {
    return "report_analytics";
  }
  if (path.includes("booking") || path.includes("direct-bookings")) {
    return "booking_leads";
  }
  if (path.includes("review") || path.includes("reviews")) {
    return "review";
  }
  if (path.includes("complaint") || path.includes("support") || path.includes("tickets") || path.includes("resolution")) {
    return "support";
  }
  if (path.includes("setting") || path.includes("settings")) {
    return "settings";
  }
  if (path.includes("home") || path.includes("rentcollection")) {
    return "home";
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
    <aside className="w-[210px] min-w-[210px] xl:w-[230px] xl:min-w-[230px] h-screen bg-white border-r border-[#E1E6EA] flex flex-col shrink-0 z-40 font-['Plus_Jakarta_Sans',sans-serif] transition-all duration-300">
      {/* Sections and Items */}
      <div className="flex-1 overflow-y-auto px-3 pt-5 pb-4 space-y-5 custom-sidebar-scrollbar">
        {moduleConfig.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.header && (
              <div className="text-[11px] font-bold text-[#4A5961] uppercase tracking-[0.05em] px-3 py-1">
                {section.header}
              </div>
            )}
            <div className="space-y-[2px]">
              {section.items.map((item, iIdx) => {
                const isActive =
                  currentPath === item.path ||
                  location.pathname === item.path ||
                  (item.path.includes("?") && location.pathname + location.search === item.path);

                return (
                  <button
                    key={iIdx}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-[8px] text-[13.5px] font-medium transition-colors duration-150 cursor-pointer block truncate select-none",
                      isActive
                        ? "bg-[#E6F4F5] text-[#0E7C86] font-semibold"
                        : "text-[#4A5961] hover:bg-[#F4F6F8] hover:text-[#10242A]"
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
