export const CITIES = [
  "Kota", "Jaipur", "Delhi", "Indore", "Bhopal", "Nagpur", "Sikar",
  "Mumbai", "Pune", "Bengaluru", "Hyderabad", "Chennai", "Ahmedabad",
  "Lucknow", "Chandigarh", "Noida", "Gurugram", "Surat", "Vadodara", "Patna",
];

export const AREAS: Record<string, string[]> = {
  Kota: ["Vigyan Nagar", "Talwandi", "Rajeev Gandhi Nagar", "Mahaveer Nagar", "Kunhari"],
  Jaipur: ["Malviya Nagar", "Mansarovar", "Vaishali Nagar", "C-Scheme", "Jagatpura"],
  Delhi: ["Karol Bagh", "Laxmi Nagar", "Mukherjee Nagar", "Kamla Nagar", "GTB Nagar"],
  Indore: ["Vijay Nagar", "Palasia", "Bhawarkuan", "Rau", "Rajendra Nagar"],
  Bhopal: ["MP Nagar", "Arera Colony", "New Market", "Kolar Road", "Habibganj"],
};

export const CATEGORIES = [
  "Boys PG", "Girls PG", "Co-ed PG", "Co-living", "Hostel",
  "Studio Apartment", "1 BHK", "2 BHK", "3 BHK", "Shared Room",
  "Private Room", "Executive PG", "Student Hostel", "Working Women PG",
  "Luxury PG", "Budget PG", "Villa", "Independent House", "Serviced Apartment", "Deluxe Room",
];

export const AMENITIES = [
  { name: "WiFi", icon: "Wifi" }, { name: "AC", icon: "Snowflake" },
  { name: "Power Backup", icon: "BatteryCharging" }, { name: "Parking", icon: "Car" },
  { name: "Lift", icon: "MoveVertical" }, { name: "24x7 Security", icon: "ShieldCheck" },
  { name: "Gym", icon: "Dumbbell" }, { name: "Laundry", icon: "Shirt" },
  { name: "Housekeeping", icon: "Sparkles" }, { name: "RO Water", icon: "GlassWater" },
  { name: "Study Table", icon: "BookOpen" }, { name: "Wardrobe", icon: "Archive" },
  { name: "Attached Bathroom", icon: "Bath" }, { name: "Hot Water", icon: "Flame" },
  { name: "Refrigerator", icon: "Refrigerator" }, { name: "TV", icon: "Tv" },
  { name: "Microwave", icon: "Microwave" }, { name: "Mess Facility", icon: "UtensilsCrossed" },
  { name: "CCTV", icon: "Camera" }, { name: "Biometric Entry", icon: "Fingerprint" },
  { name: "Medical Support", icon: "Stethoscope" }, { name: "Pet Friendly", icon: "PawPrint" },
  { name: "Wheelchair Access", icon: "Accessibility" }, { name: "Swimming Pool", icon: "Waves" },
  { name: "Garden", icon: "Trees" }, { name: "Common Hall", icon: "Users" },
  { name: "Library", icon: "Library" }, { name: "Indoor Games", icon: "Gamepad2" },
  { name: "Outdoor Games", icon: "Trophy" }, { name: "Cafeteria", icon: "Coffee" },
];

export const OWNERS = [
  "Rahul Sharma", "Priya Verma", "Amit Gupta", "Neha Singh", "Suresh Iyer",
  "Kavita Mehta", "Rohit Khanna", "Anjali Rao", "Vikram Joshi", "Deepa Nair",
  "Manish Aggarwal", "Sunita Chauhan", "Arjun Malhotra", "Ritu Bansal", "Karan Kapoor",
];

const IMG_POOL = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400",
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=400",
  "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400",
];

