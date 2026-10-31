import React, { useEffect, useMemo, useState } from "react";
import { 
  Building2, Users, Shield, Clock, Search, 
  ArrowUpRight, ArrowDownRight, MoreVertical, 
  Filter, Globe, MapPin, Zap, Sheet, Trash2, 
  ChevronRight, Phone, Mail, User, Image as ImageIcon,
  Activity, Home, CheckCircle2, XCircle, Hourglass,
  Check, X, Eye, ClipboardCheck, AlertTriangle,
  Camera, Map, Star, Edit3, Trash, Bell, BellOff,
  RefreshCw, Download, PauseCircle, ShieldCheck,
  Plus, Loader2, Save, Sparkles, Layers, Box,
  Globe2, IndianRupee, Inbox, Smartphone, Monitor, Info, UserPlus
} from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import { fetchJson, getAuthHeader } from "../../utils/api";
import { toast } from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001" : "https://roohmy-backend-xwa9.vercel.app");

export default function SuperadminEnquiry() {
  const isEmployeeView = typeof window !== "undefined" && window.location.pathname.startsWith("/employee");
  const [search, setSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [listingRequests, setListingRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const fmtVal = (v) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  const handleBulkUpdate = async (status) => {
    if (selectedIds.size === 0) return;
    const confirmMsg = `Are you sure you want to mark all ${selectedIds.size} selected enquiries as ${status}?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await fetchJson(`/api/website-enquiries/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: status.toLowerCase() })
        });
      }
      setSelectedIds(new Set());
      fetchEnquiries();
    } catch (err) {
      console.error(err);
      alert("Failed to update some enquiries");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmMsg = `Are you sure you want to permanently delete all ${selectedIds.size} selected enquiries?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkProcessing(true);
    try {
      for (const id of selectedIds) {
        await fetchJson(`/api/website-enquiries/${id}`, {
          method: "DELETE"
        });
      }
      setSelectedIds(new Set());
      fetchEnquiries();
    } catch (err) {
      console.error(err);
      alert("Failed to delete some enquiries");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const [enqRes, propsRes, empRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/website-enquiries?t=${Date.now()}`, { headers: getAuthHeader() })
          .then(r => r.json())
          .catch(() => ({})),
        fetchJson("/api/properties?pendingApproval=true&withoutVisitReport=true&limit=1000").catch(() => ({})),
        fetchJson("/api/employees").catch(() => ({}))
      ]);

      if (enqRes?.enquiries) {
        setEnquiries(enqRes.enquiries.map(enq => ({
          id: enq._id || `ENQ-${Math.floor(Math.random()*10000)}`,
          name: enq.name || enq.owner_name || "Unknown",
          property: enq.property_name || enq.property || "Unknown Property",
          city: enq.city || enq.locality || "N/A",
          phone: enq.owner_phone || enq.phone || "",
          email: enq.owner_email || enq.email || "",
          rent: enq.rent || 0,
          status: enq.status === "approved" ? "Approved" : 
                  enq.status === "rejected" ? "Rejected" : 
                  enq.status === "on_hold" ? "On Hold" : "Pending",
          date: new Date(enq.created_at || enq.createdAt || Date.now()).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }),
          initial: (enq.name || enq.owner_name || "U")[0].toUpperCase(),
          color: ["blue", "indigo", "amber", "rose", "emerald"][Math.floor(Math.random() * 5)],
          raw: enq
        })));
      }

      if (propsRes?.success) {
        const list = (propsRes.properties || []).filter(p => !p.visitId || !String(p.visitId).trim());
        setListingRequests(list);
      }

      if (empRes?.success) {
        setEmployees(empRes.data || []);
      }
    } catch (err) {
      console.error("Error fetching enquiries & listing requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleApproveListingRequest = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Property listing request approved & published!");
        setListingRequests(prev => prev.filter(p => p._id !== id));
        setSelectedProperty(null);
      } else {
        toast.error(data.message || "Failed to approve property listing request");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve property listing request");
    }
  };

  const handleRejectListingRequest = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/properties/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({ status: "blocked", isPublished: false, isLiveOnWebsite: false })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Property listing request rejected");
        setListingRequests(prev => prev.filter(p => p._id !== id));
        setSelectedProperty(null);
      } else {
        toast.error(data.message || "Failed to reject property listing request");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject property listing request");
    }
  };

  const handleAssignVerification = async (itemId, employeeId, employeeName) => {
    try {
      const endpoint = `${getApiUrl()}/api/properties/${itemId}/assign-verification`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ employeeId, employeeName })
      });
      const data = await res.json();

      if (data.success || res.ok) {
        toast.success(data.message || `Successfully assigned to ${employeeName || "Staff"}`);
        const assignedId = data.property?.assignedTo || employeeId;
        const assignedName = data.property?.assignedToName || employeeName;
        setListingRequests(prev =>
          prev.map(p => (p._id === itemId ? { ...p, assignedTo: assignedId, assignedToName: assignedName } : p))
        );
        setAssignModal(null);
        fetchEnquiries();
      } else {
        toast.error(data.message || "Assignment failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to assign verification");
    }
  };

  const filteredListingRequests = useMemo(() => {
    const q = listingSearch.trim().toLowerCase();
    if (!q) return listingRequests;
    return listingRequests.filter(p =>
      `${p.title || ""} ${p.ownerName || ""} ${p.ownerLoginId || ""} ${p.ownerPhone || ""} ${p.city || ""} ${p.locality || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [listingRequests, listingSearch]);

  const filteredEnquiries = enquiries.filter(enq => 
    enq.name.toLowerCase().includes(search.toLowerCase()) || 
    enq.property.toLowerCase().includes(search.toLowerCase())
  );

  const enquiryStatus = useMemo(() => {
    const total = enquiries.length;
    const approved = enquiries.filter(e => e.status === "Approved").length;
    const pending = enquiries.filter(e => e.status === "Pending").length;
    const rejected = enquiries.filter(e => e.status === "Rejected").length;
    const onHold = enquiries.filter(e => e.status === "On Hold").length;
    const pct = (n) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "0%";
    return [
      { name: "Approved", value: approved, color: "#10b981", percent: pct(approved) },
      { name: "Pending", value: pending, color: "#f59e0b", percent: pct(pending) },
      { name: "Rejected", value: rejected, color: "#ef4444", percent: pct(rejected) },
      { name: "On Hold", value: onHold, color: "#2563eb", percent: pct(onHold) },
    ];
  }, [enquiries]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Online Leads & Property Listing Requests"
        subtitle="Review and approve property listing requests and track customer leads received from the website."
        breadcrumbs={[
          { label: "Dashboard" },
          { label: "Online Leads & Listing Requests", active: true }
        ]}
        actions={
          <button onClick={fetchEnquiries} className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-2xs cursor-pointer">
             <RefreshCw className={cn("w-3.5 h-3.5 text-[#095256]", loading && "animate-spin")} /> Refresh
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCardHorizontal label="Property Listing Requests" value={listingRequests.length} trend="Pending Approval" up icon={Building2} color="indigo" />
        <StatCardHorizontal label="Total Enquiries" value={enquiries.length} trend="+15.2%" up icon={Inbox} color="blue" />
        <StatCardHorizontal label="Pending Leads" value={enquiries.filter(e => e.status === "Pending").length} trend="+5.3%" up icon={Hourglass} color="amber" />
        <StatCardHorizontal label="Approved Leads" value={enquiries.filter(e => e.status === "Approved").length} trend="+12.4%" up icon={CheckCircle2} color="emerald" />
        <StatCardHorizontal label="Rejected Leads" value={enquiries.filter(e => e.status === "Rejected").length} trend="-2.1%" up={false} icon={XCircle} color="rose" />
      </div>

      {/* ── PROPERTY LISTING REQUESTS TABLE (Directly below Stats Cards) ── */}
      <div className="bg-white rounded-[16px] border border-[#E1E6EA] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E1E6EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#10242A] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0E7C86]" /> Property Listing Requests ({filteredListingRequests.length})
            </h3>
            <p className="text-xs text-[#4A5961] mt-0.5">
              All pending property listing requests submitted by owners or via the website form.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={listingSearch}
              onChange={e => setListingSearch(e.target.value)}
              placeholder="Search property, owner, city..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#095256] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
              <tr>
                <th className="px-5 py-3">Property Details</th>
                <th className="px-5 py-3">Owner Details</th>
                <th className="px-5 py-3">Location</th>
                {!isEmployeeView && <th className="px-5 py-3">Assigned Employee</th>}
                <th className="px-5 py-3">Date Requested</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6EA]">
              {loading ? (
                <tr>
                  <td colSpan={isEmployeeView ? 5 : 6} className="px-6 py-12 text-center text-xs font-semibold text-[#4A5961]">
                    Loading property listing requests...
                  </td>
                </tr>
              ) : filteredListingRequests.length === 0 ? (
                <tr>
                  <td colSpan={isEmployeeView ? 5 : 6} className="px-6 py-12 text-center text-xs font-semibold text-[#4A5961]">
                    No property listing requests pending
                  </td>
                </tr>
              ) : (
                filteredListingRequests.map(p => (
                  <tr key={p._id} className="hover:bg-[#F4F6F8]/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
                          <Building2 size={15} />
                        </div>
                        <div>
                          <p className="font-bold text-[#10242A] text-xs">{p.title || "No Title"}</p>
                          <p className="text-[10px] text-[#4A5961] mt-0.5 uppercase">{p.propertyType || "Property"} • ₹{p.monthlyRent || p.rent || 0}/mo</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-bold text-[#10242A]">{p.ownerName || p.contact?.name || "Unknown Owner"}</p>
                      <p className="text-[10px] text-[#4A5961] font-mono mt-0.5">
                        {p.ownerLoginId || p.ownerPhone || p.contact?.number || "N/A"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-[#4A5961] flex items-center gap-1">
                        <MapPin size={11} className="text-[#0E7C86]" /> {[p.locality, p.city].filter(Boolean).join(", ") || "N/A"}
                      </p>
                    </td>
                    {!isEmployeeView && (
                      <td className="px-5 py-3">
                        {p.assignedToName || p.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-[#10242A] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                              <User size={11} className="text-[#0E7C86]" /> {p.assignedToName || p.assignedTo}
                            </span>
                            <button
                              onClick={() => setAssignModal({ id: p._id, city: p.city, title: p.title })}
                              className="text-[10px] text-[#4A5961] hover:text-[#0E7C86] underline cursor-pointer"
                              title="Reassign"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssignModal({ id: p._id, city: p.city, title: p.title })}
                            className="text-[11px] font-semibold text-[#0E7C86] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <UserPlus size={11} /> Assign
                          </button>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3 text-xs text-[#4A5961]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedProperty(p)}
                          className="px-2.5 py-1 bg-[#F4F6F8] hover:bg-[#E6F4F5] text-[#10242A] border border-[#E1E6EA] rounded-[6px] text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => handleApproveListingRequest(p._id)}
                          className="px-2.5 py-1 bg-[#0E7C86] hover:bg-[#09626A] text-white rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectListingRequest(p._id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer"
                        >
                          Reject
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Yield Matrix Chart */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Lead Yield Matrix</h3>
              <button onClick={fetchEnquiries} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                 <RefreshCw className="w-3.5 h-3.5" />
              </button>
           </div>
           <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={enquiryStatus} dataKey="value" innerRadius={35} outerRadius={55} paddingAngle={10} stroke="none">
                          {enquiryStatus.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-slate-800 tracking-tight leading-none">{enquiries.length}</p>
                    <p className="text-[7px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Total Pipeline</p>
                 </div>
              </div>
              <div className="w-full mt-8 space-y-2">
                 {enquiryStatus.map(s => (
                    <div key={s.name} className="flex items-center justify-between group p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-100">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full shadow-sm" style={{backgroundColor: s.color}} />
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider leading-none">{s.name}</span>
                       </div>
                       <p className="text-[10px] font-bold text-slate-800 leading-none">{s.value} <span className="text-[8px] text-slate-400 ml-1 font-medium opacity-60">({s.percent})</span></p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Lead Pulse Ledger */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest leading-none">Website Enquiries Ledger</h3>
              <div className="flex items-center gap-3">
                 <div className="relative group w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <input 
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search leads..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
                   />
                 </div>
                 <button onClick={fetchEnquiries} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition-all border border-slate-100 shadow-sm">
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                 </button>
              </div>
           </div>

           {filteredEnquiries.length > 0 && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                 <input
                   type="checkbox"
                   disabled={isBulkProcessing}
                   className="rounded border-slate-300 cursor-pointer"
                   checked={filteredEnquiries.every(enq => selectedIds.has(enq.id))}
                   onChange={() => {
                     const allSelected = filteredEnquiries.every(enq => selectedIds.has(enq.id));
                     const next = new Set(selectedIds);
                     if (allSelected) {
                       filteredEnquiries.forEach(enq => next.delete(enq.id));
                     } else {
                       filteredEnquiries.forEach(enq => next.add(enq.id));
                     }
                     setSelectedIds(next);
                   }}
                 />
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Select All ({filteredEnquiries.length})</span>
              </div>
           )}

           <div className="space-y-3 h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-[10px] font-bold">Scanning Pipeline...</span>
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <span className="text-[10px] font-bold">No Leads Found</span>
                </div>
              ) : filteredEnquiries.map(enq => (
                <div key={enq.id} className="flex items-center gap-4 group cursor-pointer p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all duration-300"
                  onClick={() => {
                    const next = new Set(selectedIds);
                    if (next.has(enq.id)) next.delete(enq.id);
                    else next.add(enq.id);
                    setSelectedIds(next);
                  }}
                >
                   <input
                     type="checkbox"
                     disabled={isBulkProcessing}
                     className="rounded border-slate-300 cursor-pointer shrink-0"
                     checked={selectedIds.has(enq.id)}
                     onClick={(e) => e.stopPropagation()}
                     onChange={() => {
                       const next = new Set(selectedIds);
                       if (next.has(enq.id)) next.delete(enq.id);
                       else next.add(enq.id);
                       setSelectedIds(next);
                     }}
                   />
                   <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm transition-transform group-hover:scale-105 shrink-0",
                      enq.color === "blue" ? "bg-blue-600 shadow-blue-50" :
                      enq.color === "amber" ? "bg-amber-600 shadow-amber-50" :
                      enq.color === "indigo" ? "bg-indigo-600 shadow-indigo-50" :
                      enq.color === "emerald" ? "bg-emerald-600 shadow-emerald-50" : "bg-rose-600 shadow-rose-50"
                   )}>
                      {enq.initial}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold text-slate-800 truncate leading-none">{enq.name}</p>
                        <span className={cn(
                           "text-[7px] font-bold px-1.5 py-0.5 rounded-lg border uppercase tracking-wider shadow-sm whitespace-nowrap",
                           enq.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                           enq.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                           enq.status === "On Hold" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {enq.status}
                        </span>
                      </div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate mt-1.5 opacity-60 leading-none">{enq.property} • {enq.city}</p>
                   </div>
                   <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-slate-800 leading-none">{enq.date}</p>
                      <p className="text-[8px] font-mono font-bold text-blue-600 mt-1.5 uppercase tracking-tighter opacity-70 leading-none truncate max-w-[80px]">{enq.id}</p>
                   </div>
                   <button className="p-1.5 rounded-lg text-slate-300 hover:text-slate-800 hover:bg-white hover:shadow-sm transition-all" onClick={(e) => e.stopPropagation()}><ChevronRight className="w-4 h-4" /></button>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Property Listing Request Details Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] w-full max-w-4xl shadow-2xl border border-[#E1E6EA] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-[#E1E6EA] flex items-start justify-between bg-[#F4F6F8] shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#10242A]">
                  Property Listing Request: {selectedProperty.title}
                </h3>
                <p className="text-[10px] text-[#4A5961] font-semibold uppercase tracking-wider mt-1">
                  Requested by: {selectedProperty.ownerName || selectedProperty.ownerLoginId || "Owner"}
                </p>
              </div>
              <button onClick={() => setSelectedProperty(null)} className="p-1.5 text-[#4A5961] hover:text-[#10242A] hover:bg-white rounded-lg transition-all"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#10242A] uppercase tracking-wider">Property Media</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProperty.images?.length > 0 ? (
                      selectedProperty.images.map((img, i) => (
                        <img
                          key={i}
                          src={typeof img === "object" ? img.url : img}
                          alt=""
                          className="w-full h-32 object-cover rounded-xl border border-[#E1E6EA] cursor-pointer"
                          loading="lazy"
                          onClick={() => setFullscreenImage(typeof img === "object" ? img.url : img)}
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ))
                    ) : (
                      <div className="col-span-2 py-8 bg-[#F4F6F8] rounded-xl text-center text-xs font-semibold text-[#4A5961] uppercase">No images uploaded</div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#10242A] uppercase tracking-wider">Details</h4>
                  <div className="bg-[#F4F6F8] rounded-xl p-4 border border-[#E1E6EA] space-y-3">
                    {[
                      { label: "Property Name", val: selectedProperty.title },
                      { label: "Property Type", val: selectedProperty.propertyType },
                      { label: "Owner Name", val: selectedProperty.ownerName || selectedProperty.contact?.name },
                      { label: "Owner Phone", val: selectedProperty.ownerPhone || selectedProperty.contact?.number },
                      { label: "City", val: selectedProperty.city },
                      { label: "Locality", val: selectedProperty.locality || selectedProperty.area },
                      { label: "Full Address", val: selectedProperty.address },
                      { label: "Monthly Rent", val: `₹${selectedProperty.monthlyRent || selectedProperty.rent || 0}` },
                    ].map(f => (
                      <div key={f.label} className="flex justify-between text-xs items-start">
                        <span className="text-[#4A5961] font-semibold shrink-0">{f.label}:</span>
                        <span className="text-[#10242A] font-bold text-right ml-4">{fmtVal(f.val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#E1E6EA] bg-[#F4F6F8] flex gap-2 justify-end shrink-0">
              <button onClick={() => setSelectedProperty(null)} className="px-3.5 py-2 bg-white border border-[#E1E6EA] text-[#10242A] rounded-lg text-xs font-semibold hover:bg-[#F4F6F8] transition-all">Cancel</button>
              {!isEmployeeView && (
                <button onClick={() => setAssignModal({ id: selectedProperty._id, city: selectedProperty.city, title: selectedProperty.title })} className="px-3.5 py-2 bg-white border border-[#E1E6EA] text-[#0E7C86] rounded-lg text-xs font-semibold hover:bg-[#E6F4F5] transition-all flex items-center gap-1.5"><UserPlus size={13} /> Assign Verification</button>
              )}
              <button
                onClick={() => handleRejectListingRequest(selectedProperty._id)}
                className="px-3.5 py-2 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50 transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => handleApproveListingRequest(selectedProperty._id)}
                className="px-3.5 py-2 bg-[#0E7C86] hover:bg-[#09626A] text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Check size={13} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={() => setFullscreenImage(null)}>
          <button onClick={() => setFullscreenImage(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"><X size={22} /></button>
          <img src={fullscreenImage} alt="Fullscreen view" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Assign Verification Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-[16px] shadow-2xl p-5 w-full max-w-sm border border-[#E1E6EA] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-[#10242A]">Assign Verification Staff</h4>
                {assignModal.title && (
                  <p className="text-[11px] text-[#4A5961] truncate max-w-[220px]">
                    {assignModal.title} {assignModal.city ? `(${assignModal.city})` : ""}
                  </p>
                )}
              </div>
              <button onClick={() => setAssignModal(null)} className="text-xs text-[#4A5961] hover:text-[#10242A] p-1 rounded-full cursor-pointer">✕</button>
            </div>

            <button
              onClick={() => handleAssignVerification(assignModal.id, null, null)}
              className="w-full mb-3 px-3 py-2 bg-[#E6F4F5] hover:bg-[#d0edef] text-[#0E7C86] rounded-[8px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#0E7C86]/20"
            >
              <span>🤖</span> Auto-Assign (Visit Creator / Local Agent)
            </button>

            <div className="text-[11px] font-semibold text-[#4A5961] mb-1.5 flex items-center justify-between">
              <span>Or pick an employee:</span>
              {assignModal.city && <span className="text-[10px] text-[#0E7C86]">Local first</span>}
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-64 flex-1 pr-1">
              {(() => {
                const NON_FIELD_ROLES = ['cook', 'cleaner', 'hostel staff', 'sweeper', 'housekeeping', 'driver', 'security', 'maintenance', 'peon', 'maid', 'warden', 'staff', 'helper', 'guard'];
                const eligible = employees.filter(emp => {
                  if (emp.parentLoginId) return false;
                  if (emp.isActive === false || emp.isDeleted === true) return false;
                  const r = (emp.role || '').toLowerCase();
                  return !NON_FIELD_ROLES.some(nfr => r === nfr || r.includes(nfr));
                });

                const modalCity = (assignModal.city || '').toLowerCase().trim();
                const sorted = [...eligible].sort((a, b) => {
                  const aLocal = modalCity && (a.city || '').toLowerCase().includes(modalCity);
                  const bLocal = modalCity && (b.city || '').toLowerCase().includes(modalCity);
                  if (aLocal && !bLocal) return -1;
                  if (!aLocal && bLocal) return 1;
                  return (a.name || '').localeCompare(b.name || '');
                });

                if (sorted.length === 0) {
                  return <p className="text-xs text-[#4A5961] text-center py-4">No verification staff available.</p>;
                }

                return sorted.map(emp => {
                  const isLocal = modalCity && (emp.city || '').toLowerCase().includes(modalCity);
                  return (
                    <button
                      key={emp._id || emp.loginId}
                      onClick={() => handleAssignVerification(assignModal.id, emp.loginId, emp.name)}
                      className={`w-full text-left px-3 py-2 text-xs rounded-[8px] transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                        isLocal
                          ? 'bg-[#F0FDF4] border-emerald-200 hover:bg-[#DCFCE7]'
                          : 'hover:bg-[#E6F4F5] hover:text-[#0E7C86] border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                          isLocal ? 'bg-emerald-100 text-emerald-800' : 'bg-[#E6F4F5] text-[#0E7C86]'
                        }`}>
                          {emp.name?.split(" ").map(n=>n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#10242A] leading-tight truncate">{emp.name}</p>
                          <p className="text-[10px] text-[#4A5961] truncate">
                            {emp.loginId} {emp.role ? `• ${emp.role}` : ''} {emp.city ? `• ${emp.city}` : ''}
                          </p>
                        </div>
                      </div>
                      {isLocal && (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                          📍 Local
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-8 py-4 rounded-3xl border border-slate-800 shadow-2xl flex items-center gap-6 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 border-r border-slate-850 pr-6">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shadow-lg animate-pulse">
              {selectedIds.size}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={isBulkProcessing}
              onClick={() => handleBulkUpdate("Approved")}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><Check size={14} /> Approve</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => handleBulkUpdate("Rejected")}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><X size={14} /> Reject</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => handleBulkUpdate("On Hold")}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><PauseCircle size={14} /> Hold</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center gap-2"
            >
              {isBulkProcessing ? "Processing..." : <><Trash2 size={14} /> Delete</>}
            </button>
            <button
              disabled={isBulkProcessing}
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors pl-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCardHorizontal({ label, value, trend, up, icon: Icon, color }) {
  const bgColors = { 
    blue: "bg-blue-50 text-blue-600 border-blue-100", 
    amber: "bg-amber-50 text-amber-600 border-amber-100", 
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100" 
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
