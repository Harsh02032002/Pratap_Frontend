import React, { useEffect, useState } from "react";
import { getApiBase, getAuthHeader, fetchJson } from "../../utils/api";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { MobileTabs, MobileEmptyState, cn } from "../../components/propertyowner/MobileComponents";
import { requireOwnerSession } from "../../utils/ownerSession";
import { fetchOwnerProperties } from "../../utils/propertyowner";
import {
  Plus, MapPin, BedDouble, Search, Star, Check, Edit, Eye, ShieldCheck, Home, X,
  Building2, User, Layers, Shield, Activity, Globe, Zap, CheckCircle2, Users,
  Image as ImageIcon, AlertCircle, Loader2, Clock, UploadCloud, Trash2,
  Wifi, IndianRupee, Info, UtensilsCrossed, Camera, ChevronDown, ChevronUp,
  Wallet, FileText
} from "lucide-react";


const PROPERTY_TYPES = ["hostel", "pg", "apartment", "co-living", "room"];
const GENDER_OPTIONS = ["Co-ed", "Male Only", "Female Only", "any", "male", "female"];
const CANCELLATION_POLICIES = ["Flexible", "Moderate", "Strict"];
const INCLUDED_IN_RENT_OPTIONS = ["Electricity", "Water", "WiFi", "Gas", "Maintenance", "Housekeeping", "Laundry"];
const HOUSE_RULES_FIELDS = [
  { key: "smokingAllowed", label: "Smoking" },
  { key: "alcoholAllowed", label: "Alcohol" },
  { key: "petsAllowed", label: "Pets" },
  { key: "cookingAllowed", label: "Cooking" },
  { key: "visitorsAllowed", label: "Visitors" },
  { key: "partyAllowed", label: "Party / Gathering" },
  { key: "outsideFood", label: "Outside Food" },
  { key: "quietHours", label: "Quiet Hours" },
  { key: "earlyCheckIn", label: "Early Check-In" },
];

// ─── Shared helpers ─────────────────────────────────────────────────────────────
const fmtVal = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) {
    if (val.length === 0) return "—";
    return val.map(item => typeof item === "object" && item !== null
      ? (item.name || item.title || Object.values(item).filter(v => typeof v === "string").join(" "))
      : String(item)).join(", ");
  }
  if (typeof val === "object") {
    return Object.entries(val).filter(([, v]) => v !== null && v !== "" && v !== undefined)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").trim()}: ${typeof v === "boolean" ? (v ? "Yes" : "No") : v}`)
      .join(" • ");
  }
  return String(val);
};

// ─── Sub-UI Components ──────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, colorClass = "blue", defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const colorMap = {
    blue: { bg: "bg-blue-50 border-blue-100", icon: "text-blue-600", text: "text-blue-700" },
    emerald: { bg: "bg-emerald-50 border-emerald-100", icon: "text-emerald-600", text: "text-emerald-700" },
    indigo: { bg: "bg-indigo-50 border-indigo-100", icon: "text-indigo-600", text: "text-indigo-700" },
    amber: { bg: "bg-amber-50 border-amber-100", icon: "text-amber-600", text: "text-amber-700" },
    rose: { bg: "bg-rose-50 border-rose-100", icon: "text-rose-600", text: "text-rose-700" },
    teal: { bg: "bg-teal-50 border-teal-100", icon: "text-teal-600", text: "text-teal-700" },
    purple: { bg: "bg-purple-50 border-purple-100", icon: "text-purple-600", text: "text-purple-700" },
    slate: { bg: "bg-slate-50 border-slate-100", icon: "text-slate-600", text: "text-slate-700" },
  };
  const c = colorMap[colorClass] || colorMap.slate;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className={cn("w-full p-4 border-b flex items-center gap-2 text-left", c.bg)}>
        <Icon className={cn("w-4 h-4", c.icon)} />
        <span className={cn("text-xs font-bold uppercase tracking-widest flex-1", c.text)}>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && children}
    </div>
  );
}

function ViewField({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="text-[11px] font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 break-words min-h-[32px]">
        {fmtVal(value) || "—"}
      </div>
    </div>
  );
}

function EditInput({ label, field, formData, setFormData, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>
      <input type={type} value={formData[field] ?? ""} placeholder={placeholder}
        onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
    </div>
  );
}

