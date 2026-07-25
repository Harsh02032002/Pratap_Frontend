import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Shield, Clock, 
  ArrowUpRight, ArrowDownRight, Building2, Search,
  CheckCircle2, XCircle,
  Phone, Mail, Calendar, MapPin, Zap, Filter,
  ChevronRight, RefreshCw, LayoutGrid, Plus,
  Loader2, Sparkles, Layers, Globe2,
  IndianRupee, Tag, ShieldCheck,
  CreditCard, Eye, Trash2, 
  Sheet, FileText, User, Fingerprint,
  Home, Hash, Banknote, Wallet, Briefcase, AlertTriangle,
  CheckCircle, Key, X
} from "lucide-react";
import { fetchJson, getAuthHeader } from "../../utils/api";
import { PageHeader } from "../../components/superadmin/PageHeader";
import * as XLSX from 'xlsx';

const cn = (...classes) => classes.filter(Boolean).join(" ");

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getPropertyText(tenant, profile = {}) {
  const propertyObj = tenant?.property && typeof tenant.property === "object" ? tenant.property : null;
  const profileName = profile.propertyName || tenant?.tenantProfile?.propertyName || tenant?.digitalCheckin?.profile?.propertyName;
  const propertyTitle = profileName || tenant?.propertyTitle || tenant?.propertyName || propertyObj?.title || propertyObj?.name || "";
  const location = propertyObj?.locationCode || "";
  if (propertyTitle && location && !propertyTitle.includes(location)) return `${propertyTitle} (${location})`;
  return propertyTitle || location || "Global Inventory";
}

function normalizeTenant(tenant, record) {
  const profile = record?.tenantProfile || tenant?.digitalCheckin?.profile || {};
  const tenantKyc = record?.tenantKyc || tenant?.digitalCheckin?.kyc || {};
  const modelKyc = tenant?.kyc || {};
  const aadhaarNumber = modelKyc.aadhaarNumber || modelKyc.aadhar || tenantKyc.aadhaarNumber || "";
  const kycStatus = tenant?.kycStatus || tenantKyc?.digilockerStatus || (modelKyc.digilockerVerified || modelKyc.otpVerified ? "verified" : "") || (aadhaarNumber ? "submitted" : "") || "pending";

  return {
    ...tenant,
    profile: {
      name: tenant?.name || profile?.name || "Resident",
      email: tenant?.email || profile?.email || "No Email",
      phone: tenant?.phone || profile?.phone || "No Contact",
      dob: tenant?.dob || profile?.dob || "",
      gender: tenant?.gender || "",
      moveInDate: tenant?.moveInDate || profile?.moveInDate || "",
      roomNo: tenant?.roomNo || profile?.roomNo || tenant?.room?.number || "N/A",
      bedNo: tenant?.bedNo || "N/A",
      floor: tenant?.floor || "",
      building: tenant?.building || "",
      agreedRent: tenant?.agreedRent || profile?.agreedRent || 0,
      baseRoomRent: tenant?.baseRoomRent || 0,
      securityDepositTotal: tenant?.securityDepositTotal || 0,
      securityDepositPaid: tenant?.securityDepositPaid || 0,
      securityDepositBalance: tenant?.securityDepositBalance || 0,
      paymentFrequency: tenant?.paymentFrequency || "",
      rentAgreementType: tenant?.rentAgreementType || "",
      electricityCharge: tenant?.electricityCharge || 0,
      maintenanceCharge: tenant?.maintenanceCharge || 0,
      occupation: tenant?.occupation || "",
      company: tenant?.company || "",
      remarks: tenant?.remarks || "",
      guardianNumber: tenant?.guardianNumber || profile?.guardianNumber || "N/A",
      propertyText: getPropertyText(tenant, profile),
      emergencyName: tenant?.emergencyContact?.name || "",
      emergencyPhone: tenant?.emergencyContact?.phone || "",
      emergencyRelationship: tenant?.emergencyContact?.relationship || "",
      agreementDetails: tenant?.digitalCheckin?.agreementDetails || {},
    },
    kyc: {
      status: String(kycStatus || "pending").toLowerCase(),
      aadhaarNumber,
      idProofType: modelKyc.idProof || "",
      idProofFile: modelKyc.idProofFile || modelKyc.aadhaarFront || tenantKyc.aadhaarFront || "",
      aadhaarFront: modelKyc.aadhaarFront || tenantKyc.aadhaarFront || "",
      aadhaarBack: modelKyc.aadhaarBack || tenantKyc.aadhaarBack || "",
      otpVerified: modelKyc.otpVerified || tenantKyc.otpVerified || false,
      digilockerVerified: modelKyc.digilockerVerified || tenantKyc.digilockerVerified || false
    }
  };
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  const colors = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600",   ring: "ring-blue-100" },
    emerald:{ bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
    purple: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" },
    amber:  { bg: "bg-amber-50",  text: "text-amber-600",  ring: "ring-amber-100" },
  }[color] || { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} ring-4 ${colors.ring} flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" />{sub}</p>}
      </div>
    </div>
  );
}

