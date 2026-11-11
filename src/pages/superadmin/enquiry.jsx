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
import { fetchJson, getAuthHeader, clearApiCache } from "../../utils/api";
import { broadcastStatusChange, useLiveStatusSync } from "../../utils/liveStatusSync";
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

  const getListingImages = (prop) => {
    if (!prop) return [];
    const seen = new Set();
    const out = [];
    const base = getApiUrl().replace(/\/+$/, "");
    const pushUrl = (raw) => {
      const str = raw && typeof raw === "object" ? (raw.url || raw.secure_url || raw.src || raw.path || "") : String(raw || "");
      const clean = str.trim();
      if (!clean) return;
      const full = /^(https?:|data:|blob:)/i.test(clean)
        ? clean
        : (clean.startsWith("/") ? `${base}${clean}` : `${base}/${clean}`);
      if (!seen.has(full)) {
        seen.add(full);
        out.push(full);
      }
    };
    pushUrl(prop.featuredImage);
    pushUrl(prop.image);
    if (Array.isArray(prop.images)) prop.images.forEach(pushUrl);
    if (Array.isArray(prop.professionalPhotos)) prop.professionalPhotos.forEach(pushUrl);
    if (prop.propertyViews && typeof prop.propertyViews === "object") {
      Object.values(prop.propertyViews).forEach((arr) => {
        if (Array.isArray(arr)) arr.forEach(pushUrl);
      });
    }
    return out;
  };

  const resolveAssignedEmployeeName = (p) => {
    if (!p) return "";
    if (p.assignedToName && String(p.assignedToName).trim()) return String(p.assignedToName).trim();
    const code = String(p.assignedToLoginId || p.assignedTo || "").trim();
    if (!code) return "";
    const match = employees.find(
      (emp) =>
        (emp.loginId && emp.loginId.toLowerCase() === code.toLowerCase()) ||
        (emp.email && emp.email.toLowerCase() === code.toLowerCase())
    );
    return match?.name || code;
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
      broadcastStatusChange({ type: "enquiry" });
      fetchEnquiries({ silent: true });
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
      broadcastStatusChange({ type: "enquiry" });
      fetchEnquiries({ silent: true });
    } catch (err) {
      console.error(err);
      alert("Failed to delete some enquiries");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const fetchEnquiries = async (opts = {}) => {
    const silent = Boolean(opts?.silent);
    try {
      if (!silent) setLoading(true);
      clearApiCache("/api/properties");
      const [enqRes, propsRes, empRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/website-enquiries?t=${Date.now()}`, { headers: getAuthHeader(), cache: "no-store" })
          .then(r => r.json())
          .catch(() => ({})),
        fetchJson(`/api/properties?pendingApproval=true&withoutVisitReport=true&limit=1000&t=${Date.now()}`).catch(() => ({})),
        fetchJson("/api/employees").catch(() => ({}))
      ]);

      if (enqRes?.enquiries) {
        setEnquiries(enqRes.enquiries.map((enq, idx) => ({
          id: enq._id || enq.enquiry_id || `ENQ-${idx}`,
          enquiryId: enq.enquiry_id || enq._id,
          name: enq.name || enq.owner_name || "Unknown",
          property: enq.property_name || enq.property || "Unknown Property",
          city: enq.city || enq.locality || "N/A",
          phone: enq.owner_phone || enq.phone || "",
          email: enq.owner_email || enq.email || "",
          rent: enq.rent || 0,
          assignedTo: enq.assigned_to || enq.assigned_to_loginId || "",
          assignedToLoginId: enq.assigned_to_loginId || "",
          status: enq.status === "approved" || enq.status === "accepted" || enq.status === "completed" ? "Approved" : 
                  enq.status === "rejected" ? "Rejected" : 
                  enq.status === "on_hold" ? "On Hold" :
                  enq.status === "assigned" ? "Assigned" : "Pending",
          date: new Date(enq.created_at || enq.createdAt || Date.now()).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }),
          initial: (enq.name || enq.owner_name || "U")[0].toUpperCase(),
          color: ["blue", "indigo", "amber", "rose", "emerald"][String(enq._id || enq.enquiry_id || idx).length % 5],
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
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  useLiveStatusSync(() => fetchEnquiries({ silent: true }), {
    pollMs: 10000,
    types: ["enquiry", "visit", "kyc", "owner"],
  });

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
      const isEnquiryAssign = assignModal?.type === "enquiry";
      const endpoint = isEnquiryAssign
        ? `${getApiUrl()}/api/website-enquiries/assign/${itemId}`
        : `${getApiUrl()}/api/properties/${itemId}/assign-verification`;
      const res = await fetch(endpoint, {
        method: isEnquiryAssign ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(
          isEnquiryAssign
            ? { assigned_to_loginId: employeeId, assigned_to: employeeName, employeeId, employeeName }
            : { employeeId, employeeName }
        )
      });
      const data = await res.json();

      if (data.success || res.ok) {
        toast.success(data.message || `Successfully assigned to ${employeeName || "Staff"}`);
        const assignedId = data.property?.assignedTo || data.employee?.loginId || employeeId;
        const assignedName = data.property?.assignedToName || data.employee?.name || employeeName;
        if (!isEnquiryAssign) {
          setListingRequests(prev =>
            prev.map(p => (p._id === itemId ? { ...p, assignedTo: assignedId, assignedToName: assignedName } : p))
          );
        } else {
          setEnquiries(prev =>
            prev.map(e => ((e.id === itemId || e.enquiryId === itemId) ? { ...e, assignedTo: assignedName || assignedId, status: "Assigned" } : e))
          );
        }
        broadcastStatusChange({ type: "enquiry", enquiryId: itemId });
        setAssignModal(null);
        fetchEnquiries({ silent: true });
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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Online Leads & Property Listing Requests</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Review and approve property listing requests and track customer leads received from the website.</p>
        </div>
        <button onClick={fetchEnquiries} className="bg-white border border-[#CBD3D9] text-[#10242A] px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold hover:bg-[#F4F6F8] transition-all flex items-center gap-2 shadow-xs cursor-pointer">
           <RefreshCw className={cn("w-3.5 h-3.5 text-[#4A5961]", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Metrics Row (NO ICONS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCardHorizontal label="Property Listing Requests" value={listingRequests.length} />
        <StatCardHorizontal label="Total Enquiries" value={enquiries.length} />
        <StatCardHorizontal label="Pending Leads" value={enquiries.filter(e => e.status === "Pending").length} />
        <StatCardHorizontal label="Approved Leads" value={enquiries.filter(e => e.status === "Approved").length} />
        <StatCardHorizontal label="Rejected Leads" value={enquiries.filter(e => e.status === "Rejected").length} />
      </div>

      {/* Search & Filter Row for Property Listing Requests (Outside & Above Table Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#10242A]">
            Property Listing Requests ({filteredListingRequests.length})
          </h3>
          <p className="text-[12px] text-[#4A5961]">
            All pending property listing requests submitted by owners or via the website form.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C9BA5]" size={15} />
          <input
            value={listingSearch}
            onChange={e => setListingSearch(e.target.value)}
            placeholder="Search property, owner, city..."
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>
      </div>

      {/* ── PROPERTY LISTING REQUESTS TABLE ── */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 pr-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Property Details</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner Details</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Location</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Assigned Employee</th>
                <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Date Requested</th>
                <th className="pb-2 pl-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[13px] font-medium text-[#4A5961]">
                    Loading property listing requests...
                  </td>
                </tr>
              ) : filteredListingRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[13px] font-medium text-[#4A5961]">
                    No property listing requests pending
                  </td>
                </tr>
              ) : (
                filteredListingRequests.map(p => (
                  <tr key={p._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 pr-4">
                      <div>
                        <p className="font-semibold text-[#10242A] text-[13px]">{p.title || "No Title"}</p>
                        <p className="text-[11px] text-[#4A5961] mt-0.5 uppercase">{p.propertyType || "Property"} • ₹{p.monthlyRent || p.rent || 0}/mo</p>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="text-[13px] font-semibold text-[#10242A]">{p.ownerName || p.contact?.name || "Unknown Owner"}</p>
                      <p className="text-[11px] text-[#4A5961] font-mono mt-0.5">
                        {p.ownerLoginId || p.ownerPhone || p.contact?.number || "N/A"}
                      </p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="text-[13px] font-medium text-[#4A5961] flex items-center gap-1">
                        <MapPin size={12} className="text-[#0E7C86]" /> {[p.locality, p.city].filter(Boolean).join(", ") || "N/A"}
                      </p>
                    </td>
                    <td className="py-2.5 px-4">
                      {(() => {
                        const assignedName = resolveAssignedEmployeeName(p);
                        const assignedId = p.assignedToLoginId || p.assignedTo || "";
                        if (assignedName) {
                          return (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="text-[11px] font-semibold text-[#10242A] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1"
                                title={assignedId && assignedId !== assignedName ? `${assignedName} (${assignedId})` : assignedName}
                              >
                                <User size={11} className="text-[#0E7C86]" /> {assignedName}
                              </span>
                              {!isEmployeeView && (
                                <button
                                  onClick={() => setAssignModal({ id: p._id, type: "property", city: p.city, title: p.title })}
                                  className="text-[11px] text-[#4A5961] hover:text-[#0E7C86] underline cursor-pointer"
                                  title="Reassign"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          );
                        }
                        if (!isEmployeeView) {
                          return (
                            <button
                              onClick={() => setAssignModal({ id: p._id, type: "property", city: p.city, title: p.title })}
                              className="text-[12px] font-semibold text-[#0E7C86] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <UserPlus size={12} /> Assign
                            </button>
                          );
                        }
                        return <span className="text-[11px] text-[#4A5961]">Unassigned</span>;
                      })()}
                    </td>
                    <td className="py-2.5 px-4 text-[12px] text-[#4A5961]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="py-2.5 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedProperty(p)}
                          className="px-2.5 py-1 bg-white hover:bg-[#F4F6F8] text-[#10242A] border border-[#CBD3D9] rounded-[6px] text-[12px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          onClick={() => handleApproveListingRequest(p._id)}
                          className="px-2.5 py-1 bg-[#095256] hover:bg-[#073E42] text-white rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectListingRequest(p._id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer"
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

      {/* Search & Filter Row for Website Enquiries (Outside & Above Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h3 className="text-[15px] font-bold text-[#10242A]">Website Enquiries Ledger ({filteredEnquiries.length})</h3>
          <p className="text-[12px] text-[#4A5961]">Customer leads and pipeline breakdown.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA5]" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search leads..." 
              className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Yield Matrix Chart */}
        <div className="lg:col-span-4 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider leading-none">Lead Yield Matrix</h3>
           </div>
           <div className="flex flex-col items-center">
              <div className="relative w-36 h-36">
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
                    <p className="text-xl font-bold text-[#10242A] tracking-tight leading-none">{enquiries.length}</p>
                    <p className="text-[9px] text-[#4A5961] font-semibold uppercase mt-1">Total</p>
                 </div>
              </div>
              <div className="w-full mt-4 space-y-1.5">
                 {enquiryStatus.map(s => (
                    <div key={s.name} className="flex items-center justify-between p-2 hover:bg-[#F9FAFB] rounded-[8px] transition-all border border-transparent hover:border-[#E1E6EA]">
                       <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}} />
                          <span className="text-[12px] font-medium text-[#4A5961]">{s.name}</span>
                       </div>
                       <p className="text-[13px] font-semibold text-[#10242A]">{s.value} <span className="text-[11px] text-[#8C9BA5] ml-1 font-normal">({s.percent})</span></p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Lead Pulse Ledger */}
        <div className="lg:col-span-8 bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
           {filteredEnquiries.length > 0 && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#F9FAFB] rounded-[8px] border border-[#E1E6EA]">
                 <input
                   type="checkbox"
                   disabled={isBulkProcessing}
                   className="rounded border-[#CBD3D9] cursor-pointer"
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
                 <span className="text-[12px] font-semibold text-[#4A5961]">Select All ({filteredEnquiries.length})</span>
              </div>
           )}

           <div className="divide-y divide-[#F0F4F6] max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#4A5961]">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#0E7C86]" />
                  <span className="text-[12px] font-semibold">Scanning Pipeline...</span>
                </div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#4A5961]">
                  <span className="text-[13px] font-semibold">No Leads Found</span>
                </div>
              ) : filteredEnquiries.map(enq => (
                <div key={enq.id} className="flex items-center gap-3.5 cursor-pointer py-2.5 px-2 hover:bg-[#F9FAFB] transition-colors"
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
                     className="rounded border-[#CBD3D9] cursor-pointer shrink-0"
                     checked={selectedIds.has(enq.id)}
                     onClick={(e) => e.stopPropagation()}
                     onChange={() => {
                       const next = new Set(selectedIds);
                       if (next.has(enq.id)) next.delete(enq.id);
                       else next.add(enq.id);
                       setSelectedIds(next);
                     }}
                   />
                   <div className="w-8 h-8 rounded-full bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center font-bold text-[12px] shrink-0">
                      {enq.initial}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-[#10242A] truncate leading-none">{enq.name}</p>
                        <span className={cn(
                           "text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap",
                           enq.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                           enq.status === "Assigned" ? "bg-teal-50 text-teal-700 border-teal-200" :
                           enq.status === "Pending" ? "bg-amber-50 text-amber-600 border-amber-100" :
                           enq.status === "On Hold" ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {enq.status}
                        </span>
                        {enq.assignedTo && (
                          <span className="text-[11px] font-semibold text-[#10242A] bg-[#F4F6F8] border border-[#E1E6EA] px-1.5 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                            <User size={10} className="text-[#0E7C86]" /> {enq.assignedTo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#4A5961] truncate mt-1 leading-none">{enq.property} • {enq.city} {enq.phone ? `• ${enq.phone}` : ""}</p>
                   </div>
                   {!isEmployeeView && (
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         setAssignModal({ id: enq.enquiryId || enq.id, type: "enquiry", city: enq.city, title: enq.property });
                       }}
                       className="px-2.5 py-1 bg-[#E6F4F5] hover:bg-[#D1ECEF] text-[#0E7C86] rounded-[6px] text-[11px] font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                     >
                       <UserPlus size={11} /> {enq.assignedTo ? "Reassign" : "Assign"}
                     </button>
                   )}
                   <div className="text-right shrink-0">
                      <p className="text-[12px] font-medium text-[#10242A] leading-none">{enq.date}</p>
                      <p className="text-[10px] font-mono text-[#4A5961] mt-1 leading-none truncate max-w-[80px]">{enq.id}</p>
                   </div>
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
                    {(() => {
                      const mediaList = getListingImages(selectedProperty);
                      return mediaList.length > 0 ? (
                        mediaList.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="w-full h-32 object-cover rounded-xl border border-[#E1E6EA] cursor-pointer"
                            onClick={() => setFullscreenImage(url)}
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ))
                      ) : (
                        <div className="col-span-2 py-8 bg-[#F4F6F8] rounded-xl text-center text-xs font-semibold text-[#4A5961] uppercase">No images uploaded</div>
                      );
                    })()}
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

function StatCardHorizontal({ label, value }) {
  return (
    <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
      <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{label}</p>
      <div className="mt-2">
        <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  );
}
