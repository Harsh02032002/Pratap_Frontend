import React, { useState, useEffect, useMemo } from "react";
import { fetchJson } from "../../utils/api";
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
  const [activeTab, setActiveTab] = useState("new_properties"); // "new_properties" | "property_edits" | "room_edits"
  const [newProperties, setNewProperties] = useState([]);
  const [propertyEdits, setPropertyEdits] = useState([]);
  const [roomEdits, setRoomEdits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); // { type, data }
  const [assignModal, setAssignModal] = useState(null); // { type, id }
  const [searchQuery, setSearchQuery] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState(null); // { url, index }

  const loadData = async () => {
    // Check for authentication token
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found");
      window.location.href = "/superadmin/login";
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch new property requests (status: pending_approval)
      const newPropsRes = await fetchJson("/api/properties?pendingApproval=true&limit=1000");
      if (newPropsRes.success) {
        setNewProperties(newPropsRes.properties || []);
      }

      // 2. Fetch property edit requests (pendingChanges.status: pending)
      const propEditsRes = await fetchJson("/api/properties?pendingChanges=true&limit=1000");
      if (propEditsRes.success) {
        setPropertyEdits(propEditsRes.properties || []);
      }

      // 3. Fetch room edit requests (pendingChanges.status: pending)
      const roomEditsRes = await fetchJson("/api/rooms/all?pendingChanges=true&limit=1000");
      if (roomEditsRes.success) {
        setRoomEdits(roomEditsRes.rooms || []);
      }

      // 4. Fetch employees
      const empRes = await fetchJson("/api/employees");
      if (empRes.success) {
        setEmployees(empRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load verification center data:", err);
      // If auth error, redirect to login
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

  // Quick Action Handlers
  const handleApproveNewProperty = async (id) => {
    try {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/publish`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/api/properties/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/approve-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/api/properties/${id}/reject-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/api/rooms/${id}/approve-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/api/rooms/${id}/reject-changes`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, employeeName })
      });
      const data = await res.json();

      if (data.success || res.ok) {
        toast.success(`Successfully assigned to ${employeeName}`);
        
        // Refresh local lists
        if (activeTab === "new_properties") {
          setNewProperties(prev => prev.map(p => p._id === itemId ? { ...p, assignedTo: employeeId, assignedToName: employeeName } : p));
        } else if (activeTab === "property_edits") {
          setPropertyEdits(prev => prev.map(p => p._id === itemId ? {
            ...p,
            pendingChanges: { ...p.pendingChanges, assignedTo: employeeId, assignedToName: employeeName }
          } : p));
        } else {
          setRoomEdits(prev => prev.map(r => r._id === itemId ? {
            ...r,
            pendingChanges: { ...r.pendingChanges, assignedTo: employeeId, assignedToName: employeeName }
          } : p));
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

  // Searching logic
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 min-h-full">
      <PageHeader
        title="Verification & Approvals Center"
        subtitle="Manage pending property approvals, and track room/property picture modification requests."
        breadcrumbs={[{ label: "Support" }, { label: "Verification System", active: true }]}
        actions={
          <button onClick={loadData} className="p-2.5 rounded-xl bg-white text-slate-500 hover:text-blue-600 transition-all border border-slate-200 shadow-sm flex items-center gap-2 font-bold text-xs">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
          </button>
        }
      />

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { key: "new_properties", label: "New Property Approvals", count: newProperties.length, color: "blue", icon: Building2 },
          { key: "property_edits", label: "Property Edit Requests", count: propertyEdits.length, color: "indigo", icon: FileText },
          { key: "room_edits", label: "Room Edit Requests", count: roomEdits.length, color: "purple", icon: ImageIcon }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "p-6 rounded-3xl border text-left transition-all duration-300 relative overflow-hidden group shadow-sm flex items-center justify-between",
              activeTab === tab.key
                ? "bg-white border-blue-500 ring-2 ring-blue-500/10"
                : "bg-white border-slate-100 hover:border-slate-300"
            )}
          >
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{tab.label}</span>
              <p className="text-3xl font-black text-slate-900 leading-none">{tab.count}</p>
            </div>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
              activeTab === tab.key ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-100"
            )}>
              <tab.icon className="w-5 h-5" />
            </div>
          </button>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, owner details, location..."
            className="w-full bg-slate-50 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none border-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-700"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 ml-auto">
          {activeTab === "new_properties" && `${filteredNewProperties.length} pending properties`}
          {activeTab === "property_edits" && `${filteredPropertyEdits.length} property edits`}
          {activeTab === "room_edits" && `${filteredRoomEdits.length} room edits`}
        </span>
      </div>

      {/* List Ledger */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left">Property / Room Details</th>
                <th className="px-5 py-4 text-left">Owner Details</th>
                <th className="px-5 py-4 text-left">Location</th>
                <th className="px-5 py-4 text-left">Assigned Employee</th>
                <th className="px-5 py-4 text-left">Date Requested</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {/* Tab 1: New Properties */}
              {activeTab === "new_properties" && (
                filteredNewProperties.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-20 text-center text-xs font-bold text-slate-400 uppercase">No property approvals pending</td></tr>
                ) : filteredNewProperties.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{p.title || "No Title"}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{p.propertyType || "Property"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-700">{p.ownerName || "Unknown Owner"}</p>
                      <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">{p.ownerLoginId || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-600 flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {p.city || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4">
                      {p.assignedToName ? (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"><User size={11} /> {p.assignedToName}</span>
                      ) : (
                        <button onClick={() => setAssignModal({ type: "property", id: p._id })} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"><UserPlus size={11} /> Assign Verification</button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-semibold">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedItem({ type: "new_property", data: p })} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1">
                          <Eye size={12} /> View
                        </button>
                        <button onClick={() => handleApproveNewProperty(p._id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all">
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {/* Tab 2: Property Edits */}
              {activeTab === "property_edits" && (
                filteredPropertyEdits.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-20 text-center text-xs font-bold text-slate-400 uppercase">No property edit requests pending</td></tr>
                ) : filteredPropertyEdits.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{p.title || "No Title"}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Edit Request</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-700">{p.ownerName || "Unknown Owner"}</p>
                      <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">{p.ownerLoginId || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-600 flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {p.city || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4">
                      {p.pendingChanges?.assignedToName ? (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"><User size={11} /> {p.pendingChanges.assignedToName}</span>
                      ) : (
                        <button onClick={() => setAssignModal({ type: "property", id: p._id })} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"><UserPlus size={11} /> Assign Verification</button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-semibold">
                      {p.pendingChanges?.requestedAt ? new Date(p.pendingChanges.requestedAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedItem({ type: "property_edit", data: p })} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1">
                          <Eye size={12} /> Compare
                        </button>
                        <button onClick={() => handleApprovePropertyEdit(p._id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all">
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {/* Tab 3: Room Edits */}
              {activeTab === "room_edits" && (
                filteredRoomEdits.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-20 text-center text-xs font-bold text-slate-400 uppercase">No room edit requests pending</td></tr>
                ) : filteredRoomEdits.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                          <ImageIcon size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">Room: {r.title || "No Title"}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{r.property?.title || "Property"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-700">Owner ID</p>
                      <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">{r.property?.ownerLoginId || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-600 flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {r.property?.city || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4">
                      {r.pendingChanges?.assignedToName ? (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"><User size={11} /> {r.pendingChanges.assignedToName}</span>
                      ) : (
                        <button onClick={() => setAssignModal({ type: "room", id: r._id })} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"><UserPlus size={11} /> Assign Verification</button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-semibold">
                      {r.pendingChanges?.requestedAt ? new Date(r.pendingChanges.requestedAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedItem({ type: "room_edit", data: r })} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1">
                          <Eye size={12} /> Compare
                        </button>
                        <button onClick={() => handleApproveRoomEdit(r._id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all">
                          Approve
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

      {/* Gorgeous Side-by-Side Comparison & View Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedItem.type === "new_property" && `Property Verification: ${selectedItem.data.title}`}
                  {selectedItem.type === "property_edit" && `Modify Request: ${selectedItem.data.title}`}
                  {selectedItem.type === "room_edit" && `Room Verification: ${selectedItem.data.title}`}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Requested by: {selectedItem.type === "new_property" ? selectedItem.data.ownerLoginId : selectedItem.data.pendingChanges?.requestedBy}
                </p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"><X size={18} /></button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Type 1: New Property Details */}
              {selectedItem.type === "new_property" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Images & Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Property Media</h4>
                     <div className="grid grid-cols-2 gap-2">
                       {selectedItem.data.images?.length > 0 ? (
                         selectedItem.data.images.map((img, i) => <img key={i} src={img} alt="" className="w-full h-32 object-cover rounded-xl border border-slate-100" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />)
                       ) : (
                         <div className="col-span-2 py-8 bg-slate-50 rounded-xl text-center text-xs font-bold text-slate-400 uppercase">No images uploaded</div>
                       )}
                     </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Details & Credentials</h4>
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3.5">
                      {[
                        { label: "Property Name", val: selectedItem.data.title },
                        { label: "City", val: selectedItem.data.city },
                        { label: "Locality", val: selectedItem.data.locality },
                        { label: "Full Address", val: selectedItem.data.address },
                        { label: "Monthly Rent", val: `₹${selectedItem.data.monthlyRent || 0}` },
                        { label: "Furnishing status", val: selectedItem.data.propertyDetails?.propertyAge || "Standard" }
                      ].map(f => (
                        <div key={f.label} className="flex justify-between text-xs items-start">
                          <span className="text-slate-400 font-bold shrink-0">{f.label}:</span>
                          <span className="text-slate-800 font-bold text-right ml-4">{f.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Type 2: Property Changes (Side-by-Side comparison) */}
              {selectedItem.type === "property_edit" && (
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><Info size={14} className="text-indigo-500" /> Requested Modifications (Old vs New)</h4>
                  
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 font-bold text-slate-400 uppercase tracking-wider text-[9px] border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left">Field</th>
                          <th className="px-4 py-3 text-left">Current Live Value</th>
                          <th className="px-4 py-3 text-left bg-blue-50/30 text-blue-600">Requested Edit Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.keys(selectedItem.data.pendingChanges?.data || {}).map(field => {
                          const liveVal = selectedItem.data[field];
                          const requestedVal = selectedItem.data.pendingChanges.data[field];
                          
                          if (field === 'images') {
                            return (
                              <tr key={field}>
                                <td className="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Gallery Images</td>
                                <td className="px-4 py-4">
                                   <div className="flex gap-1.5 overflow-x-auto max-w-[260px] pb-1">
                                     {(liveVal || []).map((img, i) => <img key={i} src={img} className="w-12 h-10 object-cover rounded-lg" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />)}
                                   </div>
                                </td>
                                <td className="px-4 py-4 bg-blue-50/10">
                                <div className="flex gap-1.5 overflow-x-auto max-w-[260px] pb-1">
                                  {(requestedVal || []).map((img, i) => <img key={i} src={img} className="w-12 h-10 object-cover rounded-lg border border-blue-200" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />)}
                                </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={field}>
                              <td className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[9px]">{field}</td>
                              <td className="px-4 py-3 font-semibold text-slate-500">{typeof liveVal === 'object' ? JSON.stringify(liveVal) : String(liveVal || '—')}</td>
                              <td className="px-4 py-3 font-black text-blue-600 bg-blue-50/10">{typeof requestedVal === 'object' ? JSON.stringify(requestedVal) : String(requestedVal || '—')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Type 3: Room Changes (Side-by-Side comparison) */}
              {selectedItem.type === "room_edit" && (
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><Info size={14} className="text-purple-500" /> Requested Room Modifications (Old vs New)</h4>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 font-bold text-slate-400 uppercase tracking-wider text-[9px] border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left">Field</th>
                          <th className="px-4 py-3 text-left">Current Live Value</th>
                          <th className="px-4 py-3 text-left bg-blue-50/30 text-blue-600">Requested Edit Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.keys(selectedItem.data.pendingChanges?.data || {}).map(field => {
                          const liveVal = selectedItem.data[field];
                          const requestedVal = selectedItem.data.pendingChanges.data[field];

                          if (field === 'media' || field === 'images') {
                            return (
                              <tr key={field}>
                                <td className="px-4 py-4 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Room Media</td>
                                <td className="px-4 py-4">
                                  <div className="flex gap-1.5 overflow-x-auto max-w-[260px] pb-1">
                                    {(liveVal || []).map((img, i) => (
                                      <img 
                                        key={i} 
                                        src={typeof img === 'object' ? img.url : img} 
                                        className="w-12 h-10 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform"
                                        onClick={() => setFullscreenImage({ url: typeof img === 'object' ? img.url : img, index: i })}
                                      />
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-4 bg-blue-50/10">
                                  <div className="flex gap-1.5 overflow-x-auto max-w-[260px] pb-1">
                                    {(requestedVal || []).map((img, i) => (
                                      <img 
                                        key={i} 
                                        src={typeof img === 'object' ? img.url : img} 
                                        className="w-12 h-10 object-cover rounded-lg border border-blue-200 cursor-pointer hover:scale-110 transition-transform"
                                        onClick={() => setFullscreenImage({ url: typeof img === 'object' ? img.url : img, index: i })}
                                      />
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={field}>
                              <td className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-[9px]">{field}</td>
                              <td className="px-4 py-3 font-semibold text-slate-500">{typeof liveVal === 'object' ? JSON.stringify(liveVal) : String(liveVal || '—')}</td>
                              <td className="px-4 py-3 font-black text-blue-600 bg-blue-50/10">{typeof requestedVal === 'object' ? JSON.stringify(requestedVal) : String(requestedVal || '—')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 justify-end shrink-0">
              <button onClick={() => setSelectedItem(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Cancel</button>
              
              {selectedItem.type === "new_property" && (
                <>
                  <button onClick={() => setAssignModal({ type: "property", id: selectedItem.data._id })} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5"><UserPlus size={14} /> Assign Verification</button>
                  <button onClick={() => handleRejectNewProperty(selectedItem.data._id)} className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all">Reject</button>
                  <button onClick={() => handleApproveNewProperty(selectedItem.data._id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5"><Check size={14} /> Approve</button>
                </>
              )}

              {selectedItem.type === "property_edit" && (
                <>
                  <button onClick={() => setAssignModal({ type: "property", id: selectedItem.data._id })} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5"><UserPlus size={14} /> Assign Verification</button>
                  <button onClick={() => handleRejectPropertyEdit(selectedItem.data._id)} className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all">Reject Changes</button>
                  <button onClick={() => handleApprovePropertyEdit(selectedItem.data._id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5"><Check size={14} /> Approve Changes</button>
                </>
              )}

              {selectedItem.type === "room_edit" && (
                <>
                  <button onClick={() => setAssignModal({ type: "room", id: selectedItem.data._id })} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5"><UserPlus size={14} /> Assign Verification</button>
                  <button onClick={() => handleRejectRoomEdit(selectedItem.data._id)} className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all">Reject Changes</button>
                  <button onClick={() => handleApproveRoomEdit(selectedItem.data._id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5"><Check size={14} /> Approve Changes</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setFullscreenImage(null)}>
          <button 
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X size={24} />
          </button>
          <img 
            src={fullscreenImage.url} 
            alt="Fullscreen view" 
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Assign Employee Popup Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-sm font-black text-slate-800">Assign Verification Task</h4>
              <button onClick={() => setAssignModal(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"><X size={16} /></button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {employees.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-6">No active employees found.</p>
              ) : (
                employees.map(emp => (
                  <button
                    key={emp._id}
                    onClick={() => handleAssignVerification(assignModal.id, emp._id, emp.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">
                      {emp.name?.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.loginId} • {emp.role}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
