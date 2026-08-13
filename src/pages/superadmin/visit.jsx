import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, ClipboardCheck, AlertTriangle,
  Camera, Map, Star, Edit3, Trash, RefreshCw,
  Sparkles, Layers, Box, Globe2, IndianRupee,
  Plus, Loader2, Save, Smartphone, Monitor, Info,
  UserPlus, Send, Lock, ChevronDown, Wifi, ShieldCheck,
  UtensilsCrossed, Cigarette, PawPrint, BedDouble, DoorOpen
} from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "hostel", label: "Hostel / PG", icon: Users, color: "blue" },
  { value: "pg", label: "PG / Paying Guest", icon: User, color: "indigo" },
  { value: "apartment", label: "Apartment", icon: Building2, color: "emerald" },
];

const GENDER_OPTIONS = ["Co-ed", "Male Only", "Female Only"];

const AMENITY_LIST = [
  "WiFi", "Power Backup", "24x7 Water", "RO Water", "Air Conditioning",
  "CCTV", "Security Guard", "Attached Bathroom", "Study Table", "Wardrobe",
  "Bed with Mattress", "Kitchen", "Refrigerator", "Geyser",
  "Parking", "Washing Machine", "Gym", "Housekeeping", "Food",
  "TV", "Lounge", "Balcony / Terrace", "Garden", "Lift"
];

const FURNISHING_OPTIONS = ["Fully Furnished", "Semi Furnished", "Unfurnished"];

// ─── Shared Components ────────────────────────────────────────────────────────