function EditSelect({ label, field, formData, setFormData, options }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>
      <select value={formData[field] ?? ""} onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function EditTextarea({ label, field, formData, setFormData, rows = 3, placeholder = "" }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>
      <textarea rows={rows} value={formData[field] ?? ""} placeholder={placeholder}
        onChange={e => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
    </div>
  );
}

// ─── View Modal ─────────────────────────────────────────────────────────────────
function PropertyViewModal({ property, onClose }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [activeImg, setActiveImg] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [extrasError, setExtrasError] = useState("");

  const allImgs = [...(property.images || []), ...((property.propertyViews || []).flatMap(v => v.images || []))].filter(Boolean);

  useEffect(() => {
    if (activeTab === "Tenants" || activeTab === "Payments") {
      if (tenants.length > 0) return;
      setLoadingExtras(true);
      setExtrasError("");
      fetchJson(`/api/owners/${encodeURIComponent(property.ownerLoginId)}/properties/${encodeURIComponent(property._id)}/tenants`)
        .then((data) => {
          setTenants(data.tenants || []);
        })
        .catch(() => setExtrasError("Failed to load tenant data."))
        .finally(() => setLoadingExtras(false));
    }
  }, [activeTab, property._id]);

  const tabs = ["Overview", "Rooms", "Tenants", "Payments", "Documents"];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#F8FAFC] rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">

        {/* Header */}
        <div className="flex flex-col bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{property.title || property.name || "Property"}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {[property.city, property.locality].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto hide-scrollbar px-6 gap-6 border-t border-slate-50">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          
          {/* OVERVIEW TAB */}
          {activeTab === "Overview" && (
            <div className="space-y-4">
              <SectionCard title="Basic Information" icon={Building2} colorClass="blue">
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ViewField label="Property Name" value={property.title} />
                  <ViewField label="Property Type" value={property.propertyType} />
                  <ViewField label="Property Category" value={property.propertyCategory} />
                  <ViewField label="Gender" value={property.gender} />
                  <ViewField label="Status" value={property.status} />
                  <ViewField label="Live on Website" value={property.isLiveOnWebsite} />
                </div>
                <div className="px-4 pb-4">
                  <ViewField label="Description" value={property.description} />
                </div>
              </SectionCard>

              {/* Location */}
              <SectionCard title="Location Details" icon={MapPin} colorClass="emerald">
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ViewField label="Address" value={property.address} />
                  <ViewField label="Locality / Area" value={property.locality} />
                  <ViewField label="City" value={property.city} />
                  <ViewField label="State" value={property.state} />
                  <ViewField label="Pincode" value={property.pincode} />
                  <ViewField label="Landmark" value={property.landmark} />
                </div>
              </SectionCard>
              
              {/* Amenities */}
              {(property.amenities || []).length > 0 && (
                <SectionCard title={`Amenities (${property.amenities.length})`} icon={CheckCircle2} colorClass="purple">
                  <div className="p-4 flex flex-wrap gap-2">
                    {property.amenities.map((am, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[11px] font-bold uppercase tracking-wide">
                        <Check className="w-3 h-3" /> {typeof am === "string" ? am : am.name}
                      </span>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}

          {/* ROOMS TAB */}
          {activeTab === "Rooms" && (
            <div className="space-y-4">
              <SectionCard title="Property Details" icon={Home} colorClass="amber">
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ViewField label="Total Area (sq.ft)" value={property.propertyDetails?.totalArea} />
                  <ViewField label="Year Built" value={property.propertyDetails?.yearBuilt} />
                  <ViewField label="Property Age" value={property.propertyDetails?.propertyAge} />
                  <ViewField label="Total Floors" value={property.propertyDetails?.floors} />
                  <ViewField label="Lift Available" value={property.propertyDetails?.liftAvailable} />
                  <ViewField label="Parking" value={property.propertyDetails?.parkingAvailable} />
                </div>
                {/* Room Types */}
                {(property.roomTypes || []).length > 0 && (
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Room Types</p>
                    {property.roomTypes.map((rt, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-xs font-bold text-slate-700 mb-2">{rt.type || `Room ${i + 1}`}</p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          <ViewField label="Occupancy" value={rt.occupancy} />
                          <ViewField label="Total Rooms" value={rt.totalRooms} />
                          <ViewField label="Total Beds" value={rt.totalBeds} />
                          <ViewField label="Price/Bed" value={rt.pricePerBed ? `₹${rt.pricePerBed}` : null} />
                          <ViewField label="Price/Room" value={rt.pricePerRoom ? `₹${rt.pricePerRoom}` : null} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Pricing */}
              <SectionCard title="Pricing & Terms" icon={IndianRupee} colorClass="indigo">
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ViewField label="Monthly Rent" value={property.monthlyRent ? `₹${property.monthlyRent?.toLocaleString()}` : null} />
                  <ViewField label="Rent Type" value={property.pricing?.rentType} />
                  <ViewField label="Security Deposit" value={property.pricing?.securityDeposit ? `₹${property.pricing.securityDeposit}` : null} />
                </div>
              </SectionCard>
            </div>
          )}

          {/* TENANTS TAB */}
          {activeTab === "Tenants" && (
            <div className="space-y-4">
              {loadingExtras ? (
                <div className="flex items-center justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : extrasError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                  <p className="text-sm text-rose-600">{extrasError}</p>
                </div>
              ) : tenants.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No tenants yet</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">No tenants are currently assigned to this property.</p>
                  <button onClick={() => window.location.href = `/propertyowner/tenantrec`} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Add Tenant</button>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700">{tenants.length} Tenant{tenants.length !== 1 ? "s" : ""}</h3>
                    <button onClick={() => window.location.href = `/propertyowner/tenants`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View All →</button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {tenants.map((t) => (
                      <div key={t._id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                            {(t.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                            <p className="text-[11px] text-slate-400">Room {t.roomNo || "—"} · {t.phone || ""}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">₹{(t.agreedRent || 0).toLocaleString("en-IN")}<span className="text-[10px] text-slate-400 font-normal">/mo</span></p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {t.status || "Active"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === "Payments" && (
            <div className="space-y-4">
              {loadingExtras ? (
                <div className="flex items-center justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : extrasError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                  <p className="text-sm text-rose-600">{extrasError}</p>
                </div>
              ) : tenants.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center">
                  <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No payment data</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">No tenants assigned — no rent to track yet.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">Monthly Rent Summary</h3>
                      <p className="text-[11px] text-slate-400">Expected from {tenants.length} tenant{tenants.length !== 1 ? "s" : ""} this month</p>
                    </div>
                    <p className="text-lg font-black text-slate-800">
                      ₹{tenants.reduce((s, t) => s + (Number(t.agreedRent) || 0), 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {tenants.map((t) => (
                      <div key={t._id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                          <p className="text-[11px] text-slate-400">Room {t.roomNo || "—"} · Move-in: {t.moveInDate ? new Date(t.moveInDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-700">₹{(t.agreedRent || 0).toLocaleString("en-IN")}<span className="text-[10px] text-slate-400 font-normal">/mo</span></p>
                          <p className="text-[10px] text-slate-400">Deposit: ₹{(t.securityDepositPaid || 0).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3 border-t border-slate-100 text-right">
                    <button onClick={() => window.location.href = `/propertyowner/payment`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Full Ledger →</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === "Documents" && (
            <div className="space-y-4">
              {property.policies && Object.values(property.policies).some(Boolean) && (
                <SectionCard title="House Policies" icon={Shield} colorClass="rose">
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {HOUSE_RULES_FIELDS.map(({ key, label }) => (
                      <ViewField key={key} label={label} value={property.policies?.[key]} />
                    ))}
                  </div>
                </SectionCard>
              )}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700">Legal Documents</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Upload and manage agreements, NOCs, and property deeds.</p>
                <button className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold">Manage Documents</button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 shrink-0">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {property._id}</p>
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ─────────────────────────────────────────────────────────────────
function PropertyEditModal({ property, owner, apiBase, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const STEPS = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Property Details" },
    { num: 3, label: "Photos" },
    { num: 4, label: "Pricing & Policies" },
  ];

  // Step 1 — Basic
  const [form, setForm] = useState({
    title: property.title || property.name || "",
    propertyType: property.propertyType || "hostel",
    propertyCategory: property.propertyCategory || "",
    description: property.description || "",
    address: property.address || "",
    locality: property.locality || "",
    city: property.city || "",
    state: property.state || "",
    pincode: property.pincode || "",
    landmark: property.landmark || "",
    contactName: property.contact?.name || property.ownerName || "",
    contactNumber: property.contact?.number || property.ownerPhone || "",
    email: property.contact?.email || "",
    // Step 2 — Details
    totalArea: property.propertyDetails?.totalArea || "",
    yearBuilt: property.propertyDetails?.yearBuilt || "",
    propertyAge: property.propertyDetails?.propertyAge || "",
    floors: property.propertyDetails?.floors || "",
    liftAvailable: property.propertyDetails?.liftAvailable || "Yes",
    parkingAvailable: property.propertyDetails?.parkingAvailable || "Yes",
    noticePeriod: property.propertyDetails?.noticePeriod || "30 Days",
    genderPref: property.propertyDetails?.genderPref || property.gender || "Co-ed",
    // Step 5 — Pricing
    monthlyRent: property.monthlyRent || "",
    rentType: property.pricing?.rentType || "Per Bed",
    securityDeposit: property.pricing?.securityDeposit || "",
    advanceRent: property.pricing?.advanceRent || "",
    pricingNoticePeriod: property.pricing?.noticePeriod || "30 Days",
    lockInPeriod: property.pricing?.lockInPeriod || "3 Months",
    discountPercent: property.pricing?.discountPercent || "0",
    cancellationPolicy: property.pricing?.cancellationPolicy || "Moderate",
    tenantDescription: property.tenantDescription || "",
    reason: "",
  });

  // Step 2 — Room Types
  const [roomTypes, setRoomTypes] = useState(
    (property.roomTypes || []).length > 0
      ? property.roomTypes
      : [{ type: "Single Sharing", desc: "", totalRooms: "1", totalBeds: "1", occupancy: 1, pricePerBed: "0", pricePerRoom: "0" }]
  );

  // Step 2 — Preferred For
  const [preferredFor, setPreferredFor] = useState(property.propertyDetails?.preferredFor || { students: false, professionals: false, both: false, family: false });

  // Step 3 — Images
  const [images, setImages] = useState(property.images || []);
  const [uploadingImgs, setUploadingImgs] = useState(false);

  // Step 5 — Included in Rent
  const [includedInRent, setIncludedInRent] = useState(
    property.pricing?.includedInRent || { Electricity: false, Water: false, WiFi: false, Gas: false, Maintenance: false, Housekeeping: false, Laundry: false }
  );

  // Step 5 — Additional Charges
  const [additionalCharges, setAdditionalCharges] = useState(property.pricing?.additionalCharges || []);

  // Step 5 — House Policies
  const [houseRules, setHouseRules] = useState(property.policies || {
    smokingAllowed: "No", alcoholAllowed: "No", petsAllowed: "No", cookingAllowed: "Yes",
    visitorsAllowed: "Yes", visitorTiming: "8AM - 8PM", partyAllowed: "No",
    outsideFood: "Yes", quietHours: "Yes", quietHoursTiming: "10PM - 7AM", earlyCheckIn: "Yes",
  });

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleImgUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImgs(true);
    const uploadedUrls = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("image", file);
      try {
        const base = getApiBase();
        const res = await fetch(`${base}/api/upload`, {
          method: "POST",
          body: fd,
          headers: getAuthHeader()
        });
        let json;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          json = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || `HTTP error ${res.status}`);
        }
        if (res.ok && json.url) {
          uploadedUrls.push(json.url);
        } else {
          console.error("Upload failed", json?.error || "Empty response");
        }
      } catch (err) { console.error(err); }
    }
    // Append newly uploaded URLs directly to the images state
    if (uploadedUrls.length > 0) {
      setImages(prev => [...prev, ...uploadedUrls]);
    }
    setUploadingImgs(false);
  };

  const handleSubmit = async () => {
    if (!property) return;
    setSending(true);
    setResult(null);
    try {
      const payload = {
        title:            form.title,
        description:      form.description,
        address:          form.address,
        locality:         form.locality,
        city:             form.city,
        state:            form.state,
        pincode:          form.pincode,
        landmark:         form.landmark,
        monthlyRent:      form.monthlyRent,
        contact: {
          name:   form.contactName,
          number: form.contactNumber,
          email:  form.email,
        },
        propertyType:     form.propertyType,
        propertyCategory: form.propertyCategory,
        propertyDetails: {
          totalArea:       form.totalArea,
          yearBuilt:       form.yearBuilt,
          propertyAge:     form.propertyAge,
          floors:          form.floors,
          liftAvailable:   form.liftAvailable,
          parkingAvailable:form.parkingAvailable,
          noticePeriod:    form.noticePeriod,
          genderPref:      form.genderPref,
          preferredFor,
        },
        pricing: {
          rentType:           form.rentType,
          securityDeposit:    form.securityDeposit,
          advanceRent:        form.advanceRent,
          noticePeriod:       form.pricingNoticePeriod,
          lockInPeriod:       form.lockInPeriod,
          discountPercent:    form.discountPercent,
          cancellationPolicy: form.cancellationPolicy,
          includedInRent,
          additionalCharges,
        },
        policies:          houseRules,
        images,
        roomTypes,
        tenantDescription: form.tenantDescription,
      };

      const base = typeof getApiBase === "function" ? getApiBase() : apiBase;
      const res = await fetch(`${base}/api/properties/${property._id}/owner-edit-request`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ updatedData: payload, reason: form.reason, ownerLoginId: owner?.loginId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setResult({ success: true, message: "✅ Edit request submitted! Changes will go live after Superadmin approval." });
        setTimeout(() => { if (onSuccess) onSuccess(); onClose(); }, 2500);
      } else {
        setResult({ success: false, message: json.message || "Submission failed. Please try again." });
      }
    } catch (err) {
      setResult({ success: false, message: err?.message || "Network error. Please try again." });
    } finally {
      setSending(false);
    }
  };

  const handleEditRequest = async () => {
    if (!editProperty) return;
    setRequestSending(true);
    setRequestResult(null);
    try {
      await fetchJson("/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          toRole: "superadmin",
          from: owner?.name || owner?.loginId || "Property Owner",
          type: "edit_request",
          meta: {
            propertyId: editProperty._id,
            propertyName: editProperty.title || editProperty.name,
            ownerLoginId: owner?.loginId,
            message: editRequestMsg,
            updatedData: editFormData
          }
        })
      });
      setRequestResult({ success: true, message: "Edit request sent to Superadmin successfully!" });
      setTimeout(() => {
        setEditProperty(null);
        setEditRequestMsg("");
        setEditFormData({});
        setRequestResult(null);
      }, 2000);
    } catch (err) {
      setResult({ success: false, message: err?.message || "Something went wrong" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#F8FAFC] rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Edit Property Request</h2>
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Changes require Superadmin approval before going live
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="w-5 h-5" /></button>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 bg-white border-b border-slate-100 shrink-0 overflow-x-auto">
          {STEPS.map(s => (
            <button key={s.num} onClick={() => setStep(s.num)}
              className={cn("shrink-0 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                step === s.num ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>
              {s.num}. {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <>
              <SectionCard title="Basic Information" icon={Building2} colorClass="blue">
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <EditInput label="Property Name *" field="title" formData={form} setFormData={setForm} placeholder="e.g. Rohini PG - Block A" />
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Property Type</label>
                      <select value={form.propertyType} onChange={e => setForm(p => ({ ...p, propertyType: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Property Category</label>
                      <select value={form.propertyCategory} onChange={e => setForm(p => ({ ...p, propertyCategory: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                        <option value="">Select category</option>
                        <option>Boys PG</option><option>Girls PG</option><option>Co-living</option>
                      </select>
                    </div>
                    <EditInput label="Monthly Rent (₹)" field="monthlyRent" formData={form} setFormData={setForm} type="number" placeholder="₹ 0" />
                  </div>
                  <EditTextarea label="Property Description" field="description" formData={form} setFormData={setForm} rows={4} placeholder="Describe your property..." />
                </div>
              </SectionCard>

              <SectionCard title="Location Details" icon={MapPin} colorClass="emerald">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <EditInput label="Full Address *" field="address" formData={form} setFormData={setForm} placeholder="House/building name, Street address" />
                  </div>
                  <EditInput label="Locality / Area *" field="locality" formData={form} setFormData={setForm} placeholder="e.g. Koramangala" />
                  <EditInput label="City *" field="city" formData={form} setFormData={setForm} placeholder="e.g. Chandigarh" />
                  <EditInput label="State" field="state" formData={form} setFormData={setForm} placeholder="e.g. Punjab" />
                  <EditInput label="Pincode" field="pincode" formData={form} setFormData={setForm} placeholder="Enter pincode" />
                  <div className="md:col-span-2">
                    <EditInput label="Landmark (optional)" field="landmark" formData={form} setFormData={setForm} placeholder="e.g. Near Punjab University" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Contact Person" icon={User} colorClass="indigo">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <EditInput label="Contact Name *" field="contactName" formData={form} setFormData={setForm} placeholder="Owner name" />
                  <EditInput label="Contact Number *" field="contactNumber" formData={form} setFormData={setForm} placeholder="Phone number" />
                  <EditInput label="Email" field="email" formData={form} setFormData={setForm} placeholder="Email address" />
                </div>
              </SectionCard>
            </>
          )}

          {/* ── STEP 2: Property Details ── */}
          {step === 2 && (
            <>
              <SectionCard title="Property Details" icon={Home} colorClass="amber">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <EditInput label="Total Area (sq.ft)" field="totalArea" formData={form} setFormData={setForm} placeholder="e.g. 5000" />
                  <EditInput label="Year Built" field="yearBuilt" formData={form} setFormData={setForm} placeholder="e.g. 2020" />
                  <EditInput label="Property Age" field="propertyAge" formData={form} setFormData={setForm} placeholder="e.g. 3-5 Years" />
                  <EditInput label="Total Floors" field="floors" formData={form} setFormData={setForm} placeholder="e.g. G+3" />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Lift Available</label>
                    <select value={form.liftAvailable} onChange={e => setForm(p => ({ ...p, liftAvailable: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                      <option>Yes</option><option>No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Parking Available</label>
                    <select value={form.parkingAvailable} onChange={e => setForm(p => ({ ...p, parkingAvailable: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                      <option>Yes</option><option>No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Gender Preference</label>
                    <select value={form.genderPref} onChange={e => setForm(p => ({ ...p, genderPref: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                      <option>Co-ed</option><option>Male Only</option><option>Female Only</option>
                    </select>
                  </div>
                  <EditInput label="Notice Period" field="noticePeriod" formData={form} setFormData={setForm} placeholder="e.g. 30 Days" />
                </div>
                <div className="px-4 pb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Preferred For</p>
                  <div className="flex flex-wrap gap-3">
                    {["students", "professionals", "family", "both"].map(k => (
                      <button key={k} onClick={() => setPreferredFor(p => ({ ...p, [k]: !p[k] }))}
                        className={cn("px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all capitalize",
                          preferredFor[k] ? "bg-amber-500 text-white border-amber-500" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-300")}>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Room Types" icon={BedDouble} colorClass="blue">
                <div className="p-4 space-y-4">
                  {roomTypes.map((rt, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-700">Room Type {i + 1}</p>
                        {roomTypes.length > 1 && (
                          <button onClick={() => setRoomTypes(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Room Type Name</label>
                          <input value={rt.type || ""} onChange={e => updateRoom(i, "type", e.target.value)} placeholder="e.g. Single Sharing"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Occupancy (persons)</label>
                          <input type="number" value={rt.occupancy || ""} onChange={e => updateRoom(i, "occupancy", e.target.value)} placeholder="1"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Total Rooms</label>
                          <input type="number" value={rt.totalRooms || ""} onChange={e => updateRoom(i, "totalRooms", e.target.value)} placeholder="10"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Total Beds</label>
                          <input type="number" value={rt.totalBeds || ""} onChange={e => updateRoom(i, "totalBeds", e.target.value)} placeholder="10"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Price / Bed (₹)</label>
                          <input type="number" value={rt.pricePerBed || ""} onChange={e => updateRoom(i, "pricePerBed", e.target.value)} placeholder="5000"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Price / Room (₹)</label>
                          <input type="number" value={rt.pricePerRoom || ""} onChange={e => updateRoom(i, "pricePerRoom", e.target.value)} placeholder="5000"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 transition-all" />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Description</label>
                          <input value={rt.desc || ""} onChange={e => updateRoom(i, "desc", e.target.value)} placeholder="Brief description..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 transition-all" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setRoomTypes(prev => [...prev, { type: "", desc: "", totalRooms: "1", totalBeds: "1", occupancy: 1, pricePerBed: "0", pricePerRoom: "0" }])}
                    className="flex items-center gap-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all">
                    <Plus className="w-4 h-4" /> Add Room Type
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── STEP 3: Photos ── */}
          {step === 3 && (
            <SectionCard title="Property Photos" icon={ImageIcon} colorClass="teal">
              <div className="p-4">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                  {images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden relative group border border-slate-100">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="text-white hover:text-rose-300">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50 transition-colors">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImgUpload} disabled={uploadingImgs} />
                    {uploadingImgs ? <Loader2 className="w-6 h-6 text-teal-400 animate-spin" /> : <UploadCloud className="w-6 h-6 text-teal-400" />}
                    <span className="text-[10px] font-bold text-teal-500 mt-1">Upload</span>
                  </label>
                </div>
                {images.length === 0 && !uploadingImgs && (
                  <p className="text-center text-sm text-slate-400 py-4">No photos uploaded yet. Click Upload to add photos.</p>
                )}
              </div>
            </SectionCard>
          )}

          {/* ── STEP 4: Policies & Pricing ── */}
          {step === 4 && (
            <>
              <SectionCard title="House Policies / Rules" icon={Shield} colorClass="rose">
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {HOUSE_RULES_FIELDS.map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">{label}</label>
                      <select value={houseRules[key] || "No"} onChange={e => setHouseRules(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                        <option>Yes</option><option>No</option>
                      </select>
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Visitor Timing</label>
                    <input value={houseRules.visitorTiming || ""} onChange={e => setHouseRules(p => ({ ...p, visitorTiming: e.target.value }))} placeholder="8AM - 8PM"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Quiet Hours Timing</label>
                    <input value={houseRules.quietHoursTiming || ""} onChange={e => setHouseRules(p => ({ ...p, quietHoursTiming: e.target.value }))} placeholder="10PM - 7AM"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Pricing & Terms" icon={IndianRupee} colorClass="indigo">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Rent Type</label>
                    <select value={form.rentType} onChange={e => setForm(p => ({ ...p, rentType: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                      <option>Per Bed</option><option>Per Room</option><option>Per Person</option>
                    </select>
                  </div>
                  <EditInput label="Security Deposit (₹)" field="securityDeposit" formData={form} setFormData={setForm} type="number" placeholder="10000" />
                  <EditInput label="Advance Rent (₹)" field="advanceRent" formData={form} setFormData={setForm} type="number" placeholder="5000" />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Notice Period</label>
                    <select value={form.pricingNoticePeriod} onChange={e => setForm(p => ({ ...p, pricingNoticePeriod: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                      <option>15 Days</option><option>30 Days</option><option>45 Days</option><option>60 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Lock-in Period</label>
                    <select value={form.lockInPeriod} onChange={e => setForm(p => ({ ...p, lockInPeriod: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                      <option>No Lock-in</option><option>1 Month</option><option>2 Months</option><option>3 Months</option><option>6 Months</option>
                    </select>
                  </div>
                  <EditInput label="Discount %" field="discountPercent" formData={form} setFormData={setForm} type="number" placeholder="0" />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Cancellation Policy</label>
                    <select value={form.cancellationPolicy} onChange={e => setForm(p => ({ ...p, cancellationPolicy: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-400 transition-all">
                      {CANCELLATION_POLICIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Included in Rent */}
                <div className="px-4 pb-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Included in Rent</p>
                  <div className="flex flex-wrap gap-2">
                    {INCLUDED_IN_RENT_OPTIONS.map(k => (
                      <button key={k} onClick={() => setIncludedInRent(p => ({ ...p, [k]: !p[k] }))}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all",
                          includedInRent[k] ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-200")}>
                        <div className={cn("w-3.5 h-3.5 rounded-md border-2 flex items-center justify-center transition-all",
                          includedInRent[k] ? "bg-emerald-600 border-emerald-600" : "border-slate-300")}>
                          {includedInRent[k] && <Check className="w-2 h-2 text-white" />}
                        </div>
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Charges */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Additional Charges</p>
                    <button onClick={() => setAdditionalCharges(p => [...p, { name: "", amount: "", per: "Month" }])}
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                  </div>
                  <div className="space-y-2">
                    {additionalCharges.map((c, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={c.name} onChange={e => { const u = [...additionalCharges]; u[i] = { ...u[i], name: e.target.value }; setAdditionalCharges(u); }}
                          placeholder="e.g. Parking" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-400 transition-all" />
                        <input type="number" value={c.amount} onChange={e => { const u = [...additionalCharges]; u[i] = { ...u[i], amount: e.target.value }; setAdditionalCharges(u); }}
                          placeholder="₹ Amount" className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-400 transition-all" />
                        <select value={c.per} onChange={e => { const u = [...additionalCharges]; u[i] = { ...u[i], per: e.target.value }; setAdditionalCharges(u); }}
                          className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium outline-none focus:border-blue-400 transition-all">
                          <option>Month</option><option>Day</option><option>One-time</option>
                        </select>
                        <button onClick={() => setAdditionalCharges(prev => prev.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <EditTextarea label="Tenant Description" field="tenantDescription" formData={form} setFormData={setForm} rows={3}
                    placeholder="A comfortable stay for students and professionals..." />
                </div>
              </SectionCard>

              {/* Reason for Edit */}
              <SectionCard title="Reason for Edit Request (Optional)" icon={AlertCircle} colorClass="amber">
                <div className="p-4">
                  <EditTextarea label="Why are you making these changes?" field="reason" formData={form} setFormData={setForm} rows={3}
                    placeholder="Helps admin review faster..." />
                </div>
              </SectionCard>
            </>
          )}

          {/* Result */}
          {result && (
            <div className={cn("p-4 rounded-xl border text-sm font-semibold flex items-center gap-2",
              result.success ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700")}>
              {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {result.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 shrink-0">
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200">← Previous</button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={sending} className="px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200">Cancel</button>
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700">
                Next Step →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={sending || result?.success}
                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-200/50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {sending ? "Submitting..." : "Submit Edit Request"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function Properties() {
  const [owner, setOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [mobileTab, setMobileTab] = useState("all");
  const [viewProperty, setViewProperty] = useState(null);
  const [editProperty, setEditProperty] = useState(null);
  const apiBase = getApiBase();

  const loadProps = async (session) => {
    try {
      const props = await fetchOwnerProperties(session.loginId);
      setProperties(props);
    } catch (err) {
      setErrorMsg(err?.body || err?.message || "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = requireOwnerSession();
    if (!session) return;
    setOwner(session);
    loadProps(session);
  }, []);

  const openWebsitePreview = (p) => {
    const propertyId = p?._id || p?.id || p?.visitId;
    if (!propertyId) return;
    window.open(`/website/property-details/${encodeURIComponent(propertyId)}`, "_blank", "noopener,noreferrer");
  };

  const filters = ["All", "PG", "Hostel", "Flat", "Apartment"];
  const filtered = properties.filter(p => {
    const pType = String(p.type || p.propertyType || "").toLowerCase();
    const matchF = filter === "All" || pType === filter.toLowerCase() || pType.includes(filter.toLowerCase());
    const matchS = !search || (p.title || p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.city || "").toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  return (
    <PropertyOwnerLayout owner={owner} title="Properties" onLogout={() => { window.location.href = "/propertyowner/ownerlogin"; }}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 hidden md:flex">
        <div>
          <h1 className="text-[20px] md:text-[44px] font-bold md:font-serif leading-[1.05] text-foreground">Your properties</h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">Manage all your PGs, hostels and flats from one place.</p>
        </div>
        <div className="flex items-center gap-2 md:mt-2">
          <a href="/propertyowner/add-property" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Plus className="size-4" /> Add Property
          </a>
        </div>
      </div>




      {errorMsg && <div className="text-sm text-destructive mb-4 bg-destructive/10 px-4 py-3 rounded-lg">{errorMsg}</div>}

      {/* Filter bar */}
      <div className="hidden md:flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or city…"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-card border border-border text-[13.5px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("h-10 px-3.5 rounded-lg text-[12.5px] font-medium border transition-colors",
                filter === f ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:border-primary/40 text-muted-foreground")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Properties List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft animate-pulse">
              <div className="h-40 bg-muted" /><div className="p-4 space-y-3"><div className="h-5 bg-muted rounded w-2/3" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <>
          <div className="hidden md:flex rounded-2xl border border-border bg-card p-12 shadow-soft flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted/60 rounded-full flex items-center justify-center mb-4"><BedDouble className="size-8 text-muted-foreground" /></div>
            <h3 className="font-serif text-[22px] text-foreground mb-1">No properties found</h3>
            <p className="text-[13.5px] text-muted-foreground mb-4">Add your first property to get started.</p>
            <a href="/propertyowner/add-property" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-blue-600 text-white text-[13px] font-medium hover:bg-blue-700">
              <Plus className="size-4" /> Add Property
            </a>
          </div>
          <div className="block md:hidden">
            <MobileEmptyState
              icon={Home}
              title="No Properties Yet"
              description="You haven't added any properties to manage. Start building your portfolio today."
              actionText="Add Your First Property"
              onAction={() => window.location.href = '/propertyowner/add-property'}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((p) => {
            const occupied = p.occupiedBeds ?? p.tenantCount ?? 0;
            const total = p.bedCount ?? p.totalBeds ?? p.roomCount ?? 1;
            const occ = Math.round((occupied / Math.max(total, 1)) * 100);
            const actualRent = p.monthlyRent || p.rent || 0;
            const discountAmount = p.discount || 0;
            const hasDiscount = discountAmount > 0;
            const originalPrice = hasDiscount ? (actualRent + discountAmount) : actualRent;
            const discountPercent = hasDiscount ? Math.round((discountAmount / originalPrice) * 100) : 0;
            const amenities = p.amenities && p.amenities.length > 0 ? p.amenities : [];
            const displayImage = p.image || (p.images?.[0]) || (p.professionalPhotos?.[0]) || null;
            const cardImages = [...(p.images || []), ...(p.professionalPhotos || []), ...((p.propertyViews || []).flatMap(v => v.images || []))].filter(Boolean);
            const hasPendingChanges = p.pendingChanges?.status === "pending";

            return (
              <div key={p._id}>
                {/* ─── DESKTOP VIEW ─── */}
                <div className="hidden md:flex bg-white rounded-lg shadow-sm hover:shadow-xl transition-all border border-border hover:border-primary/30 overflow-hidden h-[185px] cursor-pointer group">
                  {/* Image */}
                  <div className="w-[280px] h-full flex-shrink-0 relative border-r border-border">
                    <div className="w-full h-full overflow-hidden relative">
                      {displayImage ? (
                        <img src={displayImage} alt={p.title || p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-muted">
                          <Home className="size-10 text-primary/40" />
                        </div>
                      )}
                      {p.status === 'pending_approval' ? (
                        <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Approval
                        </div>
                      ) : p.status === 'blocked' ? (
                        <div className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Blocked
                        </div>
                      ) : p.status === 'inactive' ? (
                        <div className="absolute top-2 left-2 bg-slate-500 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Inactive
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 bg-foreground/80 text-background text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </div>
                      )}
                      {hasPendingChanges && (
                        <div className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending Review
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-[19px] font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                          {p.title || p.name || "Property"}
                        </h3>
                        {p.rating && (
                          <div className="bg-success/90 text-success-foreground px-2 py-0.5 rounded flex items-center gap-1 text-[11px] font-bold shadow-sm shrink-0">
                            {p.rating} <Star className="w-3 h-3 fill-current" />
                          </div>
                        )}
                      </div>
                      <p className="text-[13px] text-muted-foreground font-medium flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5" /> {p.city || "—"}
                      </p>
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground font-medium py-1">
                          {amenities.slice(0, 4).map((amn, i) => (
                            <div key={i} className="flex items-center gap-1.5 shrink-0">
                              <Check className="w-3 h-3" />
                              <span>{typeof amn === "string" ? amn : amn.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">{p.gender || "Any"}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">{p.propertyType || p.type || "PG"}</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-border/60">
                      <div className="flex items-center gap-4 text-[11.5px] font-semibold text-muted-foreground">
                        <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-success" /> Occupancy: {occ}%</div>
                        <div className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5" /> {occupied}/{total} beds</div>
                      </div>
                    </div>
                  </div>
                  {/* Pricing & Actions */}
                  <div className="w-[220px] flex flex-col justify-between border-l border-border p-4 bg-muted/20 shrink-0">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-2">
                        {hasDiscount && <span className="text-[13px] text-muted-foreground line-through font-medium">₹{originalPrice.toLocaleString()}</span>}
                        <div className="text-[22px] font-black text-foreground tracking-tight">₹{actualRent.toLocaleString()}</div>
                      </div>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        {hasDiscount && <div className="text-[11px] font-bold text-success bg-success/15 px-1.5 py-0.5 rounded">{discountPercent}% off</div>}
                        <p className="text-[10px] text-muted-foreground font-medium">+ taxes & fees</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full mt-0">
                      <button onClick={() => setViewProperty(p)}
                        className="flex items-center justify-center gap-1 py-2.5 px-3 border border-border text-foreground font-bold rounded-lg hover:bg-muted text-[11px] transition-all bg-card">
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        onClick={() => openWebsitePreview(p)}
                        className="flex items-center justify-center gap-1 py-2.5 px-3 bg-teal-50 border border-teal-200 text-teal-700 font-bold rounded-lg text-[10px] hover:bg-teal-100 transition-all"
                        title="Preview on Website"
                      >
                        <Globe className="size-3.5" /> Preview
                      </button>
                      <button onClick={() => setEditProperty(p)}
                        className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg text-[11px] hover:bg-blue-700 transition-all shadow-sm">
                        <Edit className="size-3.5" /> Edit
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── MOBILE VIEW (Redesigned) ─── */}
                <div className="flex md:hidden flex-col bg-white border border-slate-100 rounded-[20px] shadow-sm mb-4 overflow-hidden relative">
                  {/* Top Image Banner */}
                  <div className="relative w-full h-[160px] bg-white shrink-0 group mt-3">
                    {cardImages && cardImages.length > 0 ? (
                      <div className="flex overflow-x-auto snap-x snap-mandatory w-full h-full hide-scrollbar gap-2 px-3">
                        {cardImages.map((img, idx) => (
                          <div key={idx} className="w-[48%] h-full shrink-0 snap-center relative rounded-xl overflow-hidden shadow-sm border border-slate-100/50">
                            <img src={img} alt={`${p.title || p.name} ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mx-3 w-[calc(100%-24px)] h-full flex items-center justify-center bg-slate-100 relative rounded-xl overflow-hidden border border-slate-200">
                        <Home className="size-10 text-slate-400" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                      </div>
                    )}

                    {/* Photo count indicator */}
                    {cardImages && cardImages.length > 1 && (
                      <div className="absolute top-2 right-5 bg-black/40 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 z-10">
                        <ImageIcon className="w-3 h-3" /> 1/{cardImages.length}
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-2 left-5 flex flex-col gap-1.5 items-start z-10 pointer-events-none">
                      {p.status === 'pending_approval' ? (
                        <div className="bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider"><Clock className="w-3 h-3" /> Pending Approval</div>
                      ) : p.status === 'blocked' ? (
                        <div className="bg-rose-600 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> Blocked</div>
                      ) : p.status === 'inactive' ? (
                        <div className="bg-slate-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider"><AlertCircle className="w-3 h-3" /> Inactive</div>
                      ) : (
                        <div className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wider"><ShieldCheck className="w-3 h-3" /> Verified</div>
                      )}
                    </div>

                    <div className="absolute bottom-2 left-5 right-5 flex items-end justify-between z-10 pointer-events-none">
                      <div className="flex-1 pr-2">
                        <span className="text-[8px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white px-1.5 py-0.5 rounded mb-1 inline-block">
                          {p.gender || "Any"} • {p.propertyType || p.type || "PG"}
                        </span>
                        <h3 className="text-[16px] font-black text-white leading-tight line-clamp-1">{p.title || p.name || "Property"}</h3>
                        <p className="text-[10px] font-semibold text-white/80 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {p.city || "—"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rent Info Strip */}
                  <div className="px-4 py-2.5 bg-slate-50 border-y border-slate-100 flex items-center justify-between mt-3">
                     <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Monthly Rent</span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-[16px] font-black text-indigo-600">₹{actualRent.toLocaleString()}</span>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase">/mo</span>
                     </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-3 bg-white">
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                           <BedDouble className="w-4 h-4 text-blue-600" />
                         </div>
                         <div>
                           <div className="text-[14px] font-black text-slate-900">{occupied}/{total}</div>
                           <div className="text-[9px] font-bold text-slate-500 uppercase">Beds Filled</div>
                         </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-3">
                         <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
                            <svg className="w-8 h-8 transform -rotate-90 absolute" viewBox="0 0 36 36">
                              <path className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="text-emerald-500" strokeDasharray={`${occ}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <span className="text-[8px] font-black text-slate-800">{occ}%</span>
                         </div>
                         <div>
                           <div className="text-[14px] font-black text-slate-900">Occupancy</div>
                           <div className="text-[9px] font-bold text-slate-500 uppercase">Rate</div>
                         </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button onClick={() => setViewProperty(p)}
                        className="bg-slate-100 text-slate-700 py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openWebsitePreview(p)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-teal-100 transition-colors"
                      >
                        <Globe className="w-4 h-4" /> Preview
                      </button>
                      <button onClick={() => setEditProperty(p)}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5">
                        <Edit className="w-4 h-4" /> Edit Info
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-5 text-[12.5px] text-muted-foreground">
          Total: <span className="font-medium text-foreground">{filtered.length} properties</span>
        </div>
      )}

      {/* Modals */}
      {viewProperty && <PropertyViewModal property={viewProperty} onClose={() => setViewProperty(null)} />}
      {editProperty && (
        <PropertyEditModal
          property={editProperty}
          owner={owner}
          apiBase={apiBase}
          onClose={() => setEditProperty(null)}
          onSuccess={() => { setEditProperty(null); if (owner) loadProps(owner); }}
        />
      )}
    </PropertyOwnerLayout>
  );
}