export interface PropertyRow {
  id: string;
  code: string;
  name: string;
  image: string;
  type: string;
  category: string;
  city: string;
  area: string;
  owner: string;
  price: number;
  totalRooms: number;
  availableRooms: number;
  occupancy: number;
  rating: number;
  status: "Published" | "Pending" | "Draft" | "Rejected" | "Expired";
  featured: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

const NAME_PREFIXES = ["ABC", "Sunrise", "Green Valley", "Blue Sky", "Royal", "Elite", "Comfort", "Urban", "Prime", "Heritage", "Golden", "Silver", "Skyline", "Riverside", "Palm", "Grand", "Metro", "Star", "Crown", "Lotus"];
const NAME_SUFFIXES = ["Residency", "Hostel", "PG", "Homes", "Nest", "Stays", "House", "Villa", "Apartments", "Living"];

function seeded(n: number) {
  let s = n * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const PROPERTIES: PropertyRow[] = Array.from({ length: 60 }, (_, i) => {
  const r = seeded(i + 1);
  const city = CITIES[Math.floor(r() * CITIES.length)];
  const areasForCity = AREAS[city] ?? ["Sector 1", "Sector 2", "Sector 3", "Central", "Old Town"];
  const area = areasForCity[Math.floor(r() * areasForCity.length)];
  const totalRooms = 8 + Math.floor(r() * 40);
  const availableRooms = Math.floor(r() * totalRooms);
  const statuses: PropertyRow["status"][] = ["Published", "Published", "Published", "Pending", "Draft", "Expired", "Rejected"];
  return {
    id: `p-${i + 1}`,
    code: `RH-${1000 + i}`,
    name: `${NAME_PREFIXES[i % NAME_PREFIXES.length]} ${NAME_SUFFIXES[i % NAME_SUFFIXES.length]}`,
    image: IMG_POOL[i % IMG_POOL.length],
    type: ["PG", "Hostel", "Co-living", "Apartment"][i % 4],
    category: CATEGORIES[i % CATEGORIES.length],
    city,
    area,
    owner: OWNERS[i % OWNERS.length],
    price: 4500 + Math.floor(r() * 15000),
    totalRooms,
    availableRooms,
    occupancy: Math.round(((totalRooms - availableRooms) / totalRooms) * 100),
    rating: Number((3.6 + r() * 1.3).toFixed(1)),
    status: statuses[i % statuses.length],
    featured: i % 5 === 0,
    verified: i % 3 !== 0,
    createdAt: `2025-0${(i % 9) + 1}-${((i * 3) % 27) + 1}`.padEnd(10, "0"),
    updatedAt: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String(((i * 5) % 27) + 1).padStart(2, "0")}`,
  };
});

export const RECENT_ACTIVITIES = [
  { icon: "CheckCircle2", tone: "success", text: "Property 'ABC Residency' approved by Super Admin", time: "2m ago" },
  { icon: "Building2", tone: "primary", text: "New property 'Sunrise Hostel' submitted for approval", time: "18m ago" },
  { icon: "MapPin", tone: "info", text: "Area 'Talwandi' updated in Kota", time: "42m ago" },
  { icon: "FileText", tone: "primary", text: "Blog 'Top 10 PGs in Jaipur' published", time: "1h ago" },
  { icon: "Image", tone: "info", text: "12 media files uploaded to Media Library", time: "3h ago" },
  { icon: "Megaphone", tone: "warning", text: "Homepage banner replaced by Admin", time: "5h ago" },
  { icon: "Search", tone: "success", text: "SEO score improved from 78 → 92 on Home Page", time: "6h ago" },
  { icon: "UserCog", tone: "info", text: "Admin 'Priya Verma' logged in from Delhi", time: "8h ago" },
];

export const NOTIFICATIONS = [
  { title: "New property submitted", body: "Blue Sky PG (Kota) is waiting for approval.", time: "2m", unread: true },
  { title: "City updated", body: "Jaipur city details were updated.", time: "18m", unread: true },
  { title: "SEO score improved", body: "Home Page SEO is now 92 (Excellent).", time: "1h", unread: true },
  { title: "Blog published", body: "'Top 10 PGs in Jaipur' is now live.", time: "3h", unread: false },
  { title: "Media uploaded", body: "12 new photos added to Media Library.", time: "5h", unread: false },
  { title: "Banner updated", body: "Homepage banner replaced by Admin.", time: "8h", unread: false },
];

export const PROPERTY_GROWTH = [
  { m: "Jan", properties: 240, published: 190 },
  { m: "Feb", properties: 280, published: 220 },
  { m: "Mar", properties: 320, published: 260 },
  { m: "Apr", properties: 360, published: 300 },
  { m: "May", properties: 410, published: 340 },
  { m: "Jun", properties: 470, published: 390 },
  { m: "Jul", properties: 520, published: 440 },
  { m: "Aug", properties: 580, published: 490 },
  { m: "Sep", properties: 640, published: 550 },
  { m: "Oct", properties: 700, published: 610 },
  { m: "Nov", properties: 760, published: 670 },
  { m: "Dec", properties: 820, published: 730 },
];

export const REVENUE_DATA = PROPERTY_GROWTH.map((d, i) => ({ m: d.m, revenue: 120000 + i * 22000 + (i % 3) * 8000 }));

export const CATEGORY_DISTRIBUTION = [
  { name: "Boys PG", value: 32 },
  { name: "Girls PG", value: 24 },
  { name: "Co-living", value: 18 },
  { name: "Hostel", value: 14 },
  { name: "Apartments", value: 12 },
];

export const CITY_DISTRIBUTION = CITIES.slice(0, 8).map((c, i) => ({ city: c, count: 40 + ((i * 17) % 90) }));

export const QUICK_ACTIONS = [
  { label: "Add Property", to: "/properties/new", icon: "Building2" },
  { label: "Add City", to: "/cities", icon: "MapPin" },
  { label: "Add Area", to: "/areas", icon: "Map" },
  { label: "Create Page", to: "/pages", icon: "FilePlus" },
  { label: "Upload Banner", to: "/banners", icon: "Megaphone" },
  { label: "Upload Media", to: "/media", icon: "Image" },
  { label: "Add Blog", to: "/blogs", icon: "PenSquare" },
  { label: "Generate Sitemap", to: "/sitemap", icon: "Network" },
  { label: "Manage SEO", to: "/seo", icon: "Search" },
];