const FormField = ({ label, value, onChange, placeholder, type = "text", suffix, prefix, required, className }) => (
  <div className={cn("flex flex-col", className)}>
    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
      {prefix && <span className="text-[10px] font-black text-slate-400 mr-2">{prefix}</span>}
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-300"
      />
      {suffix && <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-tight">{suffix}</span>}
    </div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, open, onToggle, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };
  return (
    <button type="button" onClick={onToggle} className="w-full flex items-center gap-4 p-5 rounded-2xl hover:bg-slate-50/50 transition-all group">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-105", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{title}</p>
        {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", open && "rotate-180")} />
    </button>
  );
};

const SECTION_COLORS = {
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
};

const DetailSection = ({ icon: Icon, title, color = "slate", children }) => (
  <div>
    <div className="flex items-center gap-3 mb-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm", SECTION_COLORS[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">{title}</p>
    </div>
    {children}
  </div>
);

const DetailGrid = ({ cols = 2, children }) => (
  <div className={cn("grid gap-4", cols === 3 ? "grid-cols-2 md:grid-cols-3" : cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2")}>
    {children}
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xs font-bold text-slate-700 break-words">{value || value === 0 ? String(value) : "-"}</p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Visit() {
  const [currentView, setCurrentView] = useState("list");
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewingVisit, setViewingVisit] = useState(null);

  // ─── Form State ─────────────────────────────────────────────────────────────
  // Owner Identity
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formOwnerCity, setFormOwnerCity] = useState("");

  // Property Details
  const [formPropertyName, setFormPropertyName] = useState("");
  const [formPropertyType, setFormPropertyType] = useState("hostel");
  const [formGender, setFormGender] = useState("Co-ed");
  const [formRent, setFormRent] = useState("");
  const [formDeposit, setFormDeposit] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Location
  const [formArea, setFormArea] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formLandmark, setFormLandmark] = useState("");

  // Occupancy
  const [formVacantRooms, setFormVacantRooms] = useState("");
  const [formOccupiedRooms, setFormOccupiedRooms] = useState("");
  const [formOccupiedBeds, setFormOccupiedBeds] = useState("");

  // Features
  const [formAmenities, setFormAmenities] = useState(new Set(["WiFi", "Power Backup"]));
  const [formFurnishing, setFormFurnishing] = useState("Fully Furnished");
  const [formVentilation, setFormVentilation] = useState("");
  const [formMinStay, setFormMinStay] = useState("");
  const [formEntryExit, setFormEntryExit] = useState("");

  // Policies
  const [formVisitorsAllowed, setFormVisitorsAllowed] = useState(true);
  const [formCookingAllowed, setFormCookingAllowed] = useState(false);
  const [formSmokingAllowed, setFormSmokingAllowed] = useState(false);
  const [formPetsAllowed, setFormPetsAllowed] = useState(false);

  // Ratings & Notes
  const [formCleanlinessRating, setFormCleanlinessRating] = useState(0);
  const [formOwnerBehaviour, setFormOwnerBehaviour] = useState("");
  const [formStudentReviews, setFormStudentReviews] = useState("");
  const [formInternalRemarks, setFormInternalRemarks] = useState("");

  // Photos
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formPhotos, setFormPhotos] = useState([]);
  const [formRoomTypes, setFormRoomTypes] = useState([]);

  // Credentials
  const [formLoginId, setFormLoginId] = useState("");
  const [formPassword, setFormPassword] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState({
    owner: true, property: true, location: true, occupancy: false,
    features: false, roomTypes: false, policies: false, ratings: false, photos: false
  });

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAmenity = (a) => setFormAmenities(prev => { const n = new Set(prev); n.has(a) ? n.delete(a) : n.add(a); return n; });

  // ─── Data Loading ───────────────────────────────────────────────────────────

  const loadVisits = async () => {
    try {
      setLoading(true);
      const isEmpPage = window.location.pathname.startsWith("/employee");
      const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      let url = "/api/visits";
      if (isEmpPage && (storedUser.loginId || storedUser.employeeId || storedUser.name)) {
        const sid = storedUser.loginId || storedUser.employeeId || storedUser.name;
        url += `?staffId=${encodeURIComponent(sid)}&staffName=${encodeURIComponent(storedUser.name || "")}`;
      }
      const data = await fetchJson(url);
      const list = data?.visits || data || [];
      setVisits(list);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadVisits(); }, []);

  useEffect(() => {
    if (currentView === "addOwner") generateCreds();
  }, [currentView]);

  const generateCreds = () => {
    const prefix = "OWN";
    const genId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
    const password = Math.random().toString(36).slice(-8).toUpperCase();
    setFormLoginId(genId);
    setFormPassword(password);
  };

  const resetForm = () => {
    setFormName(""); setFormEmail(""); setFormPhone(""); setFormOwnerCity("");
    setFormPropertyName(""); setFormPropertyType("hostel"); setFormGender("Co-ed");
    setFormRent(""); setFormDeposit(""); setFormDescription("");
    setFormArea(""); setFormCity(""); setFormAddress(""); setFormPincode(""); setFormLandmark("");
    setFormVacantRooms(""); setFormOccupiedRooms(""); setFormOccupiedBeds("");
    setFormAmenities(new Set(["WiFi", "Power Backup"])); setFormFurnishing("Fully Furnished");
    setFormVentilation(""); setFormMinStay(""); setFormEntryExit("");
    setFormVisitorsAllowed(true); setFormCookingAllowed(false); setFormSmokingAllowed(false); setFormPetsAllowed(false);
    setFormCleanlinessRating(0); setFormOwnerBehaviour(""); setFormStudentReviews(""); setFormInternalRemarks("");
    setFormPhotoUrl(""); setFormPhotos([]); setFormRoomTypes([]);
    setOpenSections({ owner: true, property: true, location: true, occupancy: false, features: false, roomTypes: false, policies: false, ratings: false, photos: false });
  };

  // ─── Onboarding Handler ─────────────────────────────────────────────────────

  const handleOnboard = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone || !formEmail || !formPropertyName) {
      return alert("Please fill required fields: Owner Name, Email, Phone, Property Name");
    }
    setSaving(true);
    try {
      // Step 1: Submit Visit
      const visitId = `v_${Date.now()}`;
      await fetchJson("/api/visits/submit", {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: formName,
          visitorEmail: formEmail,
          visitorPhone: formPhone,
          propertyName: formPropertyName,
          propertyType: formPropertyType,
          genderSuitability: formGender,
          monthlyRent: formRent ? parseInt(formRent) : 0,
          deposit: formDeposit,
          description: formDescription,
          city: formCity || formOwnerCity,
          area: formArea,
          address: formAddress,
          pincode: formPincode,
          landmark: formLandmark,
          ownerName: formName,
          ownerEmail: formEmail,
          ownerPhone: formPhone,
          ownerCity: formOwnerCity || formCity,
          vacantRooms: formVacantRooms ? parseInt(formVacantRooms) : 0,
          occupiedRooms: formOccupiedRooms ? parseInt(formOccupiedRooms) : 0,
          occupiedBeds: formOccupiedBeds ? parseInt(formOccupiedBeds) : 0,
          amenities: Array.from(formAmenities),
          furnishing: formFurnishing,
          ventilation: formVentilation,
          minStay: formMinStay,
          entryExit: formEntryExit,
          visitorsAllowed: formVisitorsAllowed ? "yes" : "no",
          cookingAllowed: formCookingAllowed ? "yes" : "no",
          smokingAllowed: formSmokingAllowed ? "yes" : "no",
          petsAllowed: formPetsAllowed ? "yes" : "no",
          cleanlinessRating: formCleanlinessRating,
          ownerBehaviour: formOwnerBehaviour,
          studentReviews: formStudentReviews,
          internalRemarks: formInternalRemarks,
          photos: formPhotos,
          roomTypes: formRoomTypes,
          staffName: JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}").name || "Staff Member",
          staffId: JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}").loginId || "STAFF",
          _id: visitId,
        }),
      });

      // Step 2: Create Owner (auto-sends KYC email via backend)
      await fetchJson("/api/owners", {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: formLoginId,
          name: formName,
          email: formEmail,
          phone: formPhone,
          area: formArea || formCity,
          city: formOwnerCity || formCity,
          locationCode: (formArea || formCity || formLoginId).toUpperCase().slice(0, 5),
          credentials: { password: formPassword, firstTime: true },
          checkinPassword: formPassword,
          isActive: true,
          role: "owner",
        }),
      });

      // Step 3: Auto-approve the visit
      try {
        await fetchJson(`/api/visits/${visitId}/approve`, {
          method: "POST",
          headers: { ...getAuthHeader(), "Content-Type": "application/json" },
          body: JSON.stringify({
            approvalNotes: "Auto-approved during superadmin onboarding",
            approvedBy: "Superadmin",
          }),
        });
      } catch (approveErr) {
        console.warn("Visit auto-approve warning:", approveErr.message);
      }

      alert(`✅ Property Owner onboarded successfully!\n\nLogin ID: ${formLoginId}\nPassword: ${formPassword}\n\nKYC email has been sent to ${formEmail}`);
      resetForm();
      setCurrentView("list");
      loadVisits();
    } catch (err) {
      alert(err?.message || "Failed to onboard owner");
      console.error("Onboard error:", err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Photo Helpers ──────────────────────────────────────────────────────────

  const addPhotoUrl = () => {
    if (formPhotoUrl.trim()) {
      setFormPhotos(prev => [...prev, formPhotoUrl.trim()]);
      setFormPhotoUrl("");
    }
  };

  const removePhoto = (idx) => setFormPhotos(prev => prev.filter((_, i) => i !== idx));

  // ─── List helpers ───────────────────────────────────────────────────────────

  const filteredVisits = useMemo(() => {
    const q = search.toLowerCase();
    return visits.filter(v => {
      const propName = (v.propertyName || v.propertyInfo?.name || "").toLowerCase();
      const staffName = (v.staffName || v.submittedBy || "").toLowerCase();
      return propName.includes(q) || staffName.includes(q);
    });
  }, [visits, search]);

  const stats = useMemo(() => {
    const total = visits.length;
    const approved = visits.filter(v => v.status === "approved").length;
    return { total, approved, pending: total - approved };
  }, [visits]);

  // ─── Toggle Pill Component ──────────────────────────────────────────────────
  const TogglePill = ({ label, icon: Icon, active, onClick }) => (
    <button type="button" onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
        active
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
          : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
      )}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
      <div className={cn("w-8 h-4 rounded-full relative transition-all ml-1", active ? "bg-emerald-500" : "bg-slate-200")}>
        <div className={cn("w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all shadow-sm", active ? "left-[18px]" : "left-0.5")} />
      </div>
    </button>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Visit Reports</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">View and manage property visit reports</p>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={() => { if (currentView === "addOwner") resetForm(); setCurrentView(currentView === "addOwner" ? "list" : "addOwner"); }} className={cn(
              "px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg transition-all flex items-center gap-2",
              currentView === "addOwner" ? "bg-white text-slate-600 border border-slate-100 shadow-slate-200" : "bg-slate-800 text-white shadow-slate-800/10 hover:bg-slate-900"
            )}>
               {currentView === "addOwner" ? <RefreshCw className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
               {currentView === "addOwner" ? "Back to Visits" : "Add Property Owner"}
            </button>
            {currentView === "list" && (
              <button onClick={() => setCurrentView("addOwner")} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-2">
                 <Plus className="w-3.5 h-3.5" /> Add New Visit
              </button>
            )}
         </div>
      </div>

      {currentView === "addOwner" ? (
        /* ═══ ADD PROPERTY OWNER — COMPREHENSIVE FORM ═══ */
        <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 mt-4">
          {/* Form Header */}
          <div className="bg-white rounded-t-[2rem] border border-b-0 border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-8 bg-gradient-to-br from-slate-50 to-white flex items-center gap-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-900/30">
                <UserPlus size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Onboard Property Owner</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fill in property visit details and onboard owner with auto KYC</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleOnboard}>
            <div className="bg-white border-x border-slate-100 shadow-2xl divide-y divide-slate-50">

              {/* ─── Section 1: Owner Identity ──────────────────────────────── */}
              <div>
                <SectionHeader icon={User} title="Owner Identity" subtitle="Primary contact information" open={openSections.owner} onToggle={() => toggleSection("owner")} color="blue" />
                {openSections.owner && (
                  <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Owner Name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Rahul Sharma" required />
                    <FormField label="Email Address" value={formEmail} onChange={e => setFormEmail(e.target.value)} type="email" placeholder="rahul@example.com" required />
                    <FormField label="Phone Number" value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+91 XXXX XXXXXX" prefix="+91" required />
                    <FormField label="Owner City" value={formOwnerCity} onChange={e => setFormOwnerCity(e.target.value)} placeholder="e.g. Indore" />
                  </div>
                )}
              </div>

              {/* ─── Section 2: Property Details ────────────────────────────── */}
              <div>
                <SectionHeader icon={Building2} title="Property Details" subtitle="Property name, type, rent & deposit" open={openSections.property} onToggle={() => toggleSection("property")} color="indigo" />
                {openSections.property && (
                  <div className="px-8 pb-8 space-y-6">
                    <FormField label="Property Name" value={formPropertyName} onChange={e => setFormPropertyName(e.target.value)} placeholder="e.g. Sunshine Boys PG" required />
                    
                    {/* Property Type Cards */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Property Type</label>
                      <div className="grid grid-cols-3 gap-4">
                        {PROPERTY_TYPES.map(pt => {
                          const Icon = pt.icon;
                          const active = formPropertyType === pt.value;
                          return (
                            <button key={pt.value} type="button" onClick={() => setFormPropertyType(pt.value)}
                              className={cn("p-4 rounded-2xl border-2 text-left transition-all relative group",
                                active ? "border-blue-600 bg-blue-50/50" : "border-slate-100 hover:border-slate-200"
                              )}>
                              {active && <div className="absolute top-3 right-3 bg-blue-600 rounded-full p-0.5 shadow-lg"><Check className="w-3 h-3 text-white" /></div>}
                              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all", active ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-400")}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <p className="text-[11px] font-bold text-slate-700">{pt.label}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Gender Selector */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Gender Suitability</label>
                      <div className="flex gap-3">
                        {GENDER_OPTIONS.map(g => (
                          <button key={g} type="button" onClick={() => setFormGender(g)}
                            className={cn("px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                              formGender === g ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                            )}>
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="Monthly Rent" value={formRent} onChange={e => setFormRent(e.target.value)} placeholder="8000" prefix="₹" suffix="/mo" type="number" />
                      <FormField label="Security Deposit" value={formDeposit} onChange={e => setFormDeposit(e.target.value)} placeholder="10000" prefix="₹" type="number" />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Description</label>
                      <textarea rows={3} value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Brief property description..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none resize-none focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all placeholder:text-slate-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Section 3: Location ─────────────────────────────────────── */}
              <div>
                <SectionHeader icon={MapPin} title="Location" subtitle="Area, city, address & pincode" open={openSections.location} onToggle={() => toggleSection("location")} color="emerald" />
                {openSections.location && (
                  <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Area / Locality" value={formArea} onChange={e => setFormArea(e.target.value)} placeholder="e.g. Koramangala" required />
                    <FormField label="City" value={formCity} onChange={e => setFormCity(e.target.value)} placeholder="e.g. Bangalore" required />
                    <FormField label="Full Address" value={formAddress} onChange={e => setFormAddress(e.target.value)} placeholder="House/building, street..." className="md:col-span-2" />
                    <FormField label="Pincode" value={formPincode} onChange={e => setFormPincode(e.target.value)} placeholder="560034" />
                    <FormField label="Nearby Landmark" value={formLandmark} onChange={e => setFormLandmark(e.target.value)} placeholder="Near Christ University" />
                  </div>
                )}
              </div>

              {/* ─── Section 4: Occupancy ────────────────────────────────────── */}
              <div>
                <SectionHeader icon={BedDouble} title="Occupancy" subtitle="Rooms & beds info" open={openSections.occupancy} onToggle={() => toggleSection("occupancy")} color="amber" />
                {openSections.occupancy && (
                  <div className="px-8 pb-8 grid grid-cols-3 gap-6">
                    <FormField label="Vacant Rooms" value={formVacantRooms} onChange={e => setFormVacantRooms(e.target.value)} placeholder="10" type="number" />
                    <FormField label="Occupied Rooms" value={formOccupiedRooms} onChange={e => setFormOccupiedRooms(e.target.value)} placeholder="5" type="number" />
                    <FormField label="Occupied Beds" value={formOccupiedBeds} onChange={e => setFormOccupiedBeds(e.target.value)} placeholder="12" type="number" />
                  </div>
                )}
              </div>

              {/* ─── Section 5: Features & Amenities ─────────────────────────── */}
              <div>
                <SectionHeader icon={Zap} title="Features & Amenities" subtitle="Amenities, furnishing, ventilation" open={openSections.features} onToggle={() => toggleSection("features")} color="violet" />
                {openSections.features && (
                  <div className="px-8 pb-8 space-y-6">
                    {/* Amenities Chips */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Amenities</label>
                      <div className="flex flex-wrap gap-2">
                        {AMENITY_LIST.map(a => (
                          <button key={a} type="button" onClick={() => toggleAmenity(a)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-bold border transition-all",
                              formAmenities.has(a)
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            )}>
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Furnishing */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Furnishing</label>
                      <div className="flex gap-3">
                        {FURNISHING_OPTIONS.map(f => (
                          <button key={f} type="button" onClick={() => setFormFurnishing(f)}
                            className={cn("px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                              formFurnishing === f ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200" : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                            )}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <FormField label="Ventilation" value={formVentilation} onChange={e => setFormVentilation(e.target.value)} placeholder="Good / Average" />
                      <FormField label="Minimum Stay" value={formMinStay} onChange={e => setFormMinStay(e.target.value)} placeholder="e.g. 3 Months" />
                      <FormField label="Entry / Exit" value={formEntryExit} onChange={e => setFormEntryExit(e.target.value)} placeholder="e.g. 24/7" />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Section 5.5: Room Configurations ────────────────────────── */}
              <div>
                <SectionHeader icon={BedDouble} title="Room Configurations" subtitle="Configure room types and pricing" open={openSections.roomTypes} onToggle={() => toggleSection("roomTypes")} color="violet" />
                {openSections.roomTypes && (
                  <div className="px-8 pb-8 space-y-6">
                    <div className="space-y-4">
                      {formRoomTypes.map((rt, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative space-y-4">
                          <button type="button" onClick={() => setFormRoomTypes(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-4 right-4 bg-rose-50 text-rose-600 p-2 rounded-xl border border-rose-100 hover:bg-rose-100 hover:text-rose-700 transition-all">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-10">
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Room Type / Sharing</label>
                              <input type="text" value={rt.type} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].type = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. Double Sharing AC" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Description</label>
                              <input type="text" value={rt.desc} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].desc = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. Attached washroom, study desk" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Occupancy (Beds per Room)</label>
                              <input type="number" value={rt.occupancy} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].occupancy = parseInt(e.target.value) || 1;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 2" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Rooms</label>
                              <input type="text" value={rt.totalRooms} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].totalRooms = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 5" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Total Beds</label>
                              <input type="text" value={rt.totalBeds} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].totalBeds = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 10" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Price Per Bed (₹/mo)</label>
                              <input type="text" value={rt.pricePerBed} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].pricePerBed = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 7500" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Price Per Room (₹/mo)</label>
                              <input type="text" value={rt.pricePerRoom} onChange={e => {
                                const newTypes = [...formRoomTypes];
                                newTypes[idx].pricePerRoom = e.target.value;
                                setFormRoomTypes(newTypes);
                              }} placeholder="e.g. 15000" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-200" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setFormRoomTypes(prev => [...prev, { type: "", desc: "", totalRooms: "", totalBeds: "", occupancy: 1, pricePerBed: "", pricePerRoom: "" }])}
                      className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-blue-300 text-slate-500 hover:text-blue-600 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 bg-white">
                      <Plus className="w-4 h-4" /> Add Room Configuration
                    </button>
                  </div>
                )}
              </div>

              {/* ─── Section 6: Policies ──────────────────────────────────────── */}
              <div>
                <SectionHeader icon={ShieldCheck} title="Policies" subtitle="Visitors, cooking, smoking, pets" open={openSections.policies} onToggle={() => toggleSection("policies")} color="cyan" />
                {openSections.policies && (
                  <div className="px-8 pb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <TogglePill label="Visitors" icon={Users} active={formVisitorsAllowed} onClick={() => setFormVisitorsAllowed(!formVisitorsAllowed)} />
                      <TogglePill label="Cooking" icon={UtensilsCrossed} active={formCookingAllowed} onClick={() => setFormCookingAllowed(!formCookingAllowed)} />
                      <TogglePill label="Smoking" icon={Cigarette} active={formSmokingAllowed} onClick={() => setFormSmokingAllowed(!formSmokingAllowed)} />
                      <TogglePill label="Pets" icon={PawPrint} active={formPetsAllowed} onClick={() => setFormPetsAllowed(!formPetsAllowed)} />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Section 7: Ratings & Notes ───────────────────────────────── */}
              <div>
                <SectionHeader icon={Star} title="Ratings & Notes" subtitle="Cleanliness, reviews, internal remarks" open={openSections.ratings} onToggle={() => toggleSection("ratings")} color="orange" />
                {openSections.ratings && (
                  <div className="px-8 pb-8 space-y-6">
                    {/* Star Rating */}
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Cleanliness Rating</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} type="button" onClick={() => setFormCleanlinessRating(s)}
                            className="transition-all hover:scale-110 active:scale-95">
                            <Star className={cn("w-8 h-8 transition-colors", s <= formCleanlinessRating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                          </button>
                        ))}
                        <span className="ml-3 text-sm font-bold text-slate-500">{formCleanlinessRating}/5</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Owner Behaviour" value={formOwnerBehaviour} onChange={e => setFormOwnerBehaviour(e.target.value)} placeholder="Cooperative, Friendly..." />
                      <FormField label="Student Reviews" value={formStudentReviews} onChange={e => setFormStudentReviews(e.target.value)} placeholder="What students say..." />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Internal Remarks (Private)</label>
                      <textarea rows={3} value={formInternalRemarks} onChange={e => setFormInternalRemarks(e.target.value)} placeholder="Internal notes for superadmin only..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none resize-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300" />
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Section 8: Photos ────────────────────────────────────────── */}
              <div>
                <SectionHeader icon={Camera} title="Photos" subtitle="Property photos" open={openSections.photos} onToggle={() => toggleSection("photos")} color="rose" />
                {openSections.photos && (
                  <div className="px-8 pb-8 space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <FormField label="Photo URL" value={formPhotoUrl} onChange={e => setFormPhotoUrl(e.target.value)} placeholder="https://example.com/photo.jpg" />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={addPhotoUrl}
                          className="px-5 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      </div>
                    </div>

                    {formPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {formPhotos.map((url, idx) => (
                          <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                            <img src={url} alt="" className="w-full h-full object-cover" onError={e => e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23cbd5e1' viewBox='0 0 24 24'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E"} />
                            <button type="button" onClick={() => removePhoto(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Credentials Card + Actions ───────────────────────────────── */}
            <div className="bg-white rounded-b-[2rem] border border-t-0 border-slate-100 shadow-2xl p-8 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                    <Lock size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto Generated Credentials</p>
                    <p className="text-sm font-bold mt-0.5">Login ID: <span className="font-mono text-blue-400 font-bold">{formLoginId}</span> • Temp Password: <span className="font-mono text-emerald-400 font-bold">{formPassword}</span></p>
                  </div>
                </div>
                <button type="button" onClick={generateCreds} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-slate-700 transition-all flex items-center gap-2">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { resetForm(); setCurrentView("list"); }} className="px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Onboarding Owner..." : "Onboard Property Owner"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* ═══ VISITS LIST VIEW ═══ */
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Visit Reports</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved / Onboarded</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Review</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by property name or staff member..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300" />
            </div>
            <button onClick={loadVisits} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-100 transition-all">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="p-4 pl-6">Property / Owner</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Type / Rent</th>
                  <th className="p-4">Submitted By</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">Loading visits...</td></tr>
                ) : filteredVisits.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">No visit reports found</td></tr>
                ) : (
                  filteredVisits.map((v, i) => (
                    <tr key={v._id || i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-bold text-slate-800">{v.propertyName || v.propertyInfo?.name || "Unnamed Property"}</p>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">{v.ownerName || v.visitorName} • {v.ownerPhone || v.visitorPhone}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700">{v.area || v.city || "-"}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{v.city}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700 uppercase">{v.propertyType || "Hostel"}</p>
                        <p className="text-[10px] text-blue-600 font-bold">₹{v.monthlyRent || 0}/mo</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700">{v.staffName || v.submittedBy || "Staff"}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{new Date(v.submittedAt || Date.now()).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider",
                          v.status === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                        )}>
                          {v.status || "pending"}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button onClick={() => setViewingVisit(v)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-all">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VIEW DETAILS MODAL ═══ */}
      {viewingVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingVisit(null)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20 shrink-0">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">{viewingVisit.propertyName || viewingVisit.propertyInfo?.name || "Unnamed Property"}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Submitted by {viewingVisit.staffName || viewingVisit.submittedBy || "Staff"} • {new Date(viewingVisit.submittedAt || Date.now()).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={cn(
                  "px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                  viewingVisit.status === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                )}>
                  {viewingVisit.status || "pending"}
                </span>
                <button onClick={() => setViewingVisit(null)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-8 space-y-8 flex-1">
              <DetailSection icon={User} title="Owner Information" color="blue">
                <DetailGrid>
                  <DetailItem label="Owner Name" value={viewingVisit.ownerName || viewingVisit.visitorName} />
                  <DetailItem label="Email" value={viewingVisit.ownerEmail || viewingVisit.visitorEmail} />
                  <DetailItem label="Phone" value={viewingVisit.ownerPhone || viewingVisit.visitorPhone} />
                  <DetailItem label="Owner City" value={viewingVisit.ownerCity} />
                </DetailGrid>
              </DetailSection>

              <DetailSection icon={Building2} title="Property Details" color="indigo">
                <DetailGrid>
                  <DetailItem label="Property Type" value={viewingVisit.propertyType} />
                  <DetailItem label="Gender Suitability" value={viewingVisit.genderSuitability || viewingVisit.gender} />
                  <DetailItem label="Monthly Rent" value={viewingVisit.monthlyRent ? `₹${viewingVisit.monthlyRent}/mo` : ""} />
                  <DetailItem label="Deposit" value={viewingVisit.deposit ? `₹${viewingVisit.deposit}` : ""} />
                </DetailGrid>
                {viewingVisit.description && (
                  <p className="mt-4 text-xs font-semibold text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">{viewingVisit.description}</p>
                )}
              </DetailSection>

              <DetailSection icon={MapPin} title="Location" color="emerald">
                <DetailGrid>
                  <DetailItem label="Area" value={viewingVisit.area} />
                  <DetailItem label="City" value={viewingVisit.city} />
                  <DetailItem label="Pincode" value={viewingVisit.pincode} />
                  <DetailItem label="Landmark" value={viewingVisit.landmark} />
                </DetailGrid>
                {viewingVisit.address && (
                  <p className="mt-4 text-xs font-semibold text-slate-600">{viewingVisit.address}</p>
                )}
              </DetailSection>

              <DetailSection icon={BedDouble} title="Occupancy" color="amber">
                <DetailGrid cols={3}>
                  <DetailItem label="Vacant Rooms" value={viewingVisit.vacantRooms} />
                  <DetailItem label="Occupied Rooms" value={viewingVisit.occupiedRooms} />
                  <DetailItem label="Occupied Beds" value={viewingVisit.occupiedBeds} />
                </DetailGrid>
              </DetailSection>

              {viewingVisit.amenities?.length > 0 && (
                <DetailSection icon={Zap} title="Amenities & Features" color="violet">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {viewingVisit.amenities.map((a, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">{a}</span>
                    ))}
                  </div>
                  <DetailGrid cols={3}>
                    <DetailItem label="Furnishing" value={viewingVisit.furnishing} />
                    <DetailItem label="Ventilation" value={viewingVisit.ventilation} />
                    <DetailItem label="Min Stay" value={viewingVisit.minStay} />
                  </DetailGrid>
                </DetailSection>
              )}

              {viewingVisit.roomTypes?.length > 0 && (
                <DetailSection icon={BedDouble} title="Room Configurations" color="violet">
                  <div className="space-y-3">
                    {viewingVisit.roomTypes.map((rt, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <DetailItem label="Type" value={rt.type} />
                        <DetailItem label="Rooms / Beds" value={`${rt.totalRooms || 0} / ${rt.totalBeds || 0}`} />
                        <DetailItem label="Price / Bed" value={rt.pricePerBed ? `₹${rt.pricePerBed}` : ""} />
                        <DetailItem label="Price / Room" value={rt.pricePerRoom ? `₹${rt.pricePerRoom}` : ""} />
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              <DetailSection icon={ShieldCheck} title="Policies" color="cyan">
                <DetailGrid cols={4}>
                  <DetailItem label="Visitors" value={viewingVisit.visitorsAllowed ? "Allowed" : "Not Allowed"} />
                  <DetailItem label="Cooking" value={viewingVisit.cookingAllowed ? "Allowed" : "Not Allowed"} />
                  <DetailItem label="Smoking" value={viewingVisit.smokingAllowed ? "Allowed" : "Not Allowed"} />
                  <DetailItem label="Pets" value={viewingVisit.petsAllowed ? "Allowed" : "Not Allowed"} />
                </DetailGrid>
              </DetailSection>

              {(viewingVisit.cleanlinessRating > 0 || viewingVisit.ownerBehaviour || viewingVisit.studentReviews || viewingVisit.internalRemarks) && (
                <DetailSection icon={Star} title="Ratings & Notes" color="orange">
                  {viewingVisit.cleanlinessRating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={cn("w-5 h-5", s <= viewingVisit.cleanlinessRating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                      ))}
                      <span className="text-xs font-bold text-slate-500 ml-1">{viewingVisit.cleanlinessRating}/5 Cleanliness</span>
                    </div>
                  )}
                  <DetailGrid>
                    <DetailItem label="Owner Behaviour" value={viewingVisit.ownerBehaviour} />
                    <DetailItem label="Student Reviews" value={viewingVisit.studentReviews} />
                  </DetailGrid>
                  {viewingVisit.internalRemarks && (
                    <p className="mt-4 text-xs font-semibold text-slate-600 bg-amber-50/50 rounded-xl p-4 border border-amber-100">{viewingVisit.internalRemarks}</p>
                  )}
                </DetailSection>
              )}

              {viewingVisit.photos?.length > 0 && (
                <DetailSection icon={Camera} title="Photos" color="rose">
                  <div className="flex flex-wrap gap-3">
                    {viewingVisit.photos.map((url, idx) => (
                      <img key={idx} src={url} alt="" className="w-24 h-24 rounded-xl object-cover border border-slate-100 shadow-sm" />
                    ))}
                  </div>
                </DetailSection>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
