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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Visit() {
  const [currentView, setCurrentView] = useState("list");
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVisit, setSelectedVisit] = useState(null);

  const handleDeleteVisit = async (visitId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this visit report?")) return;
    try {
      await fetchJson(`/api/visits/${visitId}`, { method: "DELETE" });
      setVisits(prev => prev.filter(v => v._id !== visitId && v.visitId !== visitId));
      if (selectedVisit && (selectedVisit._id === visitId || selectedVisit.visitId === visitId)) {
        setSelectedVisit(null);
      }
    } catch (err) {
      alert(err?.message || "Failed to delete visit report");
    }
  };

  const handleOpenMap = (v, e) => {
    if (e) e.stopPropagation();
    const loc = `${v.propertyName || ''} ${v.address || ''} ${v.area || ''} ${v.city || ''}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.trim())}`, "_blank");
  };

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
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">View and monitor field inspection visit reports submitted by all employees</p>
         </div>
         {typeof window !== "undefined" && window.location.pathname.startsWith("/employee") && (
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
         )}
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
            <div className="bg-white rounded-b-[2rem] border border-t-0 border-slate-100 shadow-2xl p-8 space-y-8">
              {/* Dark Credentials Card */}
              <div className="bg-slate-900 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-inner">
                    <Lock size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Generated Credentials</p>
                    <div className="flex items-center gap-4">
                      <code className="text-xl font-black text-white tracking-widest">{formLoginId}</code>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <code className="text-base font-bold text-blue-400">{formPassword}</code>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={generateCreds} className="px-6 py-3 bg-white/10 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">Re-generate</button>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 flex-shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                  On onboarding, a <strong>visit record</strong> will be created, an <strong>Owner account</strong> will be set up, and a <strong>KYC email</strong> will be automatically sent to the owner's email address with digital check-in instructions.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => { resetForm(); setCurrentView("list"); }} className="px-10 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-12 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Onboarding...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Onboard Property Owner</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Total Visits" value={stats.total} trend="This Month" up icon={ClipboardCheck} color="blue" />
        <StatCardHorizontal label="Average Time" value="24m" trend="Per Visit" up icon={Clock} color="indigo" />
        <StatCardHorizontal label="Approved Visits" value={stats.approved} trend="Verified" up icon={CheckCircle2} color="emerald" />
        <StatCardHorizontal label="Photos Uploaded" value="842" trend="Total Media" up icon={Camera} color="amber" />
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">All Visit Reports</h3>
                              ) : filteredVisits.map((v, i) => (
                    <tr key={i} onClick={() => setSelectedVisit(v)} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                       <td className="py-3">
                          <p className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 shadow-sm inline-block">#{v._id?.substring(0, 6) || "ERR"}</p>
                          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60 leading-none">{new Date(v.submittedAt || Date.now()).toLocaleDateString()}</p>
                       </td>
                       <td className="py-3">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 shrink-0">
                                <Building2 className="w-4.5 h-4.5" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-800 leading-none truncate max-w-[150px]">{v.propertyName || v.propertyInfo?.name || "Unknown Property"}</p>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 opacity-60 leading-none truncate">
                                   {v.propertyType || v.propertyInfo?.propertyType || "Property"} • {v.area || v.propertyInfo?.area || "Area"}
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="py-3 text-center">
                          <p className="text-[10px] font-bold text-slate-700 leading-none">{v.staffName || v.submittedBy || "System Admin"}</p>
                          <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60 leading-none">ID: {v.staffId || v.submittedById || "ADMIN"}</p>
                       </td>
                       <td className="py-3 text-center">
                          <div className="inline-flex flex-col items-center bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg shadow-sm">
                             <div className="flex text-amber-400 text-[8px] gap-0.5">
                                {[...Array(5)].map((_, idx) => (
                                   <Star key={idx} className={cn("w-2 h-2 fill-current", idx >= (v.cleanlinessRating || 0) && "text-slate-200 fill-slate-200")} />
                                ))}
                             </div>
                             <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-1 leading-none">{v.cleanlinessRating || 0}/5 Rating</p>
                          </div>
                       </td>
                       <td className="py-3 text-center">
                          <div className="flex items-center justify-center -space-x-2.5">
                             {(v.photos || []).slice(0, 2).map((img, idx) => (
                               <div key={idx} className="w-8 h-8 rounded-xl border-2 border-white bg-slate-100 overflow-hidden shadow-sm transition-transform group-hover:scale-105 hover:z-20 relative">
                                  <img src={img} className="w-full h-full object-cover" alt="" />
                               </div>
                             ))}
                             {(v.photos || []).length > 2 && (
                               <div className="w-8 h-8 rounded-xl border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[8px] font-bold shadow-sm z-10 transition-transform group-hover:scale-105">
                                  +{(v.photos || []).length - 2}
                                </div>
                             )}
                          </div>
                       </td>
                       <td className="py-3 text-center">
                          <span className={cn(
                             "text-[7px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm",
                             v.status === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                          )}>
                             {v.status || "Submitted"}
                          </span>
                       </td>
                       <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                             <button onClick={(e) => { e.stopPropagation(); setSelectedVisit(v); }} title="View Visit Report Details" className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-blue-600 transition-all border border-slate-100 shadow-sm"><Eye className="w-3.5 h-3.5" /></button>
                             <button onClick={(e) => handleOpenMap(v, e)} title="View Map Location" className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-indigo-600 transition-all border border-slate-100 shadow-sm"><Map className="w-3.5 h-3.5" /></button>
                             <button onClick={(e) => handleDeleteVisit(v._id || v.visitId, e)} title="Delete Visit Report" className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-rose-600 transition-all border border-slate-100 shadow-sm"><Trash className="w-3.5 h-3.5" /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
      </>
      )}

      {/* Visit Details Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedVisit.propertyName || selectedVisit.propertyInfo?.name || "Visit Details"}</h2>
                <p className="text-xs text-slate-400 font-medium">Submitted by: <strong className="text-slate-700">{selectedVisit.staffName || selectedVisit.submittedBy || "Staff"}</strong> (ID: {selectedVisit.staffId || "STAFF"})</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Details</p>
                <p className="text-slate-900 font-bold text-sm">{selectedVisit.ownerName || selectedVisit.visitorName || "N/A"}</p>
                <p className="text-slate-600">{selectedVisit.ownerPhone || selectedVisit.visitorPhone || "N/A"}</p>
                <p className="text-slate-600">{selectedVisit.ownerEmail || selectedVisit.visitorEmail || "N/A"}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property & Rent</p>
                <p className="text-slate-900 font-bold text-sm">Rent: ₹{selectedVisit.monthlyRent || 0}/mo</p>
                <p className="text-slate-600">Type: {selectedVisit.propertyType || "N/A"} ({selectedVisit.genderSuitability || "Co-ed"})</p>
                <p className="text-slate-600">Location: {selectedVisit.area || ""}, {selectedVisit.city || ""}</p>
              </div>
            </div>

            {selectedVisit.photos && selectedVisit.photos.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Visit Photos ({selectedVisit.photos.length})</p>
                <div className="grid grid-cols-3 gap-3">
                  {selectedVisit.photos.map((url, idx) => (
                    <div key={idx} className="h-28 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button onClick={(e) => handleOpenMap(selectedVisit, e)} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
                <Map className="w-4 h-4" /> Open in Google Maps
              </button>
              <div className="flex items-center gap-2">
                <button onClick={(e) => handleDeleteVisit(selectedVisit._id || selectedVisit.visitId, e)} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
                  <Trash className="w-4 h-4" /> Delete Report
                </button>
                <button onClick={() => setSelectedVisit(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100" 
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md flex items-start gap-3 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none truncate">{label}</p>
         <p className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-2">{value}</p>
         <div className={cn(
           "flex items-center gap-1 text-[7px] font-bold uppercase",
           up ? "text-emerald-600" : "text-rose-600"
         )}>
            {up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {trend}
         </div>
      </div>
    </div>
  );
}
