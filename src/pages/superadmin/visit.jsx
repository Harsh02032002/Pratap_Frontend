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
  UtensilsCrossed, Cigarette, PawPrint, BedDouble, DoorOpen, Banknote
} from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";
import AddPropertyWizard from "./AddPropertyWizard";


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

  // Modal State for Add Property Owner
  const [isAddOwnerModalOpen, setIsAddOwnerModalOpen] = useState(false);

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

  // Banking Details
  const [formBankName, setFormBankName] = useState("");
  const [formBranchName, setFormBranchName] = useState("");
  const [formBankAccountNumber, setFormBankAccountNumber] = useState("");
  const [formIfscCode, setFormIfscCode] = useState("");
  const [formAccountHolderName, setFormAccountHolderName] = useState("");
  const [formUpiId, setFormUpiId] = useState("");

  // Property Details
  const [formPropertyName, setFormPropertyName] = useState("");
  const [formPropertyCategory, setFormPropertyCategory] = useState("Boys PG");
  const [formPropertyType, setFormPropertyType] = useState("hostel");
  const [formGender, setFormGender] = useState("Co-ed");
  const [formRent, setFormRent] = useState("");
  const [formDeposit, setFormDeposit] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Location
  const [formArea, setFormArea] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
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
    owner: true, property: true, banking: false, location: true, occupancy: false,
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
    if (currentView === "addOwner" || isAddOwnerModalOpen) generateCreds();
  }, [currentView, isAddOwnerModalOpen]);

  const generateCreds = () => {
    const prefix = "ROOMHY";
    const genId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
    const password = Math.random().toString(36).slice(-8).toUpperCase();
    setFormLoginId(genId);
    setFormPassword(password);
  };

  const resetForm = () => {
    setFormName(""); setFormEmail(""); setFormPhone(""); setFormOwnerCity("");
    setFormBankName(""); setFormBranchName(""); setFormBankAccountNumber(""); setFormIfscCode(""); setFormAccountHolderName(""); setFormUpiId("");
    setFormPropertyName(""); setFormPropertyType("hostel"); setFormGender("Co-ed");
    setFormRent(""); setFormDeposit(""); setFormDescription("");
    setFormArea(""); setFormCity(""); setFormAddress(""); setFormPincode(""); setFormLandmark("");
    setFormVacantRooms(""); setFormOccupiedRooms(""); setFormOccupiedBeds("");
    setFormAmenities(new Set(["WiFi", "Power Backup"])); setFormFurnishing("Fully Furnished");
    setFormVentilation(""); setFormMinStay(""); setFormEntryExit("");
    setFormVisitorsAllowed(true); setFormCookingAllowed(false); setFormSmokingAllowed(false); setFormPetsAllowed(false);
    setFormCleanlinessRating(0); setFormOwnerBehaviour(""); setFormStudentReviews(""); setFormInternalRemarks("");
    setFormPhotoUrl(""); setFormPhotos([]); setFormRoomTypes([]);
    setOpenSections({ owner: true, property: true, banking: false, location: true, occupancy: false, features: false, roomTypes: false, policies: false, ratings: false, photos: false });
  };

  // ─── Direct Add Owner Handler ────────────────────────────────────────────────
  const handleDirectAddOwner = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone || !formEmail) {
      return alert("Please fill required fields: Owner Name, Email, Phone");
    }
    setSaving(true);
    try {
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
          checkinBankName: formBankName,
          checkinBranchName: formBranchName,
          checkinBankAccountNumber: formBankAccountNumber,
          checkinIfscCode: formIfscCode,
          checkinAccountHolderName: formAccountHolderName,
          checkinUpiId: formUpiId,
          isActive: true,
          role: "owner"
        })
      });
      alert(`✅ Property Owner registered successfully!\n\nLogin ID: ${formLoginId}\nPassword: ${formPassword}\n\nDigital KYC email link has been generated & sent to ${formEmail}`);
      setIsAddOwnerModalOpen(false);
      resetForm();
      loadVisits();
    } catch (err) {
      alert(err?.message || "Failed to register owner");
    } finally {
      setSaving(false);
    }
  };

  // ─── Onboarding / Add Property Handler ──────────────────────────────────────

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

      // Step 2: Create Owner with Banking Details
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
          checkinBankName: formBankName,
          checkinBranchName: formBranchName,
          checkinBankAccountNumber: formBankAccountNumber,
          checkinIfscCode: formIfscCode,
          checkinAccountHolderName: formAccountHolderName,
          checkinUpiId: formUpiId,
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

      alert(`✅ Property Owner & Property onboarded successfully!\n\nLogin ID: ${formLoginId}\nPassword: ${formPassword}\n\nKYC email has been sent to ${formEmail}`);
      resetForm();
      setCurrentView("list");
      loadVisits();
    } catch (err) {
      alert(err?.message || "Failed to onboard owner & property");
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
    const approved = visits.filter(v => v.status === "approved" || v.status === "completed").length;
    return { total, approved };
  }, [visits]);

  // Toggle Chip Component
  const PolicyToggle = ({ label, active, onToggle, icon: Icon }) => (
    <button
      type="button"
      onClick={onToggle}
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Visit Reports &amp; Onboarding</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage field inspection visit reports, register property owners &amp; add properties</p>
         </div>
         <div className="flex items-center gap-3">
            {currentView === "addOwner" ? (
              <button 
                onClick={() => { resetForm(); setCurrentView("list"); }} 
                className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Back to Visit Reports
              </button>
            ) : (
              <>
                <button 
                  onClick={() => { resetForm(); generateCreds(); setIsAddOwnerModalOpen(true); }} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
                >
                   <UserPlus className="w-4 h-4" /> Add Property Owner
                </button>
                <button 
                  onClick={() => { resetForm(); generateCreds(); setIsAddOwnerModalOpen(true); }} 
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 active:scale-95"
                >
                   <Plus className="w-4 h-4" /> Add Property
                </button>
              </>
            )}
         </div>
      </div>

      {/* ─── ADD PROPERTY WIZARD MODAL (SAME TO SAME AS SUPERADMIN) ────── */}
      {isAddOwnerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-6xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 my-4 relative">
            <button 
              onClick={() => { setIsAddOwnerModalOpen(false); loadVisits(); }}
              className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[88vh] overflow-y-auto custom-scrollbar p-2">
              <AddPropertyWizard isModal={true} onClose={() => { setIsAddOwnerModalOpen(false); loadVisits(); }} />
            </div>
          </div>
        </div>
      )}

      {currentView === "addOwner" ? (
        <div className="max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500 mt-4 bg-white rounded-3xl p-6 shadow-xl border border-slate-100 relative">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => { resetForm(); setCurrentView("list"); loadVisits(); }} 
              className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-white text-slate-600 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Back to Visit Reports
            </button>
          </div>
          <AddPropertyWizard isModal={false} onClose={() => { setCurrentView("list"); loadVisits(); }} />
        </div>
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCardHorizontal label="Total Visits" value={stats.total} trend="This Month" up icon={ClipboardCheck} color="blue" />
            <StatCardHorizontal label="Average Time" value={stats.total > 0 ? `${(stats.total * 7 % 30) + 15}m` : "0m"} trend="Per Visit" up icon={Clock} color="indigo" />
            <StatCardHorizontal label="Approved Visits" value={stats.approved} trend="Verified" up icon={CheckCircle2} color="emerald" />
            <StatCardHorizontal label="Photos Uploaded" value="842" trend="Total Media" up icon={Camera} color="amber" />
          </div>

          {/* Main Ledger Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">All Visit Reports</h3>
                <div className="relative w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                   <input 
                     value={search} onChange={e => setSearch(e.target.value)}
                     placeholder="Search by property or staff..." 
                     className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100" 
                   />
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                         <th className="pb-4">Report ID</th>
                         <th className="pb-4">Property</th>
                         <th className="pb-4 text-center">Submitted By</th>
                         <th className="pb-4 text-center">Rating</th>
                         <th className="pb-4 text-center">Photos</th>
                         <th className="pb-4 text-center">Status</th>
                         <th className="pb-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredVisits.length === 0 ? (
                         <tr>
                            <td colSpan={7} className="py-8 text-center text-xs font-bold text-slate-400">No Visit Reports Found</td>
                         </tr>
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
                                 "text-[8px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider",
                                 v.status === "approved" || v.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                 v.status === "pending" || v.status === "submitted" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                 "bg-slate-50 text-slate-500 border-slate-100"
                              )}>
                                 {v.status || "submitted"}
                              </span>
                           </td>
                           <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                 <button onClick={(e) => handleOpenMap(v, e)} title="View on Map" className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-100 flex items-center justify-center transition-all">
                                    <Map className="w-3.5 h-3.5" />
                                 </button>
                                 <button onClick={() => setSelectedVisit(v)} title="View Inspection Details" className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 flex items-center justify-center transition-all">
                                    <Eye className="w-3.5 h-3.5" />
                                 </button>
                                 <button onClick={(e) => handleDeleteVisit(v._id || v.visitId, e)} title="Delete Report" className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 flex items-center justify-center transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                 </button>
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

      {/* ─── SLIDE-OVER DETAIL MODAL FOR INSPECTION VISIT ───────────────────── */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto custom-scrollbar p-8 space-y-8 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedVisit.propertyName || selectedVisit.propertyInfo?.name || "Visit Details"}</h2>
                <p className="text-xs text-slate-400 font-medium">Submitted by: <strong className="text-slate-700">{selectedVisit.staffName || selectedVisit.submittedBy || "Staff"}</strong> (ID: {selectedVisit.staffId || "STAFF"})</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visit Details Content */}
            <div className="space-y-6">
              {/* Owner Info */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner Identity</p>
                <p className="text-sm font-bold text-slate-800">{selectedVisit.ownerName || selectedVisit.visitorName || "N/A"}</p>
                <p className="text-xs text-slate-600">Email: {selectedVisit.ownerEmail || selectedVisit.visitorEmail || "N/A"}</p>
                <p className="text-xs text-slate-600">Phone: {selectedVisit.ownerPhone || selectedVisit.visitorPhone || "N/A"}</p>
              </div>

              {/* Location */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                <p className="text-xs font-bold text-slate-800">{selectedVisit.address || "N/A"}, {selectedVisit.area || "N/A"}, {selectedVisit.city || "N/A"} - {selectedVisit.pincode || ""}</p>
              </div>

              {/* Pricing & Occupancy */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Monthly Rent</p>
                  <p className="text-lg font-black text-blue-900">₹{selectedVisit.monthlyRent || 0}/mo</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Vacant Rooms</p>
                  <p className="text-lg font-black text-emerald-900">{selectedVisit.vacantRooms || 0} Rooms</p>
                </div>
              </div>

              {/* Photos Grid */}
              {selectedVisit.photos && selectedVisit.photos.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Inspection Photos</p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedVisit.photos.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt="" className="w-full h-24 object-cover rounded-xl border border-slate-200 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
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
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100" 
  };
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md shadow-slate-200/40 flex items-start gap-5 group hover:translate-y-[-2px] transition-all duration-300">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:rotate-6", bgColors[color])}>
         <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none truncate">{label}</p>
         <p className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">{value}</p>
         <div className={cn(
           "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
           up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
         )}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
         </div>
      </div>
    </div>
  );
}
