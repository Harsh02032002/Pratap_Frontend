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

  // Credentials & Banking
  const [formLoginId, setFormLoginId] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formBankName, setFormBankName] = useState("");
  const [formBranchName, setFormBranchName] = useState("");
  const [formBankAccountNumber, setFormBankAccountNumber] = useState("");
  const [formIfscCode, setFormIfscCode] = useState("");
  const [formAccountHolderName, setFormAccountHolderName] = useState("");
  const [formUpiId, setFormUpiId] = useState("");

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
      const storedUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");
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
    const genId = `ROOMHY${Math.floor(1000 + Math.random() * 9000)}`;
    const password = Math.random().toString(36).slice(-8).toUpperCase();
    setFormLoginId(genId);
    setFormPassword(password);
  };

  const handleAddOwnerSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone || !formEmail) return alert("Please fill required fields: Owner Name, Email, Phone Number");
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
          locationCode: formArea || formOwnerCity,
          city: formOwnerCity,
          credentials: { password: formPassword, firstTime: true },
          checkinPassword: formPassword,
          checkinBankName: formBankName,
          checkinBranchName: formBranchName,
          checkinBankAccountNumber: formBankAccountNumber,
          checkinIfscCode: formIfscCode,
          checkinAccountHolderName: formAccountHolderName,
          checkinUpiId: formUpiId,
          isEmployeeSubmitted: true,
          status: 'pending_approval',
          kycStatus: 'pending'
        })
      });
      alert(`✅ Property Owner onboarding request submitted for Superadmin approval!\n\nOwner ID: ${formLoginId}\nPassword: ${formPassword}\n\nCredentials will be emailed to ${formEmail} after Superadmin approves the account.`);
      resetForm();
      setShowAddOwnerModal(false);
      setCurrentView("list");
      loadVisits();
    } catch (err) {
      alert(err.message || "Failed to add property owner.");
    } finally {
      setSaving(false);
    }
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

  const storedUser = typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}") : {};
  const userRole = (storedUser?.role || "").toLowerCase();
  const isEmpPage = (typeof window !== "undefined" && window.location.pathname.startsWith("/employee")) || (userRole !== "superadmin" && userRole !== "admin" && (userRole === "employee" || userRole === "staff" || userRole === "areamanager"));
  const [viewingVisit, setViewingVisit] = useState(null);
  const [editingVisit, setEditingVisit] = useState(null);
  const [editVisitForm, setEditVisitForm] = useState({});
  const [savingEditVisit, setSavingEditVisit] = useState(false);
  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);

  const handleSaveVisitEdit = async (e) => {
    e.preventDefault();
    if (!editingVisit?._id) return;
    setSavingEditVisit(true);
    try {
      await fetchJson(`/api/visits/${editingVisit._id}`, {
        method: "PUT",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(editVisitForm)
      });
      alert("✅ Visit report updated successfully!");
      setEditingVisit(null);
      loadVisits();
    } catch (err) {
      alert(err.message || "Failed to update visit report");
    } finally {
      setSavingEditVisit(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Visit Reports</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">View and manage property visit reports</p>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={() => { generateCreds(); setShowAddOwnerModal(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/10 transition-all flex items-center gap-2 active:scale-95">
               <UserPlus className="w-3.5 h-3.5" /> + Add Property Owner
            </button>
            <button onClick={() => setShowAddPropertyModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/10 transition-all flex items-center gap-2 active:scale-95">
               <Plus className="w-3.5 h-3.5" /> + Add Property
            </button>
         </div>
      </div>

      {/* ═══ ADD PROPERTY WIZARD MODAL ═══ */}
      {showAddPropertyModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200/80 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Property Wizard</h3>
                  <p className="text-xs text-slate-500">List a new property with step-by-step details</p>
                </div>
              </div>
              <button onClick={() => setShowAddPropertyModal(false)} className="p-2 hover:bg-slate-200/60 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
              <AddPropertyWizard isModal={true} onClose={() => setShowAddPropertyModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD PROPERTY OWNER MODAL ═══ */}
      {showAddOwnerModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 sm:p-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Property Owner Information</h3>
                  <p className="text-xs text-slate-500">Fill in owner details and banking info to create account.</p>
                </div>
              </div>
              <button onClick={() => setShowAddOwnerModal(false)} className="p-2 hover:bg-slate-200/60 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddOwnerSubmit} className="overflow-y-auto p-6 sm:p-8 flex-1 space-y-6">
              {/* Basic Identity Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Owner Name *</label>
                  <input
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                  <input
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    type="email"
                    placeholder="rahul@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                  <input
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Operating Area / City</label>
                  <input
                    value={formOwnerCity || formArea}
                    onChange={e => { setFormOwnerCity(e.target.value); setFormArea(e.target.value); }}
                    placeholder="e.g. Koramangala, Bangalore"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Banking Details */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <IndianRupee size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Banking & Settlement Details</h4>
                    <p className="text-xs text-slate-400">Used for rent payouts — owner can also edit in their panel</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Bank Name</label>
                    <input value={formBankName} onChange={e => setFormBankName(e.target.value)} placeholder="e.g. State Bank of India" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Branch Name</label>
                    <input value={formBranchName} onChange={e => setFormBranchName(e.target.value)} placeholder="e.g. MG Road Branch" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Bank Account Number</label>
                    <input value={formBankAccountNumber} onChange={e => setFormBankAccountNumber(e.target.value)} placeholder="e.g. 1234567890" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">IFSC Code</label>
                    <input value={formIfscCode} onChange={e => setFormIfscCode(e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Account Holder Name</label>
                    <input value={formAccountHolderName} onChange={e => setFormAccountHolderName(e.target.value)} placeholder="e.g. Rahul Sharma" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">UPI ID <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input value={formUpiId} onChange={e => setFormUpiId(e.target.value)} placeholder="e.g. rahul@upi" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Generated Credentials Banner */}
              <div className="bg-slate-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10 shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Generated Owner Credentials</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-400">ID:</span>
                      <code className="text-sm font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">{formLoginId || "ROOMHY4438"}</code>
                      <span className="text-xs font-semibold text-slate-400 ml-2">Password:</span>
                      <code className="text-sm font-mono font-bold text-blue-400 bg-slate-800 px-2.5 py-1 rounded-lg">{formPassword || "JMA5DXBQ"}</code>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generateCreds}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-2 shrink-0"
                >
                  <RefreshCw size={14} /> Re-generate
                </button>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddOwnerModal(false)}
                  className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {saving ? "Submitting Request..." : "Add Property Owner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ VISITS LIST VIEW ═══ */}
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingVisit(v)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={() => {
                              setEditingVisit(v);
                              setEditVisitForm({
                                propertyName: v.propertyName || v.propertyInfo?.name || "",
                                ownerName: v.ownerName || v.visitorName || "",
                                ownerPhone: v.ownerPhone || v.visitorPhone || "",
                                ownerEmail: v.ownerEmail || v.visitorEmail || "",
                                monthlyRent: v.monthlyRent || 0,
                                area: v.area || "",
                                city: v.city || "",
                                address: v.address || "",
                                internalRemarks: v.internalRemarks || ""
                              });
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* ─── VIEW VISIT MODAL ─────────────────────────────────────────────────── */}
      {viewingVisit && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{viewingVisit.propertyName || "Visit Report Details"}</h3>
                <p className="text-xs text-slate-500">Submitted by: {viewingVisit.staffName || viewingVisit.submittedBy || "Staff"}</p>
              </div>
              <button onClick={() => setViewingVisit(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div><span className="text-slate-400 font-bold block mb-1">Owner Name</span><span className="font-bold text-slate-900">{viewingVisit.ownerName || viewingVisit.visitorName || "N/A"}</span></div>
                <div><span className="text-slate-400 font-bold block mb-1">Owner Phone</span><span className="font-bold text-slate-900">{viewingVisit.ownerPhone || viewingVisit.visitorPhone || "N/A"}</span></div>
                <div><span className="text-slate-400 font-bold block mb-1">Owner Email</span><span className="font-bold text-slate-900">{viewingVisit.ownerEmail || viewingVisit.visitorEmail || "N/A"}</span></div>
                <div><span className="text-slate-400 font-bold block mb-1">City / Area</span><span className="font-bold text-slate-900">{viewingVisit.city || viewingVisit.area || "N/A"}</span></div>
                <div><span className="text-slate-400 font-bold block mb-1">Property Type</span><span className="font-bold text-blue-600 uppercase">{viewingVisit.propertyType || "Hostel"}</span></div>
                <div><span className="text-slate-400 font-bold block mb-1">Monthly Rent</span><span className="font-bold text-emerald-600">₹{viewingVisit.monthlyRent || 0}/mo</span></div>
              </div>

              {viewingVisit.address && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Address</span>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">{viewingVisit.address}</p>
                </div>
              )}

              {viewingVisit.internalRemarks && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Internal Remarks</span>
                  <p className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">{viewingVisit.internalRemarks}</p>
                </div>
              )}

              {Array.isArray(viewingVisit.photos) && viewingVisit.photos.length > 0 && (
                <div>
                  <span className="text-slate-400 font-bold block mb-2">Visit Photos ({viewingVisit.photos.length})</span>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingVisit.photos.map((url, idx) => (
                      <img key={idx} src={url} alt={`Visit photo ${idx+1}`} className="w-full h-24 object-cover rounded-xl border border-slate-200" />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setViewingVisit(null)} className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT VISIT MODAL ─────────────────────────────────────────────────── */}
      {editingVisit && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Visit Report</h3>
                <p className="text-xs text-slate-500">ID: {editingVisit._id}</p>
              </div>
              <button onClick={() => setEditingVisit(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVisitEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Property Name</label>
                <input type="text" value={editVisitForm.propertyName || ""} onChange={e => setEditVisitForm({...editVisitForm, propertyName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Owner Name</label>
                  <input type="text" value={editVisitForm.ownerName || ""} onChange={e => setEditVisitForm({...editVisitForm, ownerName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Owner Phone</label>
                  <input type="text" value={editVisitForm.ownerPhone || ""} onChange={e => setEditVisitForm({...editVisitForm, ownerPhone: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">City / Area</label>
                  <input type="text" value={editVisitForm.city || ""} onChange={e => setEditVisitForm({...editVisitForm, city: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Monthly Rent (₹)</label>
                  <input type="number" value={editVisitForm.monthlyRent || 0} onChange={e => setEditVisitForm({...editVisitForm, monthlyRent: parseFloat(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Address</label>
                <textarea value={editVisitForm.address || ""} onChange={e => setEditVisitForm({...editVisitForm, address: e.target.value})} rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Internal Remarks</label>
                <textarea value={editVisitForm.internalRemarks || ""} onChange={e => setEditVisitForm({...editVisitForm, internalRemarks: e.target.value})} rows={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingVisit(null)} className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingEditVisit} className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5">
                  {savingEditVisit ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