export default function Tenant() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isUpdatingKyc, setIsUpdatingKyc] = useState(false);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await fetchJson("/api/tenants");
      const baseTenants = Array.isArray(data) ? data : Array.isArray(data?.tenants) ? data.tenants : [];
      const merged = await Promise.all(baseTenants.map(async (t) => {
        if (!t?.loginId) return normalizeTenant(t, null);
        try {
          const checkin = await fetchJson(`/api/checkin/tenant/${encodeURIComponent(t.loginId)}`);
          return normalizeTenant(t, checkin?.record || null);
        } catch (_) { return normalizeTenant(t, null); }
      }));
      setTenants(merged);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTenants(); }, []);

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tenants;
    return tenants.filter(t => {
      const haystack = [t.profile.name, t.profile.phone, t.profile.propertyText, t.loginId].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [tenants, search]);

  const LIMIT = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalRecords = filteredTenants.length;
  const totalPages = Math.ceil(totalRecords / LIMIT) || 1;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * LIMIT;
    return filteredTenants.slice(start, start + LIMIT);
  }, [filteredTenants, currentPage]);

  const stats = useMemo(() => {
    const total = tenants.length;
    const verified = tenants.filter(t => t.kyc.status === "verified").length;
    const submitted = tenants.filter(t => t.kyc.status === "submitted").length;
    const revenue = tenants.reduce((acc, t) => acc + (Number(t.profile.agreedRent) || 0), 0);
    return { total, verified, submitted, pending: total - verified - submitted, revenue };
  }, [tenants]);

  const exportToExcel = () => {
    const data = filteredTenants.map(t => ({
      "Tenant ID": t.loginId,
      "Name": t.profile.name,
      "Phone": t.profile.phone,
      "Email": t.profile.email,
      "Property": t.profile.propertyText,
      "Room": t.profile.roomNo,
      "Bed": t.profile.bedNo,
      "Floor": t.profile.floor,
      "Agreed Rent": t.profile.agreedRent,
      "Security Deposit": t.profile.securityDepositTotal,
      "Move-In": formatDate(t.profile.moveInDate),
      "Payment Frequency": t.profile.paymentFrequency,
      "Occupation": t.profile.occupation,
      "Emergency Contact": t.profile.emergencyName,
      "Emergency Phone": t.profile.emergencyPhone,
      "KYC Status": t.kyc.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tenants");
    XLSX.writeFile(wb, `Roomhy_Tenants_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleKycUpdate = async (id, status) => {
    try {
      setIsUpdatingKyc(true);
      await fetchJson(`/api/tenants/${id}/kyc`, {
        method: "PATCH",
        headers: getAuthHeader(),
        body: JSON.stringify({ status })
      });
      loadTenants();
      setSelectedTenant(prev => prev ? { ...prev, kyc: { ...prev.kyc, status } } : null);
    } catch (err) { alert("Failed to update KYC status"); }
    finally { setIsUpdatingKyc(false); }
  };

  const handleToggleDeactivate = async (tenant) => {
    const id = tenant._id || tenant.id;
    if (!id) { alert("Tenant ID not found"); return; }
    const isCurrentlyActive = tenant.status !== "suspended";
    const action = isCurrentlyActive ? "deactivate" : "reactivate";
    if (!window.confirm(`Are you sure you want to ${action} resident ${tenant.profile?.name || "this resident"}?`)) return;
    try {
      setLoading(true);
      const res = await fetchJson(`/api/tenants/${id}/${action}`, { method: "POST", headers: getAuthHeader() });
      alert(res.message || `Resident ${action}d successfully`);
      loadTenants();
    } catch (err) {
      alert(`Failed to ${action} resident: ` + (err.body || err.message));
    } finally { setLoading(false); }
  };

  const handleDeleteTenant = async (tenant) => {
    const id = tenant._id || tenant.id;
    if (!id) { alert("Tenant ID not found"); return; }
    if (!window.confirm(`Are you sure you want to permanently delete resident ${tenant.profile?.name || "this resident"}? This action cannot be undone.`)) return;
    try {
      setLoading(true);
      const res = await fetchJson(`/api/tenants/${id}`, { method: "DELETE", headers: getAuthHeader() });
      alert(res.message || "Resident deleted successfully");
      loadTenants();
    } catch (err) {
      alert("Failed to delete resident: " + (err.body || err.message));
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="View All Tenants"
        subtitle="Manage and view all tenant records and occupancy."
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/superadmin/add-tenant")}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 active:scale-95"
            >
               <Plus className="w-4 h-4" /> Add Tenant
            </button>
            <button 
              onClick={exportToExcel}
              className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 active:scale-95"
            >
               <Sheet className="w-4 h-4 text-emerald-600" /> Export Excel
            </button>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Tenants" value={stats.total.toLocaleString()} sub="Active Residents" icon={Users} color="blue" />
        <StatCard label="KYC Verified" value={stats.verified.toLocaleString()} sub="Verified Accounts" icon={ShieldCheck} color="emerald" />
        <StatCard label="Total Rent" value={`₹${stats.revenue.toLocaleString('en-IN')}`} sub="Monthly Rent" icon={Banknote} color="purple" />
        <StatCard label="Pending KYC" value={stats.submitted.toLocaleString()} sub="Needs Review" icon={Clock} color="amber" />
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
         <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-bold text-base text-slate-900">Tenant Registry</h3>
                  <p className="text-xs text-slate-400">View active and pending tenants</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search tenants..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-all" 
                  />
               </div>
               
               <button 
                onClick={loadTenants} 
                className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-blue-600 border border-slate-200 transition-all"
                title="Refresh"
               >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                     <th className="px-5 py-3.5">Tenant Name</th>
                     <th className="px-5 py-3.5">Property Name</th>
                     <th className="px-5 py-3.5 text-center">Contact Details</th>
                     <th className="px-5 py-3.5 text-center">KYC Status</th>
                     <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="5" className="py-20 text-center">
                       <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading tenant data...</p>
                    </td></tr>
                  ) : filteredTenants.length === 0 ? (
                    <tr><td colSpan="5" className="py-20 text-center">
                       <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                          <Users size={28} />
                       </div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No tenants found</p>
                    </td></tr>
                  ) : paginatedTenants.map((t, i) => (
                    <tr key={i} className="group hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setSelectedTenant(t)}>
                       <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center shrink-0">
                                {t.profile.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-900">{t.profile.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                   <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{t.loginId || "ID-GEN"}</span>
                                   <span className={cn(
                                       "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                       t.status === "suspended" ? "bg-rose-50 text-rose-600" :
                                       t.status === "active" ? "bg-emerald-50 text-emerald-600" :
                                       "bg-slate-100 text-slate-600"
                                    )}>
                                       {t.status || "pending"}
                                    </span>
                                   <span className="text-[10px] font-medium text-slate-400">Moved in: {formatDate(t.profile.moveInDate)}</span>
                                </div>
                             </div>
                          </div>
                       </td>
                       <td className="px-5 py-4">
                          <div className="space-y-0.5">
                             <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">{t.profile.propertyText}</p>
                             <div className="flex items-center gap-1.5">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span className="text-[11px] font-medium text-slate-500">Unit {t.profile.roomNo} • {t.profile.bedNo} Bed</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-5 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                             <p className="text-xs font-bold text-slate-800">{t.profile.phone}</p>
                             <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{t.profile.email}</span>
                          </div>
                       </td>
                       <td className="px-5 py-4 text-center">
                          <span className={cn(
                             "text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider",
                             t.kyc.status === "verified" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                             t.kyc.status === "submitted" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                             "bg-slate-100 text-slate-500 border border-slate-200"
                          )}>
                             {t.kyc.status}
                          </span>
                       </td>
                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                           <div className="flex items-center justify-end gap-1.5">
                              <button 
                                 onClick={() => handleToggleDeactivate(t)} 
                                 title={t.status === "suspended" ? "Reactivate Account" : "Deactivate Account"} 
                                 className={cn(
                                    "w-8 h-8 rounded-xl border flex items-center justify-center transition-all",
                                    t.status === "suspended" 
                                       ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100" 
                                       : "bg-slate-50 text-slate-500 border-slate-100 hover:text-slate-700 hover:bg-slate-100"
                                 )}
                               >
                                 <Shield className={cn("w-4 h-4", t.status === "suspended" && "animate-pulse")} />
                               </button>
                              <button 
                                onClick={() => setSelectedTenant(t)} 
                                title="View Details"
                                className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-100 flex items-center justify-center transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTenant(t)} 
                                title="Delete Tenant"
                                className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 flex items-center justify-center transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Pagination */}
         {totalPages > 1 && (
           <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
             <p className="text-[11px] font-bold text-slate-400">
               Showing {(currentPage-1)*LIMIT+1} to {Math.min(currentPage*LIMIT, totalRecords)} of {totalRecords} tenants
             </p>
             <div className="flex items-center gap-1.5">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(1,p-1))} 
                 disabled={currentPage===1}
                 className="px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
               >
                 Prev
               </button>
               {Array.from({length: Math.min(5,totalPages)}, (_,i) => i+1).map(n => (
                 <button 
                   key={n} 
                   onClick={() => setCurrentPage(n)}
                   className={cn("w-8 h-8 rounded-xl text-[11px] font-bold transition-all", n===currentPage ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "border border-slate-200 text-slate-500 hover:bg-slate-50")}
                 >
                   {n}
                 </button>
               ))}
               <button 
                 onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} 
                 disabled={currentPage===totalPages}
                 className="px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
               >
                 Next
               </button>
             </div>
           </div>
         )}
      </div>

      {/* DETAIL SLIDE-OVER MODAL */}
      {selectedTenant && (
        <div className="fixed inset-0 z-[120] flex items-center justify-end p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-3xl h-full rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-lg border border-white/20">
                       {selectedTenant.profile.name[0].toUpperCase()}
                    </div>
                    <div>
                       <h3 className="text-base font-bold tracking-tight">{selectedTenant.profile.name}</h3>
                       <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[10px] font-bold text-slate-300">ID: {selectedTenant.loginId}</span>
                         <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md uppercase",
                           selectedTenant.status === "active" ? "bg-emerald-500/20 text-emerald-300" :
                           selectedTenant.status === "suspended" ? "bg-rose-500/20 text-rose-300" :
                           "bg-amber-500/20 text-amber-300"
                         )}>{selectedTenant.status || "pending"}</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setSelectedTenant(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* 1. Personal Profile */}
                <SectionCard icon={User} title="1. Resident Personal Profile" color="blue">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem icon={Mail} label="Email Address" value={selectedTenant.profile.email} />
                    <DetailItem icon={Phone} label="Phone Number" value={selectedTenant.profile.phone} />
                    <DetailItem icon={Calendar} label="Date of Birth" value={selectedTenant.profile.dob ? formatDate(selectedTenant.profile.dob) : "—"} />
                    <DetailItem icon={User} label="Gender" value={selectedTenant.profile.gender || "—"} />
                    <DetailItem icon={Shield} label="Guardian / Emergency No." value={selectedTenant.profile.guardianNumber} />
                    <DetailItem icon={Key} label="Login ID" value={selectedTenant.loginId || "—"} mono />
                  </div>
                </SectionCard>

                {/* 2. Room & Bed Allocation */}
                <SectionCard icon={Building2} title="2. Room & Bed Allocation" color="indigo">
                  <div className="grid grid-cols-3 gap-4">
                    <DetailItem icon={Building2} label="Property Name" value={selectedTenant.profile.propertyText} />
                    <DetailItem icon={Hash} label="Room Number" value={selectedTenant.profile.roomNo} />
                    <DetailItem icon={Home} label="Bed No." value={selectedTenant.profile.bedNo} />
                    <DetailItem icon={Layers} label="Floor" value={selectedTenant.profile.floor || "—"} />
                    <DetailItem icon={Globe2} label="Building" value={selectedTenant.profile.building || "—"} />
                    <DetailItem icon={FileText} label="Rent Agreement Type" value={selectedTenant.profile.rentAgreementType || "Standard"} />
                  </div>
                </SectionCard>

                {/* 3. Stay & Billing Details */}
                <SectionCard icon={Banknote} title="3. Stay & Billing Details" color="emerald">
                  <div className="grid grid-cols-3 gap-4">
                    <DetailItem icon={Banknote} label="Base Room Price" value={selectedTenant.profile.baseRoomRent ? `₹${Number(selectedTenant.profile.baseRoomRent).toLocaleString('en-IN')}` : "—"} />
                    <DetailItem icon={IndianRupee} label="Agreed Rent" value={`₹${Number(selectedTenant.profile.agreedRent||0).toLocaleString('en-IN')}`} highlight />
                    <DetailItem icon={Wallet} label="Total Deposit" value={`₹${Number(selectedTenant.profile.securityDepositTotal||0).toLocaleString('en-IN')}`} />
                    <DetailItem icon={CreditCard} label="Deposit Paid" value={`₹${Number(selectedTenant.profile.securityDepositPaid||0).toLocaleString('en-IN')}`} />
                    <DetailItem icon={AlertTriangle} label="Deposit Balance" value={`₹${Number(selectedTenant.profile.securityDepositBalance||0).toLocaleString('en-IN')}`} />
                    <DetailItem icon={Calendar} label="Move-In Date" value={formatDate(selectedTenant.profile.moveInDate)} />
                    <DetailItem icon={Clock} label="Minimum Stay" value={selectedTenant.profile.agreementDetails?.minimumStayDuration || selectedTenant.digitalCheckin?.agreementDetails?.minimumStayDuration || "—"} />
                    <DetailItem icon={Clock} label="Notice Period" value={
                      (selectedTenant.profile.agreementDetails?.noticePeriodDays || selectedTenant.digitalCheckin?.agreementDetails?.noticePeriodDays)
                        ? `${selectedTenant.profile.agreementDetails?.noticePeriodDays || selectedTenant.digitalCheckin?.agreementDetails?.noticePeriodDays} days`
                        : "—"
                    } />
                    <DetailItem icon={Calendar} label="Rent Due Date" value={selectedTenant.profile.agreementDetails?.licenseFeeDueDate || selectedTenant.digitalCheckin?.agreementDetails?.licenseFeeDueDate || "—"} />
                    <DetailItem icon={RefreshCw} label="Payment Frequency" value={selectedTenant.profile.paymentFrequency || "Monthly"} />
                    <DetailItem icon={Zap} label="Electricity Charge" value={selectedTenant.profile.electricityCharge ? `₹${selectedTenant.profile.electricityCharge}` : "—"} />
                    <DetailItem icon={Tag} label="Maintenance Charge" value={selectedTenant.profile.maintenanceCharge ? `₹${selectedTenant.profile.maintenanceCharge}` : "—"} />
                  </div>
                </SectionCard>

                {/* 4. Occupation & Emergencies */}
                <SectionCard icon={Briefcase} title="4. Occupation & Emergencies" color="amber">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem icon={Briefcase} label="Occupation" value={selectedTenant.profile.occupation || "—"} />
                    <DetailItem icon={Building2} label="Company / Organization" value={selectedTenant.profile.company || "—"} />
                    <DetailItem icon={User} label="Emergency Contact" value={selectedTenant.profile.emergencyName || "—"} />
                    <DetailItem icon={Phone} label="Emergency Phone" value={selectedTenant.profile.emergencyPhone || "—"} />
                  </div>
                </SectionCard>

                {/* 5. KYC & Identity */}
                <SectionCard icon={Fingerprint} title="5. KYC & Identity Verification" color="purple">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <DetailItem icon={FileText} label="Aadhaar Number" value={selectedTenant.kyc.aadhaarNumber || "—"} mono />
                    <DetailItem icon={ShieldCheck} label="KYC Status" value={selectedTenant.kyc.status.toUpperCase()} highlight />
                    <DetailItem icon={CheckCircle} label="OTP Verified" value={selectedTenant.kyc.otpVerified ? "✅ Yes" : "❌ No"} />
                    <DetailItem icon={ShieldCheck} label="DigiLocker Verified" value={selectedTenant.kyc.digilockerVerified ? "✅ Yes" : "❌ No"} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedTenant.kyc.idProofType || "ID Proof"} Front</p>
                      {selectedTenant.kyc.idProofFile ? (
                        <img src={selectedTenant.kyc.idProofFile} className="w-full h-28 object-cover rounded-xl border border-slate-200" alt="ID Proof" />
                      ) : (
                        <div className="w-full h-28 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold uppercase">No Document</div>
                      )}
                    </div>
                    {selectedTenant.kyc.aadhaarBack && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aadhaar Back</p>
                        <img src={selectedTenant.kyc.aadhaarBack} className="w-full h-28 object-cover rounded-xl border border-slate-200" alt="Aadhaar Back" />
                      </div>
                    )}
                  </div>
                </SectionCard>

              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3">
                    <button onClick={() => { handleDeleteTenant(selectedTenant); setSelectedTenant(null); }}
                       className="text-xs font-bold text-rose-600 hover:underline">
                       Delete Resident
                    </button>
                    <span className="text-slate-300">|</span>
                    <button onClick={() => { handleToggleDeactivate(selectedTenant); setSelectedTenant(null); }}
                       className={cn("text-xs font-bold hover:underline",
                          selectedTenant.status === "suspended" ? "text-emerald-600" : "text-amber-600")}>
                       {selectedTenant.status === "suspended" ? "Reactivate Account" : "Deactivate Account"}
                    </button>
                 </div>
                <div className="flex gap-2">
                   <button onClick={() => handleKycUpdate(selectedTenant.loginId, "rejected")} disabled={isUpdatingKyc}
                      className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all disabled:opacity-50">
                      Reject Audit
                   </button>
                   <button onClick={() => handleKycUpdate(selectedTenant.loginId, "verified")} disabled={isUpdatingKyc}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50">
                      {isUpdatingKyc ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Approve Compliance
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, color, children }) {
  const styles = {
    blue:   { icon: "bg-blue-600",   border: "border-blue-100 bg-blue-50/20" },
    indigo: { icon: "bg-indigo-600", border: "border-indigo-100 bg-indigo-50/20" },
    emerald:{ icon: "bg-emerald-600",border: "border-emerald-100 bg-emerald-50/20" },
    amber:  { icon: "bg-amber-500",  border: "border-amber-100 bg-amber-50/20" },
    purple: { icon: "bg-purple-600", border: "border-purple-100 bg-purple-50/20" },
  };
  const s = styles[color] || { icon: "bg-slate-700", border: "border-slate-100 bg-slate-50/20" };
  return (
    <div className={cn("p-4 rounded-xl border", s.border)}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn("w-7 h-7 rounded-lg text-white flex items-center justify-center shadow-sm", s.icon)}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, highlight, mono }) {
  const isEmpty = !value || value === "—" || value === "-";
  return (
    <div className="space-y-0.5">
       <div className="flex items-center gap-1 text-slate-400">
          <Icon className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
       </div>
       <p className={cn(
         "text-xs font-bold tracking-tight break-words",
         highlight ? "text-blue-600" : "text-slate-800",
         mono && "font-mono",
         isEmpty && "text-slate-300 italic font-normal"
       )}>
          {value || "—"}
       </p>
    </div>
  );
}
