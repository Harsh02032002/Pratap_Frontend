import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Building2, Users, Shield, Clock, Search,
  Filter, MapPin, Sheet, Trash2,
  ChevronRight, ChevronLeft, Phone, Mail, User, RefreshCw,
  Loader2, ShieldCheck, CheckCircle2, AlertCircle,
  Calendar, Fingerprint, Banknote,
  Eye, UserPlus, FileCheck, ClipboardList, FileText,
  ShieldAlert, Send, Save, Lock, Plus, X
} from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { StatCard } from "../../components/superadmin/StatCard";
import OwnerAgreementModal from "../../components/superadmin/OwnerAgreementModal";
import * as XLSX from 'xlsx';

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function Owner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get("view") || "list";
  
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [agreementModalOwner, setAgreementModalOwner] = useState(null);
  const [isUpdatingKyc, setIsUpdatingKyc] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [editOwnerForm, setEditOwnerForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formLoginId, setFormLoginId] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Banking fields
  const [formBankName, setFormBankName] = useState("");
  const [formBranchName, setFormBranchName] = useState("");
  const [formBankAccountNumber, setFormBankAccountNumber] = useState("");
  const [formIfscCode, setFormIfscCode] = useState("");
  const [formAccountHolderName, setFormAccountHolderName] = useState("");
  const [formUpiId, setFormUpiId] = useState("");

  const loadOwners = async () => {
    // Check for authentication token
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      window.location.href = "/superadmin/login";
      return;
    }

    try {
      setLoading(true);
      const [res, visitsRes] = await Promise.all([
        fetchJson("/api/owners"),
        fetchJson("/api/visits").catch(() => ({ visits: [] }))
      ]);
      
      const baseOwners = Array.isArray(res) ? res : (res.data || res.owners || []);
      const visits = visitsRes.visits || [];
      
      const visitMap = {};
      visits.forEach(v => {
        const id = v.generatedCredentials?.loginId || "";
        if (id) {
          visitMap[id] = {
            vacantRooms: v.vacantRooms || v.propertyInfo?.vacantRooms || 0,
            vacantBeds: v.vacantBeds || v.propertyInfo?.vacantBeds || 0,
            occupiedRooms: v.occupiedRooms || v.propertyInfo?.occupiedRooms || 0,
            occupiedBeds: v.occupiedBeds || v.propertyInfo?.occupiedBeds || 0,
            monthlyRent: v.monthlyRent || v.propertyInfo?.rent || 0,
            deposit: v.deposit || v.propertyInfo?.deposit || 0
          };
        }
      });

      setOwners(baseOwners.map(o => ({
        ...o,
        ...(visitMap[o.loginId] || {})
      })));
    } catch (err) { 
      console.error("Failed to load owners:", err);
      // If auth error, redirect to login
      if (err?.message?.includes("Not authorized") || err?.status === 401) {
        window.location.href = "/superadmin/login";
      }
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOwners(); }, []);

  useEffect(() => {
    if (currentView === "add") generateCreds();
  }, [currentView]);

  const generateCreds = () => {
    const genId = `ROOMHY${Math.floor(1000 + Math.random() * 9000)}`;
    const password = Math.random().toString(36).slice(-8).toUpperCase();
    setFormLoginId(genId);
    setFormPassword(password);
  };

  const handleAddOwner = async (e) => {
    e.preventDefault();
    if (!formName || !formPhone || !formEmail) return alert("Please fill in all required fields.");
    setSaving(true);
    try {
      await fetchJson("/api/owners", {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({
          loginId: formLoginId,
          name: formName,
          email: formEmail,
          phone: formPhone,
          locationCode: formArea || formCity,
          credentials: { password: formPassword, firstTime: true },
          checkinPassword: formPassword,
          checkinBankName: formBankName,
          checkinBranchName: formBranchName,
          checkinBankAccountNumber: formBankAccountNumber,
          checkinIfscCode: formIfscCode,
          checkinAccountHolderName: formAccountHolderName,
          checkinUpiId: formUpiId
        })
      });
      alert("Property Owner added successfully! Account credentials have been generated.");
      setSearchParams({ view: "list" });
      loadOwners();
    } catch (err) { alert(err.message || "Failed to add property owner."); }
    finally { setSaving(false); }
  };

  const handleSaveEdit = async () => {
    if (!selectedOwner) return;
    setSavingEdit(true);
    try {
      const id = selectedOwner.loginId || selectedOwner._id;
      const payload = {
        email: editOwnerForm.email,
        checkinEmail: editOwnerForm.email,
        phone: editOwnerForm.phone,
        checkinPhone: editOwnerForm.phone,
        checkinDob: editOwnerForm.checkinDob,
        address: editOwnerForm.address,
        checkinAddress: editOwnerForm.address,
        bankName: editOwnerForm.bankName,
        checkinBankName: editOwnerForm.bankName,
        accountNumber: editOwnerForm.accountNumber,
        checkinBankAccountNumber: editOwnerForm.accountNumber,
        ifscCode: editOwnerForm.ifscCode,
        checkinIfscCode: editOwnerForm.ifscCode,
        branchName: editOwnerForm.branchName,
        checkinBranchName: editOwnerForm.branchName,
        checkinAccountHolderName: editOwnerForm.accountHolderName,
        checkinUpiId: editOwnerForm.checkinUpiId
      };
      
      await fetchJson(`/api/owners/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
      });
      
      alert("Owner details updated successfully!");
      setIsEditingOwner(false);
      loadOwners();
      setSelectedOwner(prev => ({
        ...prev,
        ...payload
      }));
    } catch (err) {
      alert("Failed to update owner details: " + (err.body?.message || err.message));
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredOwners = useMemo(() => {
    const query = search.trim().toLowerCase();
    let base = owners;
    
    if (currentView === "pending") {
      base = owners.filter(o => !o.isActive);
    } else if (currentView === "kyc") {
      base = owners; // Show all owners in KYC view, status displayed in table
    }

    return base.filter(o => {
      const id = (o.loginId || o._id || "").toString().toLowerCase();
      const name = (o.name || o.profile?.name || "").toLowerCase();
      const area = (o.locationCode || o.checkinArea || "").toLowerCase();
      const matchesSearch = id.includes(query) || name.includes(query);
      const matchesArea = areaFilter === "all" || area.includes(areaFilter.toLowerCase());
      return matchesSearch && matchesArea;
    });
  }, [owners, search, areaFilter, currentView]);

  const LIMIT = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalRecords = filteredOwners.length;
  const totalPages = Math.ceil(totalRecords / LIMIT) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedOwners = useMemo(() => {
    const start = (currentPage - 1) * LIMIT;
    return filteredOwners.slice(start, start + LIMIT);
  }, [filteredOwners, currentPage]);

  const areas = useMemo(() => {
    const set = new Set(owners.map(o => (o.locationCode || o.checkinArea || "").toUpperCase()).filter(Boolean));
    return Array.from(set).sort();
  }, [owners]);

  const stats = useMemo(() => {
    const total = owners.length;
    const verified = owners.filter(o => (o.kycStatus === "verified" || o.kyc?.status === "verified")).length;
    const properties = owners.reduce((acc, o) => acc + (o.propertyCount || 0), 0);
    return { total, verified, pending: total - verified, properties };
  }, [owners]);

  const handleToggleDeactivate = async (owner) => {
    const id = owner.loginId || owner._id;
    if (!id) return alert("Owner ID not found");
    const isCurrentlyActive = owner.isActive !== false;
    const action = isCurrentlyActive ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${owner.name || "this owner"}?`)) return;
    
    try {
      setLoading(true);
      const res = await fetchJson(`/api/owners/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        headers: getAuthHeader()
      });
      alert(res.message || `Owner ${action}d successfully`);
      loadOwners();
    } catch (err) {
      alert(`Failed to ${action} owner: ` + (err.body || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete owner ${id}?`)) return;
    try {
      await fetchJson(`/api/owners/${encodeURIComponent(id)}`, { 
        method: "DELETE",
        headers: getAuthHeader()
      });
      loadOwners();
      if (selectedOwner?.loginId === id) setSelectedOwner(null);
    } catch (err) { alert("Failed to delete owner"); }
  };

  const exportToExcel = () => {
    const data = filteredOwners.map(o => ({
      "Owner ID": o.loginId,
      "Name": o.name,
      "Email": o.email,
      "Phone": o.phone,
      "Area": o.locationCode || o.checkinArea,
      "Bank": o.bankName || o.checkinBankName,
      "KYC Status": o.kycStatus || o.kyc?.status || "pending",
      "Properties": o.propertyCount || 0
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Owners");
    XLSX.writeFile(wb, `Roomhy_Owners_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Standardized Page Header */}
      <PageHeader 
        title={
          currentView === "add" ? "Add Property Owner" : 
          currentView === "pending" ? "Approved / Pending Owners" : 
          currentView === "kyc" ? "KYC & Documents Verification" : 
          currentView === "agreements" ? "Property Owner Licensing Agreements" :
          "Property Owners"
        }
        subtitle={
          currentView === "add" ? "Create a new property owner account and generate credentials." : 
          currentView === "pending" ? "Review property owner onboarding and approval requests." : 
          currentView === "kyc" ? "Audit document integrity and KYC compliance." : 
          currentView === "agreements" ? "View digital Asset Partner Contracts, Terms & Conditions, and signed agreements." :
          "Manage all registered property owners, properties, and banking details."
        }
        actions={
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setSearchParams({ view: currentView === "add" ? "list" : "add" })}
               className={cn(
                 "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95",
                 currentView === "add" ? "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50" : "bg-blue-600 hover:bg-blue-700 text-white"
               )}
             >
                {currentView === "add" ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {currentView === "add" ? "Back to Owners List" : "Add Property Owner"}
             </button>
             {currentView !== "add" && (
               <button 
                 onClick={exportToExcel}
                 className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
               >
                  <Sheet className="w-4 h-4 text-emerald-600" /> Export Excel
               </button>
             )}
          </div>
        }
      />

      {/* Metrics Row (Only on main lists) */}
      {currentView !== "add" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Partners" value={stats.total.toLocaleString()} delta="Active Owners" icon={Users} iconColor="blue" loading={loading} />
          <StatCard label="KYC Verified" value={stats.verified.toLocaleString()} delta="KYC Cleared" icon={ShieldCheck} iconColor="green" loading={loading} />
          <StatCard label="Total Properties" value={stats.properties.toLocaleString()} delta="Listed Properties" icon={Building2} iconColor="purple" loading={loading} />
          <StatCard label="Pending KYC" value={stats.pending.toLocaleString()} delta="Needs Audit" icon={Clock} iconColor="yellow" loading={loading} />
        </div>
      )}

      {currentView === "add" ? (
        /* Standard Add Form Card */
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
                 <UserPlus size={22} />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-slate-900">Property Owner Information</h3>
                 <p className="text-xs text-slate-500">Fill in owner details and banking info to create account.</p>
              </div>
           </div>

           <form onSubmit={handleAddOwner} className="p-6 sm:p-8 space-y-6">
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
                      value={formArea} 
                      onChange={e => setFormArea(e.target.value)} 
                      placeholder="e.g. Koramangala, Bangalore" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                 </div>
              </div>

              {/* Banking Details */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Banknote size={18} />
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
                          <code className="text-sm font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">{formLoginId}</code>
                          <span className="text-xs font-semibold text-slate-400 ml-2">Password:</span>
                          <code className="text-sm font-mono font-bold text-blue-400 bg-slate-800 px-2.5 py-1 rounded-lg">{formPassword}</code>
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
                   onClick={() => setSearchParams({ view: "list" })} 
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
                    {saving ? "Creating Account..." : "Add Property Owner"}
                 </button>
              </div>
           </form>
        </div>
      ) : (
        /* Standard List View Table Card */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
           <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                    {currentView === "pending" ? <ClipboardList size={20} /> : 
                     currentView === "kyc" ? <Fingerprint size={20} /> : 
                     <Building2 size={20} />}
                 </div>
                 <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {currentView === "pending" ? "Approved / Pending Owners" : 
                       currentView === "kyc" ? "KYC & Documents Verification" : 
                       "Property Owners Registry"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {currentView === "pending" ? "Review property owner onboarding requests." : 
                       currentView === "kyc" ? "Audit identity documents and KYC verification." : 
                       "Manage all active property owner accounts."}
                    </p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                    <Filter size={14} className="text-slate-400" />
                    <select 
                      value={areaFilter}
                      onChange={e => setAreaFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 outline-none border-none p-0 focus:ring-0 cursor-pointer"
                    >
                       <option value="all">All Zones</option>
                       {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                 </div>
                 
                 <div className="relative w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search owners..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all" 
                    />
                 </div>
                 
                 <button onClick={loadOwners} className="p-2 rounded-xl bg-white text-slate-400 hover:text-blue-600 transition-all border border-slate-200 shadow-sm active:scale-95">
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                 </button>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                       <th className="px-6 py-4">Owner Profile</th>
                       <th className="px-6 py-4">Location / Area</th>
                       <th className="px-6 py-4 text-center">
                          {currentView === "kyc" ? "Document Status" : 
                           currentView === "agreements" ? "Agreement Date" : 
                           "Banking Status"}
                        </th>
                       <th className="px-6 py-4 text-center">
                          {currentView === "agreements" ? "Agreement Status" : "KYC Status"}
                        </th>
                       <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan="5" className="py-20 text-center">
                         <div className="w-10 h-10 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                         <p className="text-xs font-semibold text-slate-400">Loading Property Owners...</p>
                      </td></tr>
                    ) : filteredOwners.length === 0 ? (
                      <tr><td colSpan="5" className="py-20 text-center">
                         <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                            {currentView === "pending" ? <FileCheck size={24} /> : <Users size={24} />}
                         </div>
                         <p className="text-xs font-semibold text-slate-500">No property owners found</p>
                      </td></tr>
                    ) : paginatedOwners.map((o, i) => {
                      const status = (o.kycStatus || o.kyc?.status || "pending").toLowerCase();
                      return (
                        <tr key={i} className="group hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => {
                           setSelectedOwner(o);
                           setIsEditingOwner(false);
                           setEditOwnerForm({
                             email: o.email || o.checkinEmail || "",
                             phone: o.phone || o.checkinPhone || "",
                             checkinDob: o.checkinDob || "",
                             address: o.address || o.checkinAddress || "",
                             bankName: o.bankName || o.checkinBankName || "",
                             branchName: o.branchName || o.checkinBranchName || "",
                             accountNumber: o.accountNumber || o.checkinBankAccountNumber || "",
                             ifscCode: o.ifscCode || o.checkinIfscCode || "",
                             accountHolderName: o.accountHolderName || o.checkinAccountHolderName || "",
                             checkinUpiId: o.checkinUpiId || o.upiId || ""
                           });
                        }}>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                                    {(o.name || "U").charAt(0).toUpperCase()}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-slate-800 leading-snug">{o.name || "Unknown Owner"}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                       <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase font-mono">{o.loginId || "ID-GEN"}</span>
                                       <span className={cn(
                                          "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                          o.isActive === false ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                                       )}>
                                          {o.isActive === false ? "suspended" : "active"}
                                       </span>
                                       <span className="text-xs text-slate-500 ml-1">{o.phone || "No Phone"}</span>
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                 <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">{o.propertyTitle || "Main Portfolio"}</p>
                                 <div className="flex items-center gap-1 text-slate-400">
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-xs font-medium">{o.locationCode || o.checkinArea || "General Zone"}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                              {currentView === "agreements" ? (
                                  <div className="inline-flex flex-col items-center">
                                     <p className="text-xs font-bold text-slate-800">
                                       {o.checkinTermsAcceptedAt || o.checkinSubmittedAt ? new Date(o.checkinTermsAcceptedAt || o.checkinSubmittedAt).toLocaleDateString("en-IN") : "Signed on Onboarding"}
                                     </p>
                                     <span className="text-[10px] text-slate-400 font-medium">Digital Acceptance</span>
                                  </div>
                               ) : currentView === "kyc" ? (() => {
                                 const hasDoc = o.checkinAadhaarImage || o.checkinOwnerPhoto || o.checkinBankProof || o.checkinCancelledCheque || o.checkinAadhaarNumber || o.documentImage || o.kyc?.documentImage || o.aadharNumber || o.kycStatus === "verified" || o.kycStatus === "submitted";
                                 return (
                                 <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">
                                    {hasDoc ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                                    <span className="text-xs font-semibold text-slate-600">{hasDoc ? "Uploaded" : "Pending Upload"}</span>
                                 </div>
                                 );
                               })() : (
                                <div className="inline-flex flex-col items-center">
                                   <p className="text-xs font-bold text-slate-800">{o.bankName || o.checkinBankName || "Not Linked"}</p>
                                   <span className="text-[10px] text-slate-400 font-medium">Bank Account</span>
                                </div>
                              )}
                           </td>
                           <td className="px-6 py-4 text-center">
                              {currentView === "agreements" ? (
                                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg uppercase inline-block bg-emerald-50 text-emerald-600 border border-emerald-100">
                                     Signed &amp; Accepted
                                  </span>
                               ) : (
                                  <span className={cn(
                                     "text-xs font-bold px-2.5 py-1 rounded-lg uppercase inline-block",
                                     status === "verified" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                  )}>
                                     {status}
                                  </span>
                               )}
                           </td>
                           <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                     onClick={() => setAgreementModalOwner(o)}
                                     title="View Signed Asset Agreement"
                                     className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-200 shadow-sm active:scale-95 flex items-center gap-1 text-xs font-bold shrink-0"
                                  >
                                     <FileText size={15} />
                                     <span>View Agreement</span>
                                  </button>
                                 <button 
                                   onClick={() => handleToggleDeactivate(o)}
                                   title={o.isActive === false ? "Reactivate Owner" : "Deactivate Owner"}
                                   className={cn(
                                      "p-2 rounded-lg border transition-all shadow-sm active:scale-95",
                                      o.isActive === false 
                                         ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100" 
                                         : "bg-white text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-50"
                                   )}
                                 >
                                    <Shield size={16} />
                                 </button>
                                 <button 
                                    onClick={() => setSelectedOwner(o)}
                                    title="View Details"
                                    className="p-2 rounded-lg bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-200 shadow-sm active:scale-95"
                                 >
                                    <Eye size={16} />
                                 </button>
                                 <button 
                                    onClick={() => handleDelete(o.loginId || o._id)}
                                    title="Delete Owner"
                                    className="p-2 rounded-lg bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-200 shadow-sm active:scale-95"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>

           {/* Pagination */}
           {totalRecords > 0 && (
             <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
               <p className="text-xs font-semibold text-slate-500">
                 Showing {((currentPage-1)*LIMIT)+1} to {Math.min(currentPage*LIMIT,totalRecords)} of{" "}
                 <span className="text-slate-900 font-bold">{totalRecords.toLocaleString()}</span> property owners
               </p>
               <div className="flex items-center gap-2">
                 <button 
                   disabled={currentPage===1} 
                   onClick={()=>setCurrentPage(currentPage-1)}
                   className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                 >
                   <ChevronLeft className="w-4 h-4"/> Prev
                 </button>
                 {Array.from({length:Math.min(totalPages,7)},(_,i)=>{
                   let n;
                   if(totalPages<=7) n=i+1;
                   else if(currentPage<=4) n=i+1;
                   else if(currentPage>=totalPages-3) n=totalPages-6+i;
                   else n=currentPage-3+i;
                   return (
                     <button 
                       key={n} 
                       onClick={()=>setCurrentPage(n)}
                       className={cn("w-8 h-8 rounded-lg text-xs font-bold transition-all",
                         currentPage===n?"bg-blue-600 text-white shadow-sm":"text-slate-600 hover:bg-slate-100 border border-slate-200")}
                     >
                       {n}
                     </button>
                   );
                 })}
                 <button 
                   disabled={currentPage===totalPages} 
                   onClick={()=>setCurrentPage(currentPage+1)}
                   className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                 >
                   Next <ChevronRight className="w-4 h-4"/>
                 </button>
               </div>
             </div>
           )}
        </div>
      )}

      {/* Detail Slide-over Panel */}
      {selectedOwner && (
        <div className="fixed inset-0 z-[120] flex items-center justify-end p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-xl h-full rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20">
                       {selectedOwner.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-900">{selectedOwner.name}</h3>
                       <p className="text-xs text-slate-500 font-medium mt-0.5">ID: {selectedOwner.loginId}</p>
                    </div>
                 </div>
                  <div className="flex items-center gap-2">
                     {isEditingOwner && (
                        <button 
                           onClick={handleSaveEdit}
                           disabled={savingEdit}
                           className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save
                        </button>
                     )}
                     <button onClick={() => setIsEditingOwner(!isEditingOwner)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all border border-slate-200">
                       {isEditingOwner ? "Cancel" : "Edit"}
                     </button>
                     <button onClick={() => setSelectedOwner(null)} className="p-2 rounded-xl bg-white text-slate-400 hover:text-slate-700 transition-all border border-slate-200 shadow-sm">
                        <X size={20} />
                     </button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                 <section className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                       <User size={18} className="text-blue-600" />
                       <span>Owner Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({...editOwnerForm, email: e.target.value})} type="email" icon={Mail} label="Email Address" value={isEditingOwner ? editOwnerForm.email : (selectedOwner.email || selectedOwner.checkinEmail)} />
                       <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({...editOwnerForm, phone: e.target.value})} type="tel" icon={Phone} label="Phone Number" value={isEditingOwner ? editOwnerForm.phone : (selectedOwner.phone || selectedOwner.checkinPhone)} />
                       <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({...editOwnerForm, checkinDob: e.target.value})} type="date" icon={Calendar} label="Date of Birth" value={isEditingOwner ? editOwnerForm.checkinDob : (selectedOwner.checkinDob || "Not Defined")} />
                       <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({...editOwnerForm, address: e.target.value})} type="text" icon={MapPin} label="Address" value={isEditingOwner ? editOwnerForm.address : (selectedOwner.address || selectedOwner.checkinAddress)} />
                    </div>
                 </section>

                 <section className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                       <Banknote size={18} className="text-emerald-600" />
                       <span>Banking Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({...editOwnerForm, bankName: e.target.value})} type="text" icon={Building2} label="Bank Name" value={isEditingOwner ? editOwnerForm.bankName : (selectedOwner.bankName || selectedOwner.checkinBankName)} />
                       <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({...editOwnerForm, branchName: e.target.value})} type="text" icon={MapPin} label="Branch Name" value={isEditingOwner ? editOwnerForm.branchName : (selectedOwner.branchName || selectedOwner.checkinBranchName)} />
                       <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({...editOwnerForm, accountNumber: e.target.value})} type="text" icon={Fingerprint} label="Account Number" value={isEditingOwner ? editOwnerForm.accountNumber : (selectedOwner.accountNumber || selectedOwner.checkinBankAccountNumber)} />
                       <DetailItem isEditing={isEditingOwner} onChange={e => setEditOwnerForm({...editOwnerForm, ifscCode: e.target.value})} type="text" icon={Shield} label="IFSC Code" value={isEditingOwner ? editOwnerForm.ifscCode : (selectedOwner.ifscCode || selectedOwner.checkinIfscCode)} />
                    </div>
                 </section>

                 {/* KYC & Uploaded Documents Section */}
                 <section className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                          <ShieldCheck size={18} className="text-blue-600" />
                          <span>KYC & Verification Documents</span>
                       </div>
                       <span className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-lg uppercase",
                          (selectedOwner.kycStatus || selectedOwner.kyc?.status) === "verified" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                       )}>
                          {selectedOwner.kycStatus || selectedOwner.kyc?.status || "Pending"}
                       </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <DetailItem icon={Fingerprint} label="Aadhaar Number" value={selectedOwner.checkinAadhaarNumber || selectedOwner.aadharNumber || selectedOwner.kyc?.aadharNumber || "Not Provided"} />
                       <DetailItem icon={Phone} label="Aadhaar Phone" value={selectedOwner.checkinAadhaarLinkedPhone || selectedOwner.kyc?.aadhaarLinkedPhone || "Not Provided"} />
                    </div>

                    {/* Uploaded Document Previews */}
                     <div className="grid grid-cols-3 gap-3 pt-2">
                        {selectedOwner.checkinOwnerPhoto && (
                           <a href={selectedOwner.checkinOwnerPhoto} target="_blank" rel="noreferrer" className="group relative rounded-xl border border-slate-200 p-2 text-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all">
                              <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 mb-1.5">
                                 <img src={selectedOwner.checkinOwnerPhoto} alt="Owner Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement && (e.currentTarget.parentElement.innerHTML = '<div class=\'flex items-center justify-center h-full text-slate-400 text-xs\'>No Preview</div>'); }} />
                              </div>
                              <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Owner Photo ↗</span>
                           </a>
                        )}
                        {(selectedOwner.checkinAadhaarImage || selectedOwner.kyc?.documentImage || selectedOwner.documentImage) && (
                           <a href={selectedOwner.checkinAadhaarImage || selectedOwner.kyc?.documentImage || selectedOwner.documentImage} target="_blank" rel="noreferrer" className="group relative rounded-xl border border-slate-200 p-2 text-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all">
                              <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 mb-1.5 flex items-center justify-center">
                                 <img src={selectedOwner.checkinAadhaarImage || selectedOwner.kyc?.documentImage || selectedOwner.documentImage} alt="Aadhaar Card" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement && (e.currentTarget.parentElement.innerHTML = '<div class=\'flex items-center justify-center h-full text-slate-400 text-xs\'>No Preview</div>'); }} />
                              </div>
                              <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Aadhaar Card ↗</span>
                           </a>
                        )}
                        {(selectedOwner.checkinBankProof || selectedOwner.checkinCancelledCheque) && (
                           <a href={typeof selectedOwner.checkinBankProof === 'string' ? selectedOwner.checkinBankProof : (typeof selectedOwner.checkinCancelledCheque === 'string' ? selectedOwner.checkinCancelledCheque : selectedOwner.checkinCancelledCheque?.dataUrl)} target="_blank" rel="noreferrer" className="group relative rounded-xl border border-slate-200 p-2 text-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all">
                              <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 mb-1.5 flex items-center justify-center text-slate-400">
                                 {String(selectedOwner.checkinBankProof || selectedOwner.checkinCancelledCheque?.dataUrl || '').startsWith("http") ? (
                                    <img src={selectedOwner.checkinBankProof || selectedOwner.checkinCancelledCheque?.dataUrl} alt="Bank Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement && (e.currentTarget.parentElement.innerHTML = '<div class=\'flex items-center justify-center h-full text-slate-400 text-xs\'>No Preview</div>'); }} />
                                 ) : (
                                    <FileText size={28} />
                                 )}
                              </div>
                              <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Bank Proof ↗</span>
                           </a>
                        )}
                        {selectedOwner.checkinCancelledCheque && typeof selectedOwner.checkinCancelledCheque === 'object' && selectedOwner.checkinCancelledCheque.dataUrl && !selectedOwner.checkinBankProof && (
                           <a href={selectedOwner.checkinCancelledCheque.dataUrl} target="_blank" rel="noreferrer" className="group relative rounded-xl border border-slate-200 p-2 text-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all">
                              <div className="aspect-square w-full rounded-lg overflow-hidden bg-slate-200 mb-1.5 flex items-center justify-center text-slate-400">
                                 <img src={selectedOwner.checkinCancelledCheque.dataUrl} alt="Cancelled Cheque" className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement && (e.currentTarget.parentElement.innerHTML = '<div class=\'flex items-center justify-center h-full text-slate-400 text-xs\'>No Preview</div>'); }} />
                              </div>
                              <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600">Cancelled Cheque ↗</span>
                           </a>
                        )}
                     </div>
                 </section>
              </div>
           </div>
       {/* Owner Agreement Modal */}
       {agreementModalOwner && (
          <OwnerAgreementModal 
             owner={agreementModalOwner} 
             onClose={() => setAgreementModalOwner(null)} 
          />
       )}
    </div>
  );
}

function DetailItem({ label, value, icon: Icon, isEditing, onChange, type = "text" }) {
   return (
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
         <div className="flex items-center gap-1.5 text-slate-400">
            {Icon && <Icon size={14} />}
            <span className="text-[11px] font-semibold text-slate-500">{label}</span>
         </div>
         {isEditing ? (
            <input 
               type={type}
               value={value || ""}
               onChange={onChange}
               className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
         ) : (
            <p className="text-xs font-bold text-slate-900 truncate">{value || "Not Set"}</p>
         )}
      </div>
   );
}
