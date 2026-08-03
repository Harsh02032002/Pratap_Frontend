export interface NavItem {
  label: string;
  to: string;
  icon: string;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const SIDEBAR_GROUPS: NavGroup[] = [
  { items: [{ label: "Dashboard", to: "/dashboard", icon: "LayoutDashboard" }] },
  {
    title: "Property Management",
    items: [
      { label: "All Properties", to: "/properties", icon: "Building2" },
      { label: "Add New Property", to: "/properties/new", icon: "Plus" },
      { label: "Pending Approvals", to: "/properties/pending", icon: "Clock" },
      { label: "Featured Properties", to: "/properties/featured", icon: "Star" },
      { label: "Expired Properties", to: "/properties/expired", icon: "CalendarX" },
      { label: "Rooms Management", to: "/rooms", icon: "BedDouble" },
      { label: "Amenities Management", to: "/amenities", icon: "Sparkles" },
      { label: "Property Categories", to: "/categories", icon: "Layers" },
    ],
  },
  {
    title: "City & Area Management",
    items: [
      { label: "Cities", to: "/cities", icon: "MapPin" },
      { label: "Areas / Localities", to: "/areas", icon: "Map" },
    ],
  },
  {
    title: "Content Management",
    items: [
      { label: "Pages", to: "/pages", icon: "FileText" },
      { label: "Blog Management", to: "/blogs", icon: "PenSquare" },
      { label: "Media Library", to: "/media", icon: "Image" },
      { label: "Testimonials", to: "/testimonials", icon: "MessageSquareQuote" },
      { label: "Banner Management", to: "/banners", icon: "Megaphone" },
    ],
  },
  {
    title: "SEO Management",
    items: [
      { label: "SEO Pages", to: "/seo", icon: "Search" },
      { label: "Redirects", to: "/redirects", icon: "ArrowRightLeft" },
      { label: "Sitemap", to: "/sitemap", icon: "Network" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "General Settings", to: "/settings/general", icon: "Settings" },
      { label: "Roles & Permissions", to: "/settings/roles", icon: "ShieldCheck" },
      { label: "Admin Users", to: "/settings/admins", icon: "UserCog" },
      { label: "Profile Settings", to: "/settings/profile", icon: "User" },
      { label: "Notification Settings", to: "/settings/notifications", icon: "Bell" },
      { label: "System Settings", to: "/settings/system", icon: "Sliders" },
    ],
  },
];