import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, ClipboardCheck, AlertTriangle,
  Camera, Map, Star, Edit3, Trash, UserCheck,
  RefreshCw, Download, Inbox, CreditCard, Tag,
  BarChart3, Plus, Loader2, Save, Sparkles, Layers,
  Box, Globe2, IndianRupee, ShieldCheck
} from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { DateRangePill } from "../../components/dashboard/DateRangePill";
import { fetchJson } from "../../utils/api";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function SuperadminWebsiteenq() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEnquiryIds, setSelectedEnquiryIds] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEnquiryIds(filteredEnquiries.map(item => item._id || item.enquiry_id));
    } else {
      setSelectedEnquiryIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedEnquiryIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedEnquiryIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedEnquiryIds.length} enquiries?`)) return;
    try {
      const res = await fetchJson("/api/website-enquiry/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiryIds: selectedEnquiryIds })
      });
      if (res?.success) {
        setSelectedEnquiryIds([]);
        loadEnquiries();
      }
    } catch (err) {
      console.error(err);
    }
  };


  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const data = await fetchJson("/api/website-enquiry/all");
      const list = data?.enquiries || data || [];
      setEnquiries(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetchJson("/api/website-enquiry/employees/marketing");
      if (res?.success) {
        setEmployees(res.employees || []);
      }
    } catch (err) {
      console.error("Error loading marketing employees:", err);
    }
  };

  useEffect(() => {
    loadEnquiries();
    loadEmployees();
  }, []);

  const handleAssign = async (employee) => {
    if (!employee || !selectedEnquiry) return;
    try {
      const enquiryId = selectedEnquiry.enquiry_id || selectedEnquiry.id || selectedEnquiry._id;
      const res = await fetchJson(`/api/website-enquiry/assign/${enquiryId}`, {
        method: "POST",
        body: JSON.stringify({
          status: "assigned",
          assigned_to: employee.name,
          assigned_to_loginId: employee.loginId,
          assigned_area: employee.area || employee.city || ""
        })
      });
      if (res?.success) {
        setShowAssignModal(false);
        setSelectedEmployeeId("");
        setSelectedEnquiry(null);
        loadEnquiries();
      } else {
        alert("Failed to assign enquiry.");
      }
    } catch (err) {
      console.error("Error assigning enquiry:", err);
      alert("Error assigning enquiry.");
    }
  };

  const filteredEnquiries = useMemo(() => {
    const q = search.toLowerCase();
    return enquiries.filter(e => {
      const matchSearch = (e.property_name || "").toLowerCase().includes(q) || 
                          (e.owner_name || "").toLowerCase().includes(q) ||
                          (e.locality || "").toLowerCase().includes(q) ||
                          (e.city || "").toLowerCase().includes(q);
      return matchSearch;
    });
  }, [enquiries, search]);

  const stats = useMemo(() => {
    const pending = enquiries.filter(e => e.status === "pending").length;
    return { pending };
  }, [enquiries]);

  const getEnquiryColor = (e, i) => {
    const colors = ["blue", "indigo", "amber", "rose", "emerald"];
    const charCodeSum = (e.owner_name || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[(charCodeSum + i) % 5];
  };

  return (
    <div className="p-6 space-y-6 bg-[#F8FAFC] min-h-full">
      {/* Header Area */}
      <div className="flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Web Enquiries</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review new property listing requests from the website.</p>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={loadEnquiries} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-slate-800/10 hover:bg-slate-900 transition-all flex items-center gap-2">
               <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh Queue
            </button>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardHorizontal label="Pending Approval" value={stats.pending} trend="Awaiting Action" icon={Hourglass} color="amber" />
        <StatCardHorizontal label="High Priority" value={0} trend="Review First" icon={Zap} color="rose" />
        <StatCardHorizontal label="Sync Ready" value={stats.pending} trend="Auto-Live Enabled" icon={Globe} color="blue" />
        <StatCardHorizontal label="SLA Status" value="Healthy" trend="Under 4h" icon={ShieldCheck} color="indigo" />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Awaiting Review</h3>
              {selectedEnquiryIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-3 h-3" /> Bulk Delete ({selectedEnquiryIds.length})
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
               <div className="relative group w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input 
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search properties or owners..." 
                    className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-9 pr-3 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
                  />
               </div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-400 text-[8px] font-bold uppercase border-b border-slate-50">
                     <th className="pb-4 w-10">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={filteredEnquiries.length > 0 && selectedEnquiryIds.length === filteredEnquiries.length}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                     </th>
                     <th className="pb-4">Property & Owner</th>
                     <th className="pb-4 text-center">Submitted</th>
                     <th className="pb-4 text-center">Status</th>
                     <th className="pb-4 text-right">Actions</th>
                  </tr>
               </thead>

               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan="4" className="py-12 text-center">
                       <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
                          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Scanning Database...</p>
                       </div>
                    </td></tr>
                  ) : filteredEnquiries.length === 0 ? (
                    <tr><td colSpan="4" className="py-12 text-center">
                       <div className="flex flex-col items-center gap-2">
                          <Inbox className="w-8 h-8 text-slate-100" />
                          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Queue is Clear</p>
                       </div>
                    </td></tr>
                  ) : filteredEnquiries.map((e, i) => {
                    const color = getEnquiryColor(e, i);
                    const initial = e.owner_name ? e.owner_name[0].toUpperCase() : "U";
                    const itemKey = e._id || e.enquiry_id;
                    const isChecked = selectedEnquiryIds.includes(itemKey);
                    return (
                      <tr key={i} className="group hover:bg-slate-50/80 transition-colors cursor-pointer">
                         <td className="py-4 w-10" onClick={ev => ev.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectOne(itemKey)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                         </td>
                         <td className="py-4">

                            <div className="flex items-center gap-4">
                               <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm transition-transform group-hover:scale-105",
                                  color === "blue" ? "bg-blue-600 shadow-blue-50" :
                                  color === "indigo" ? "bg-indigo-600 shadow-indigo-50" :
                                  color === "emerald" ? "bg-emerald-600 shadow-emerald-50" :
                                  color === "amber" ? "bg-amber-600 shadow-amber-50" :
                                  color === "rose" ? "bg-rose-600 shadow-rose-50" : "bg-slate-600 shadow-slate-50"
                               )}>
                                  {initial}
                               </div>
                               <div className="min-w-0">
                                  <p className="text-[12px] font-bold text-slate-800 leading-tight truncate max-w-[250px]">{e.property_name || "Digital Prospect"}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                     <MapPin className="w-2.5 h-2.5" /> {e.city || "Indore"} • <User className="w-2.5 h-2.5" /> {e.owner_name}
                                  </p>
                               </div>
                            </div>
                         </td>
                         <td className="py-4 text-center">
                            <span className="text-[10px] font-bold text-slate-500">{new Date(e.created_at || Date.now()).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}</span>
                         </td>
                         <td className="py-4 text-center">
                            <span className={cn(
                               "text-[8px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider shadow-sm",
                               e.status === "pending" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                               {e.status === "pending" ? "Awaiting Approval" : `Routed`}
                            </span>
                         </td>
                         <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                               {e.status === "pending" ? (
                                 <button onClick={() => { setSelectedEnquiry(e); setShowAssignModal(true); }} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 active:scale-95">
                                    <Check className="w-3.5 h-3.5" /> Approve
                                 </button>
                               ) : (
                                 <span className="text-[9px] text-slate-400 font-bold uppercase mr-2">Assigned</span>
                               )}
                               <button onClick={() => setSelectedEnquiry(e)} className="p-2 rounded-xl bg-white text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm hover:border-blue-100 hover:bg-blue-50/50">
                                  <Eye className="w-4 h-4" />
                               </button>
                            </div>
                          </td>
                       </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* Detail Modal */}
      {selectedEnquiry && !showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm bg-blue-600 shadow-blue-50 text-base">
                  {(selectedEnquiry.owner_name || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight">{selectedEnquiry.property_name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{(selectedEnquiry.property_type || "PG").toUpperCase()} • {selectedEnquiry.owner_name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEnquiry(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Locality" value={selectedEnquiry.locality || selectedEnquiry.city || "Unknown"} icon={MapPin} />
                <DataField label="Monthly Rent" value={selectedEnquiry.rent || "0"} icon={IndianRupee} isPrice />
                <DataField label="Gender" value={selectedEnquiry.gender_suitability || "Any"} icon={Users} />
                <DataField label="Status" value={selectedEnquiry.status === "pending" ? "Pending Review" : `Routed to ${selectedEnquiry.assigned_to}`} icon={Hourglass} />
              </div>

              {/* Description */}
              <div>
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Property Description</h4>
                 <div className="bg-slate-50 rounded-2xl p-4 text-[13px] text-slate-600 font-medium leading-relaxed border border-slate-100">
                    {selectedEnquiry.description || "No description provided by the owner."}
                 </div>
              </div>

              {/* Photos */}
              {selectedEnquiry.photos && selectedEnquiry.photos.length > 0 && (
                <div>
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Media Gallery ({selectedEnquiry.photos.length})</h4>
                   <div className="flex gap-3 overflow-x-auto pb-4 snap-x custom-scrollbar">
                      {selectedEnquiry.photos.map((img, i) => (
                        <img key={i} src={img} className="w-32 h-32 object-cover rounded-2xl snap-center shrink-0 border border-slate-100 shadow-sm" alt="view" />
                      ))}
                   </div>
                </div>
              )}

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[8px] tracking-widest mb-0.5">Owner Phone</p>
                  <p className="font-bold text-slate-700">{selectedEnquiry.owner_phone || "—"}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-400 uppercase text-[8px] tracking-widest mb-0.5">Owner Email</p>
                  <p className="font-bold text-slate-700">{selectedEnquiry.owner_email || "—"}</p>
                </div>
                {selectedEnquiry.assigned_to && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-slate-200/60">
                    <p className="font-bold text-slate-400 uppercase text-[8px] tracking-widest mb-0.5">Assigned Agent</p>
                    <p className="font-bold text-slate-700">{selectedEnquiry.assigned_to} ({selectedEnquiry.assigned_area || "General Area"})</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3">
              <button onClick={() => setSelectedEnquiry(null)} className="px-6 py-2.5 rounded-2xl text-[10px] font-bold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest">
                Cancel
              </button>
              {selectedEnquiry.status === "pending" && (
                <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-8 py-2.5 rounded-2xl text-[10px] font-bold text-white bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all uppercase tracking-widest">
                  <Check className="w-4 h-4" /> Approve Enquiry
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="font-bold text-slate-800 text-base leading-tight">Approve Enquiry</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Assign property to a team member</p>
              </div>
              <button onClick={() => { setShowAssignModal(false); setSelectedEmployeeId(""); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Employee</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <option value="">Choose Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.loginId || emp.id} value={emp.loginId || emp.id}>
                      {emp.name} | {emp.loginId || emp.id} | {emp.area || "-"} | {emp.city || "-"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => {
                    const emp = employees.find(e => String(e.loginId || e.id) === String(selectedEmployeeId));
                    if (emp) handleAssign(emp);
                    else alert("Please select an employee");
                  }} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-md shadow-emerald-600/10 active:scale-95"
                >
                  Confirm Approval
                </button>
                <button onClick={() => { setShowAssignModal(false); setSelectedEmployeeId(""); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DataField({ label, value, icon: Icon, isPrice }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
       <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
          <Icon className="w-4 h-4" />
       </div>
       <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
          <p className={cn("text-xs font-bold text-slate-800", isPrice && "text-emerald-600")}>
             {isPrice && "₹"}{value}
          </p>
       </div>
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-4 group hover:translate-y-[-2px] transition-all">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-110", bgColors[color])}>
         <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">{label}</p>
         <p className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-2">{value}</p>
         <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
            {trend}
         </div>
      </div>
    </div>
  );
}
