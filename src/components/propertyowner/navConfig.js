import {
  LayoutDashboard, BedDouble, Users, CalendarCheck, MessageCircle,
  User, Settings, MapPin, FileText, Building2, PlusCircle, DoorOpen,
  Image, Globe, QrCode, UserCheck, Bell, CalendarClock, HelpCircle,
  Eye, Wallet, CheckCircle, BellRing, Receipt, Link, Repeat, Calculator,
  FileBadge, TrendingUp, BarChart3, AlertTriangle, PieChart, CreditCard,
  AlertCircle, Megaphone, MessageSquare, Star, FolderOpen,
  Calendar, IndianRupee, Headset, Briefcase, ClipboardList, Target, ShieldCheck, Zap
} from 'lucide-react';

// ============================================
// PROPERTY OWNER NAVIGATION - CLEAN VERSION
// ============================================

export const PROPERTY_OWNER_NAV = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/propertyowner/admin"
  },
  {
    label: "Properties",
    icon: Building2,
    href: "/propertyowner/properties",
    submenus: [
      { label: "All Properties", href: "/propertyowner/properties", goldOnly: false },
      { label: "Add Property", href: "/propertyowner/add-property", goldOnly: false },
      { label: "Rooms", href: "/propertyowner/rooms", goldOnly: false },
      { label: "Add Room", href: "/propertyowner/rooms?action=add", goldOnly: false },
    ]
  },
  {
    label: "Tenants",
    icon: Users,
    href: "/propertyowner/tenants",
    submenus: [
      { label: "All Tenants", href: "/propertyowner/tenants", goldOnly: false },
      { label: "Add Tenant", href: "/propertyowner/tenantrec", goldOnly: false },
      { label: "Active Tenants", href: "/propertyowner/active-tenants", goldOnly: false },
      { label: "Upcoming Move-ins", href: "/propertyowner/upcoming-moveins", goldOnly: false },
      { label: "Move-out Requests", href: "/propertyowner/moveout-requests", goldOnly: false },
      { label: "Ex-Tenants", href: "/propertyowner/ex-tenants", goldOnly: false },
      { label: "Tenant Documents", href: "/propertyowner/tenant-docs", goldOnly: false },
      { label: "Police Verification", href: "/propertyowner/police-verification", goldOnly: false },
      { label: "Tenant Feedback", href: "/propertyowner/review", goldOnly: false },
    ]
  },
  {
    label: "Leads & Bookings",
    icon: Calendar,
    href: "/propertyowner/enquiry",
    submenus: [
      { label: "All Leads", href: "/propertyowner/enquiry", goldOnly: false },
      { label: "New Enquiries", href: "/propertyowner/new-enquiries", goldOnly: false },
      { label: "Booking Requests", href: "/propertyowner/booking_request", goldOnly: false },
      { label: "Confirmed Bookings", href: "/propertyowner/booking", goldOnly: false },
      { label: "Cancelled Bookings", href: "/propertyowner/cancelled-bookings", goldOnly: false },
    ]
  },
  {
    label: "Rent & Payments",
    icon: IndianRupee,
    href: "/propertyowner/payment",
    submenus: [
      { label: "Revenue Overview", href: "/propertyowner/revenue-overview", goldOnly: false },
      { label: "Revenue Analytics", href: "/propertyowner/revenue-analytics", goldOnly: false },
      { label: "Rent Collection", href: "/propertyowner/payment", goldOnly: false },
      { label: "Pending Dues", href: "/propertyowner/dues-report", goldOnly: false },
      { label: "Late Payments", href: "/propertyowner/late-fine", goldOnly: false },
      { label: "Payment History", href: "/propertyowner/payment-received", goldOnly: false },
      { label: "Online Payments", href: "/propertyowner/payment-dashboard", goldOnly: false },
      { label: "Receipts", href: "/propertyowner/receipts", goldOnly: false },
      { label: "Electricity Readings", href: "/propertyowner/electricity-readings", goldOnly: false },
      { label: "Security Deposits", href: "/propertyowner/security-deposits", goldOnly: false },
      { label: "Refunds", href: "/propertyowner/refunds", goldOnly: false },
      { label: "Penalty Settings", href: "/propertyowner/penalty-config", goldOnly: false },
    ]
  },

  {
    label: "Complaints & Maintenance",
    icon: Headset,
    href: "/propertyowner/complaints",
    submenus: [
      { label: "All Complaints", href: "/propertyowner/complaints", goldOnly: false },
      { label: "Open Tickets", href: "/propertyowner/open-tickets", goldOnly: false },
      { label: "In Progress", href: "/propertyowner/in-progress-complaints", goldOnly: false },
      { label: "Resolved Complaints", href: "/propertyowner/resolved-complaints", goldOnly: false },
      { label: "Maintenance Requests", href: "/propertyowner/maintenance-requests", goldOnly: false },
      { label: "Assigned Staff", href: "/propertyowner/assigned-staff", goldOnly: false },
      { label: "Service History", href: "/propertyowner/service-history", goldOnly: false },
      { label: "Maintenance Calendar", href: "/propertyowner/maintenance-calendar", goldOnly: false },
    ]
  },
  {
    label: "Staff Management",
    icon: Briefcase,
    href: "/propertyowner/all-staff",
    submenus: [
      { label: "All Staff", href: "/propertyowner/all-staff", goldOnly: false },
      { label: "Add Staff", href: "/propertyowner/add-staff", goldOnly: false },
      { label: "Staff Tasks", href: "/propertyowner/staff-tasks", goldOnly: false },
      { label: "Attendance", href: "/propertyowner/staff-attendance", goldOnly: false },
      { label: "Staff Performance", href: "/propertyowner/staff-performance", goldOnly: false },
    ]
  },
  {
    label: "Attendance & Entry",
    icon: ClipboardList,
    href: "/propertyowner/tenant-attendance",
    submenus: [
      { label: "Tenant Attendance", href: "/propertyowner/tenant-attendance", goldOnly: false },
      { label: "Visitor Entry", href: "/propertyowner/visitor-entry", goldOnly: false },
      { label: "Visitor Passes", href: "/propertyowner/visitor-passes", goldOnly: false },
      { label: "Entry Logs", href: "/propertyowner/entry-logs", goldOnly: false },
      { label: "Exit Logs", href: "/propertyowner/exit-logs", goldOnly: false },
      { label: "Leave Requests", href: "/propertyowner/leave-requests", goldOnly: false },
      { label: "Gate Management", href: "/propertyowner/gate-management", goldOnly: false },
    ]
  },

  {
    label: "Communication",
    icon: MessageCircle,
    href: "/propertyowner/ownerchat",
    submenus: [
      { label: "Chat", href: "/propertyowner/ownerchat", goldOnly: false },
      { label: "WhatsApp Broadcast", href: "/propertyowner/whatsapp", goldOnly: false },
    ]
  },
  {
    label: "Reports",
    icon: BarChart3,
    href: "/propertyowner/reports",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/propertyowner/settings",
    submenus: [
      { label: "Profile Settings", href: "/propertyowner/ownerprofile", goldOnly: false },
      { label: "Bank Accounts", href: "/propertyowner/bank-accounts", goldOnly: false },
      { label: "Data Backup", href: "/propertyowner/settings#backup", goldOnly: false },
    ]
  }
];

export const GOLD_NAV = PROPERTY_OWNER_NAV;
export const SILVER_NAV = PROPERTY_OWNER_NAV;
export const BASE_NAV = PROPERTY_OWNER_NAV;
