import React, { useState, useEffect, useMemo } from "react";
import { fetchJson, getAuthHeader } from "../../utils/api";
import {
  Check, X, Eye, UserCheck, Search, Filter, RefreshCw,
  Building2, Calendar, User, FileText, Image as ImageIcon,
  MapPin, IndianRupee, Clock, ArrowRight, CheckCircle2,
  XCircle, AlertCircle, ChevronLeft, ChevronRight, UserPlus, Info
} from "lucide-react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { toast } from "react-hot-toast";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const getApiUrl = () =>
  import.meta.env?.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5001" : "https://roohmy-backend-xwa9.vercel.app");

export default function VerificationCenter() {
  const isEmployeeView = typeof window !== "undefined" && window.location.pathname.startsWith("/employee");
  const [activeTab, setActiveTab] = useState("new_properties");
  const [newProperties, setNewProperties] = useState([]);
  const [propertyEdits, setPropertyEdits] = useState([]);
  const [roomEdits, setRoomEdits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      window.location.href = "/superadmin/login";
      return;
    }

    setLoading(true);
    try {
      const newPropsRes = await fetchJson("/api/properties?pendingApproval=true&limit=1000");
      if (newPropsRes.success) {
        setNewProperties(newPropsRes.properties || []);
      }

      const propEditsRes = await fetchJson("/api/properties?pendingChanges=true&limit=1000");
      if (propEditsRes.success) {
        setPropertyEdits(propEditsRes.properties || []);
      }

      const roomEditsRes = await fetchJson("/api/rooms/all?pendingChanges=true&limit=1000");
      if (roomEditsRes.success) {
        setRoomEdits(roomEditsRes.rooms || []);
      }

      const empRes = await fetchJson("/api/employees");
      if (empRes.success) {
        setEmployees(empRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load verification center data:", err);
      if (err?.message?.includes("Not authorized") || err?.status === 401) {
        window.location.href = "/superadmin/login";
      }
      toast.error("Error loading verification requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveNewProperty = async (id) => {
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
        toast.success("Property approved & published successfully!");
        setNewProperties(prev => prev.filter(p => p._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to approve property");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve property");
    }
  };

  const handleRejectNewProperty = async (id) => {
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
        toast.success("Property request rejected");
        setNewProperties(prev => prev.filter(p => p._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to reject property");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject property");
    }
  };

  const handleApprovePropertyEdit = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/approve-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Property edits approved & applied live!");
        setPropertyEdits(prev => prev.filter(p => p._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to approve changes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve changes");
    }
  };

  const handleRejectPropertyEdit = async (id, reason = "Rejected by admin") => {
    try {
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/reject-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({ rejectReason: reason })
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Property edits rejected");
        setPropertyEdits(prev => prev.filter(p => p._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to reject changes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject changes");
    }
  };

  const handleApproveRoomEdit = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/rooms/${id}/approve-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Room edits approved & applied live!");
        setRoomEdits(prev => prev.filter(r => r._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to approve room changes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve room changes");
    }
  };

  const handleRejectRoomEdit = async (id) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/rooms/${id}/reject-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success("Room edits rejected");
        setRoomEdits(prev => prev.filter(r => r._id !== id));
        setSelectedItem(null);
      } else {
        toast.error(data.message || "Failed to reject room changes");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject room changes");
    }
  };

  const handleAssignVerification = async (itemId, employeeId, employeeName) => {
    try {
      let endpoint = "";
      if (activeTab === "new_properties" || activeTab === "property_edits") {
        endpoint = `${getApiUrl()}/api/properties/${itemId}/assign-verification`;
      } else {
        endpoint = `${getApiUrl()}/api/rooms/${itemId}/assign-verification`;
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ employeeId, employeeName })
      });
      const data = await res.json();

      if (data.success || res.ok) {
        toast.success(data.message || `Successfully assigned to ${employeeName || 'Staff'}`);
        
        const assignedId = data.property?.assignedTo || employeeId;
        const assignedName = data.property?.assignedToName || employeeName;

        if (activeTab === "new_properties") {
          setNewProperties(prev => prev.map(p => p._id === itemId ? { ...p, assignedTo: assignedId, assignedToName: assignedName } : p));
        } else if (activeTab === "property_edits") {
          setPropertyEdits(prev => prev.map(p => p._id === itemId ? {
            ...p,
            assignedTo: assignedId,
            assignedToName: assignedName,
            pendingChanges: { ...p.pendingChanges, assignedTo: assignedId, assignedToName: assignedName }
          } : p));
        } else {
          setRoomEdits(prev => prev.map(r => r._id === itemId ? {
            ...r,
            pendingChanges: { ...r.pendingChanges, assignedTo: assignedId, assignedToName: assignedName }
          } : r));
        }

        setSelectedItem(null);
        setAssignModal(null);
        loadData();
      } else {
        toast.error(data.message || "Assignment failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to assign verification");
    }
  };

  const searchFilter = (items, keySelector) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => keySelector(item).toLowerCase().includes(query));
  };

  const filteredNewProperties = useMemo(() => {
    return searchFilter(newProperties, p => `${p.title} ${p.ownerName || ""} ${p.ownerLoginId || ""} ${p.city || ""}`);
  }, [newProperties, searchQuery]);

  const filteredPropertyEdits = useMemo(() => {
    return searchFilter(propertyEdits, p => `${p.title} ${p.ownerName || ""} ${p.ownerLoginId || ""} ${p.city || ""}`);
  }, [propertyEdits, searchQuery]);

  const filteredRoomEdits = useMemo(() => {
    return searchFilter(roomEdits, r => `${r.title} ${r.property?.title || ""} ${r.property?.ownerLoginId || ""}`);
  }, [roomEdits, searchQuery]);

  return (
    <div className="space-y-6 pb-8 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <PageHeader
        title="Verification & Approvals Center"
        subtitle="Manage pending property approvals, and track room/property picture modification requests."
        actions={
          <button onClick={loadData} className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-2xs cursor-pointer">
            <RefreshCw className={cn("w-3.5 h-3.5 text-[#095256]", loading && "animate-spin")} /> Refresh
          </button>
        }
      />

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: "new_properties", label: "New Property Approvals", count: newProperties.length, icon: Building2 },
          { key: "property_edits", label: "Property Edit Requests", count: propertyEdits.length, icon: FileText },
          { key: "room_edits", label: "Room Edit Requests", count: roomEdits.length, icon: ImageIcon }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between shadow-2xs",
              activeTab === tab.key
                ? "bg-white border-[#095256] ring-2 ring-[#095256]/10"
                : "bg-white border-slate-200/80 hover:border-slate-300"
            )}
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tab.label}</span>
              <p className="text-2xl font-bold text-slate-900 leading-none">{tab.count}</p>
            </div>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
              activeTab === tab.key ? "bg-[#095256]/10 text-[#095256] border-[#095256]/20" : "bg-slate-50 text-slate-500 border-slate-200/80"
            )}>
              <tab.icon className="w-5 h-5" />
            </div>
          </button>
        ))}
      </div>

      {/* Outside Search Bar */}
      <div className="flex justify-end">
        <div className="relative group w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, owner details, location..."
            className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#095256]/20 focus:border-[#095256] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Standalone Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <span className="text-xs font-semibold text-[#4A5961] ml-auto">
          {activeTab === "new_properties" && `${filteredNewProperties.length} pending properties`}
          {activeTab === "property_edits" && `${filteredPropertyEdits.length} property edits`}
          {activeTab === "room_edits" && `${filteredRoomEdits.length} room edits`}
        </span>
      </div>

      {/* List Ledger */}
      <div className="bg-white rounded-[16px] border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-[11px] font-semibold text-[#4A5961] uppercase tracking-wider border-b border-[#E1E6EA]">
              <tr>
                <th className="px-5 py-3">Property / Room Details</th>
                <th className="px-5 py-3">Owner Details</th>
                <th className="px-5 py-3">Location</th>
                {!isEmployeeView && <th className="px-5 py-3">Assigned Employee</th>}
                <th className="px-5 py-3">Date Requested</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E6EA]">
              {/* Tab 1: New Properties */}
              {activeTab === "new_properties" && (
                filteredNewProperties.length === 0 ? (
                  <tr><td colSpan={isEmployeeView ? 5 : 6} className="px-6 py-12 text-center text-xs font-semibold text-[#4A5961]">No property approvals pending</td></tr>
                ) : filteredNewProperties.map(p => (
                  <tr key={p._id} className="hover:bg-[#F4F6F8]/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
                          <Building2 size={15} />
                        </div>
                        <div>
                          <p className="font-bold text-[#10242A] text-xs">{p.title || "No Title"}</p>
                          <p className="text-[10px] text-[#4A5961] mt-0.5">{p.propertyType || "Property"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-bold text-[#10242A]">{p.ownerName || "Unknown Owner"}</p>
                      <p className="text-[10px] text-[#4A5961] font-mono mt-0.5">{p.ownerLoginId || "N/A"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-[#4A5961] flex items-center gap-1"><MapPin size={11} className="text-[#0E7C86]" /> {p.city || "N/A"}</p>
                    </td>
                    {!isEmployeeView && (
                      <td className="px-5 py-3">
                        {p.assignedToName || p.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-[#10242A] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                              <User size={11} className="text-[#0E7C86]" /> {p.assignedToName || p.assignedTo}
                            </span>
                            <button onClick={() => setAssignModal({ type: "property", id: p._id, city: p.city, title: p.title })} className="text-[10px] text-[#4A5961] hover:text-[#0E7C86] underline cursor-pointer" title="Reassign">Edit</button>
                          </div>
                        ) : (
                          <button onClick={() => setAssignModal({ type: "property", id: p._id, city: p.city, title: p.title })} className="text-[11px] font-semibold text-[#0E7C86] hover:underline flex items-center gap-1 cursor-pointer"><UserPlus size={11} /> Assign</button>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3 text-xs text-[#4A5961]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSelectedItem({ type: "new_property", data: p })} className="px-2.5 py-1 bg-[#F4F6F8] hover:bg-[#E6F4F5] text-[#10242A] border border-[#E1E6EA] rounded-[6px] text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer">
                          <Eye size={12} /> View
                        </button>
                        <button onClick={() => handleApproveNewProperty(p._id)} className="px-2.5 py-1 bg-[#0E7C86] hover:bg-[#09626A] text-white rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer">
                          Approve
                        </button>
                        <button onClick={() => handleRejectNewProperty(p._id)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {/* Tab 2: Property Edits */}
              {activeTab === "property_edits" && (
                filteredPropertyEdits.length === 0 ? (
                  <tr><td colSpan={isEmployeeView ? 5 : 6} className="px-6 py-12 text-center text-xs font-semibold text-[#4A5961]">No property edit requests pending</td></tr>
                ) : filteredPropertyEdits.map(p => (
                  <tr key={p._id} className="hover:bg-[#F4F6F8]/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
                          <FileText size={15} />
                        </div>
                        <div>
                          <p className="font-bold text-[#10242A] text-xs">{p.title || "No Title"}</p>
                          <p className="text-[10px] text-[#4A5961] mt-0.5">Edit Request</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-bold text-[#10242A]">{p.ownerName || "Unknown Owner"}</p>
                      <p className="text-[10px] text-[#4A5961] font-mono mt-0.5">{p.ownerLoginId || "N/A"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-[#4A5961] flex items-center gap-1"><MapPin size={11} className="text-[#0E7C86]" /> {p.city || "N/A"}</p>
                    </td>
                    {!isEmployeeView && (
                      <td className="px-5 py-3">
                        {p.pendingChanges?.assignedToName || p.pendingChanges?.assignedTo || p.assignedToName || p.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-[#10242A] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                              <User size={11} className="text-[#0E7C86]" /> {p.pendingChanges?.assignedToName || p.pendingChanges?.assignedTo || p.assignedToName || p.assignedTo}
                            </span>
                            <button onClick={() => setAssignModal({ type: "property", id: p._id, city: p.city, title: p.title })} className="text-[10px] text-[#4A5961] hover:text-[#0E7C86] underline cursor-pointer" title="Reassign">Edit</button>
                          </div>
                        ) : (
                          <button onClick={() => setAssignModal({ type: "property", id: p._id, city: p.city, title: p.title })} className="text-[11px] font-semibold text-[#0E7C86] hover:underline flex items-center gap-1 cursor-pointer"><UserPlus size={11} /> Assign</button>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3 text-xs text-[#4A5961]">
                      {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSelectedItem({ type: "property_edit", data: p })} className="px-2.5 py-1 bg-[#F4F6F8] hover:bg-[#E6F4F5] text-[#10242A] border border-[#E1E6EA] rounded-[6px] text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer">
                          <Eye size={12} /> Review
                        </button>
                        <button onClick={() => handleApprovePropertyEdit(p._id)} className="px-2.5 py-1 bg-[#0E7C86] hover:bg-[#09626A] text-white rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer">
                          Approve
                        </button>
                        <button onClick={() => handleRejectPropertyEdit(p._id)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {/* Tab 3: Room Edits */}
              {activeTab === "room_edits" && (
                filteredRoomEdits.length === 0 ? (
                  <tr><td colSpan={isEmployeeView ? 5 : 6} className="px-6 py-12 text-center text-xs font-semibold text-[#4A5961]">No room edit requests pending</td></tr>
                ) : filteredRoomEdits.map(r => (
                  <tr key={r._id} className="hover:bg-[#F4F6F8]/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-[#E6F4F5] text-[#0E7C86] flex items-center justify-center shrink-0">
                          <ImageIcon size={15} />
                        </div>
                        <div>
                          <p className="font-bold text-[#10242A] text-xs">{r.title || "Room"}</p>
                          <p className="text-[10px] text-[#4A5961] mt-0.5">{r.property?.title || "Property"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-bold text-[#10242A]">{r.property?.ownerName || "Unknown Owner"}</p>
                      <p className="text-[10px] text-[#4A5961] font-mono mt-0.5">{r.property?.ownerLoginId || "N/A"}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-[#4A5961] flex items-center gap-1"><MapPin size={11} className="text-[#0E7C86]" /> {r.property?.city || "N/A"}</p>
                    </td>
                    {!isEmployeeView && (
                      <td className="px-5 py-3">
                        {r.pendingChanges?.assignedToName || r.pendingChanges?.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-[#10242A] bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px] inline-flex items-center gap-1">
                              <User size={11} className="text-[#0E7C86]" /> {r.pendingChanges?.assignedToName || r.pendingChanges?.assignedTo}
                            </span>
                            <button onClick={() => setAssignModal({ type: "room", id: r._id, city: r.property?.city, title: r.title })} className="text-[10px] text-[#4A5961] hover:text-[#0E7C86] underline cursor-pointer" title="Reassign">Edit</button>
                          </div>
                        ) : (
                          <button onClick={() => setAssignModal({ type: "room", id: r._id, city: r.property?.city, title: r.title })} className="text-[11px] font-semibold text-[#0E7C86] hover:underline flex items-center gap-1 cursor-pointer"><UserPlus size={11} /> Assign</button>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3 text-xs text-[#4A5961]">
                      {new Date(r.updatedAt || r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSelectedItem({ type: "room_edit", data: r })} className="px-2.5 py-1 bg-[#F4F6F8] hover:bg-[#E6F4F5] text-[#10242A] border border-[#E1E6EA] rounded-[6px] text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer">
                          <Eye size={12} /> Review
                        </button>
                        <button onClick={() => handleApproveRoomEdit(r._id)} className="px-2.5 py-1 bg-[#0E7C86] hover:bg-[#09626A] text-white rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer">
                          Approve
                        </button>
                        <button onClick={() => handleRejectRoomEdit(r._id)} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer">
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

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-[16px] shadow-2xl p-5 w-full max-w-sm border border-[#E1E6EA] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-[#10242A]">Assign Verification Staff</h4>
                {assignModal.title && (
                  <p className="text-[11px] text-[#4A5961] truncate max-w-[220px]">
                    {assignModal.title} {assignModal.city ? `(${assignModal.city})` : ''}
                  </p>
                )}
              </div>
              <button
                onClick={() => setAssignModal(null)}
                className="text-xs text-[#4A5961] hover:text-[#10242A] p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Auto Assign Action */}
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
                // Filter out non-verification / service staff roles
                const NON_FIELD_ROLES = ['cook', 'cleaner', 'hostel staff', 'sweeper', 'housekeeping', 'driver', 'security', 'maintenance', 'peon', 'maid', 'warden'];
                const eligible = employees.filter(emp => {
                  const r = (emp.role || '').toLowerCase();
                  return !NON_FIELD_ROLES.some(nfr => r.includes(nfr));
                });

                // Sort local city employees to top
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
    </div>
  );
}
