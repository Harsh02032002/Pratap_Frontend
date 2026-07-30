import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { fetchJson } from "../../utils/api";
import { toast } from "react-hot-toast";
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, UserX, MessageSquare, 
  Eye, RefreshCw, MoreVertical, Ban, Trash2, Mail, ShieldCheck, 
  HelpCircle, UserCheck, Play, ArrowRight, Info, Clock, Lock, 
  PhoneCall, DollarSign, CreditCard, ExternalLink
} from "lucide-react";

export default function ChatAlerts() {
  const [violations, setViolations] = useState([]);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [analytics, setAnalytics] = useState({
    contactSharingAttempts: 0,
    commissionBypassAttempts: 0,
    externalSettlementAttempts: 0,
    repeatedViolators: 0,
    blockedOwnersCount: 0
  });
  const [blockedOwnersList, setBlockedOwnersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("logs"); // "logs" | "flagged" | "blocked"
  const [actionReason, setActionReason] = useState("");
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(""); // "send_warning" | "restrict_chat" | "suspend_user" | "mark_reviewed" | "mark_resolved"
  const [filterType, setFilterType] = useState(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return params.get("filterType") || null;
  });

  const handleFilterChange = (type) => {
    const newType = filterType === type ? null : type;
    setFilterType(newType);
    if (newType === "blocked_owners") {
      setActiveTab("blocked");
    }
    const url = new URL(window.location.href);
    if (newType) {
      url.searchParams.set("filterType", newType);
    } else {
      url.searchParams.delete("filterType");
    }
    window.history.replaceState({}, "", url.toString());
  };

  const handleUnblockOwner = async (loginId) => {
    if (!window.confirm(`Are you sure you want to unblock owner ${loginId}?`)) return;
    try {
      const res = await fetchJson(`/api/chat/admin/blocked-owners/${loginId}/unblock`, { method: "POST" });
      if (res.success) {
        toast.success(`Owner ${loginId} unblocked successfully!`);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || "Failed to unblock owner");
    }
  };

  const getFilteredViolations = () => {
    if (!filterType) return violations;
    if (filterType === "repeated_violators") {
      const counts = {};
      violations.forEach(v => {
        const id = v.participantLoginId;
        counts[id] = (counts[id] || 0) + 1;
      });
      return violations.filter(v => counts[v.participantLoginId] > 1);
    }
    if (filterType === "blocked_owners") {
      const counts = {};
      violations.forEach(v => {
        const id = v.ownerId || v.participantLoginId;
        counts[id] = (counts[id] || 0) + 1;
      });
      return violations.filter(v => (counts[v.ownerId || v.participantLoginId] >= 2) || (v.actionHistory && v.actionHistory.some(a => String(a.action).toLowerCase().includes('suspend'))));
    }
    return violations.filter(v => v.violationType === filterType);
  };

  const getFilteredFlagged = () => {
    if (!filterType) return flaggedMessages;
    if (filterType === "repeated_violators") {
      const counts = {};
      flaggedMessages.forEach(m => {
        const id = m.sender_login_id;
        counts[id] = (counts[id] || 0) + 1;
      });
      return flaggedMessages.filter(m => counts[m.sender_login_id] > 1);
    }
    if (filterType === "blocked_owners") {
      return flaggedMessages.filter(m => m.violation_type === "commission_bypass");
    }
    return flaggedMessages.filter(m => m.violation_type === filterType);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [violationsRes, flaggedRes, analyticsRes, blockedRes] = await Promise.all([
        fetchJson("/api/chat/admin/violations"),
        fetchJson("/api/chat/admin/moderation"),
        fetchJson("/api/chat/admin/analytics"),
        fetchJson("/api/chat/admin/blocked-owners").catch(() => ({ success: false }))
      ]);

      if (violationsRes.success) setViolations(violationsRes.violations || []);
      if (flaggedRes.success) setFlaggedMessages(flaggedRes.messages || []);
      if (blockedRes.success) setBlockedOwnersList(blockedRes.blockedOwners || []);
      if (analyticsRes.success && analyticsRes.cards) {
        setAnalytics({
          contactSharingAttempts: analyticsRes.cards.contactSharingAttempts || 0,
          commissionBypassAttempts: analyticsRes.cards.commissionBypassAttempts || 0,
          externalSettlementAttempts: analyticsRes.cards.externalSettlementAttempts || 0,
          repeatedViolators: analyticsRes.cards.repeatedViolators || 0,
          blockedOwnersCount: blockedRes.success ? (blockedRes.blockedOwners || []).length : (analyticsRes.cards.blockedOwnersCount || 0)
        });
      }
    } catch (err) {
      console.error("Failed to load moderation data:", err);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (violation, action) => {
    setSelectedViolation(violation);
    setSelectedAction(action);
    setActionReason("");
    setShowActionModal(true);
  };

  const handleAdminAction = async () => {
    if (!selectedViolation || !selectedAction) return;

    try {
      const res = await fetchJson(`/api/chat/admin/violations/${selectedViolation._id}/action`, {
        method: "POST",
        body: JSON.stringify({
          action: selectedAction,
          reason: actionReason
        })
      });
      if (res.success) {
        toast.success(`Action ${selectedAction.replace('_', ' ')} completed successfully!`);
        setShowActionModal(false);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || "Failed to perform admin action");
    }
  };

  const handleDecryptMessage = async (msgId, index) => {
    try {
      const res = await fetchJson(`/api/chat/admin/moderation/${msgId}/decrypt`);
      if (res.success && res.original) {
        const updated = [...flaggedMessages];
        updated[index].message = res.original;
        updated[index].isDecrypted = true;
        setFlaggedMessages(updated);
      }
    } catch (err) {
      toast.error("Failed to decrypt message.");
    }
  };

  const handleResolveFlagged = async (msgId, action) => {
    try {
      const res = await fetchJson(`/api/chat/admin/moderation/${msgId}/resolve`, {
        method: "PUT",
        body: JSON.stringify({ action })
      });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      toast.error("Failed to resolve message.");
    }
  };

  const formatViolationType = (type) => {
    if (!type) return "Other";
    switch (type) {
      case "commission_bypass":
        return "Commission Bypass Communication";
      case "contact_sharing":
        return "Contact Sharing Attempt";
      case "external_settlement":
        return "External Settlement Communication";
      default:
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Moderation & Alerts"
          subtitle="Review chat violations, spam attempts, and offline settlement warnings."
          breadcrumbs={[
            { label: "Chat Management" },
            { label: "Alerts & Moderation", active: true }
          ]}
        />
        <button 
          onClick={loadData} 
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-xs font-black shadow-sm shrink-0 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 duration-200 w-fit self-end sm:self-auto"
        >
          <RefreshCw size={14} className={`text-slate-500 ${loading ? "animate-spin text-blue-600" : ""}`} /> 
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Analytics Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Contact Sharing */}
        <div 
          onClick={() => handleFilterChange("contact_sharing")}
          className={`relative overflow-hidden bg-white p-6 rounded-3xl border shadow-md cursor-pointer hover:scale-[1.02] transition-all duration-300 group ${
            filterType === "contact_sharing" 
              ? "border-blue-500 ring-2 ring-blue-500/20 shadow-blue-100/50" 
              : "border-slate-100/80 shadow-slate-100/30 hover:shadow-xl hover:shadow-slate-200/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">Contact Sharing Attempts</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
              filterType === "contact_sharing"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-blue-50 text-blue-600 border-blue-100/50 group-hover:bg-blue-600 group-hover:text-white"
            }`}>
              <PhoneCall size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-4 tracking-tight group-hover:translate-x-1 transition-transform duration-300">{analytics.contactSharingAttempts}</p>
          <div className={`h-1 rounded-full mt-4 transition-all duration-300 ${
            filterType === "contact_sharing" ? "w-full bg-blue-600" : "w-12 bg-blue-500 group-hover:w-full"
          }`}></div>
        </div>

        {/* Commission Bypass */}
        <div 
          onClick={() => handleFilterChange("commission_bypass")}
          className={`relative overflow-hidden bg-white p-6 rounded-3xl border shadow-md cursor-pointer hover:scale-[1.02] transition-all duration-300 group ${
            filterType === "commission_bypass" 
              ? "border-purple-500 ring-2 ring-purple-500/20 shadow-purple-100/50" 
              : "border-slate-100/80 shadow-slate-100/30 hover:shadow-xl hover:shadow-slate-200/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">Commission Bypass Attempts</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
              filterType === "commission_bypass"
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-purple-50 text-purple-600 border-purple-100/50 group-hover:bg-purple-600 group-hover:text-white"
            }`}>
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-4 tracking-tight group-hover:translate-x-1 transition-transform duration-300">{analytics.commissionBypassAttempts}</p>
          <div className={`h-1 rounded-full mt-4 transition-all duration-300 ${
            filterType === "commission_bypass" ? "w-full bg-purple-600" : "w-12 bg-purple-500 group-hover:w-full"
          }`}></div>
        </div>

        {/* External Settlement */}
        <div 
          onClick={() => handleFilterChange("external_settlement")}
          className={`relative overflow-hidden bg-white p-6 rounded-3xl border shadow-md cursor-pointer hover:scale-[1.02] transition-all duration-300 group ${
            filterType === "external_settlement" 
              ? "border-amber-500 ring-2 ring-amber-500/20 shadow-amber-100/50" 
              : "border-slate-100/80 shadow-slate-100/30 hover:shadow-xl hover:shadow-slate-200/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">External Settlement Attempts</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
              filterType === "external_settlement"
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-amber-50 text-amber-600 border-amber-100/50 group-hover:bg-amber-600 group-hover:text-white"
            }`}>
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-4 tracking-tight group-hover:translate-x-1 transition-transform duration-300">{analytics.externalSettlementAttempts}</p>
          <div className={`h-1 rounded-full mt-4 transition-all duration-300 ${
            filterType === "external_settlement" ? "w-full bg-amber-600" : "w-12 bg-amber-500 group-hover:w-full"
          }`}></div>
        </div>

        {/* Repeated Violators */}
        <div 
          onClick={() => handleFilterChange("repeated_violators")}
          className={`relative overflow-hidden bg-white p-6 rounded-3xl border shadow-md cursor-pointer hover:scale-[1.02] transition-all duration-300 group ${
            filterType === "repeated_violators" 
              ? "border-rose-500 ring-2 ring-rose-500/20 shadow-rose-100/50" 
              : "border-slate-100/80 shadow-slate-100/30 hover:shadow-xl hover:shadow-slate-200/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">Repeated Violators</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
              filterType === "repeated_violators"
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-rose-50 text-rose-600 border-rose-100/50 group-hover:bg-rose-600 group-hover:text-white group-hover:animate-pulse"
            }`}>
              <UserX size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 mt-4 tracking-tight group-hover:translate-x-1 transition-transform duration-300">{analytics.repeatedViolators}</p>
          <div className={`h-1 rounded-full mt-4 transition-all duration-300 ${
            filterType === "repeated_violators" ? "w-full bg-rose-600" : "w-12 bg-rose-500 group-hover:w-full"
          }`}></div>
        </div>

        {/* Blocked Owners */}
        <div 
          onClick={() => handleFilterChange("blocked_owners")}
          className={`relative overflow-hidden bg-white p-6 rounded-3xl border shadow-md cursor-pointer hover:scale-[1.02] transition-all duration-300 group ${
            filterType === "blocked_owners" 
              ? "border-red-600 ring-2 ring-red-600/20 shadow-red-100/50" 
              : "border-slate-100/80 shadow-slate-100/30 hover:shadow-xl hover:shadow-slate-200/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 group-hover:text-slate-500 transition-colors">Blocked Owners</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
              filterType === "blocked_owners"
                ? "bg-red-600 text-white border-red-600"
                : "bg-red-50 text-red-600 border-red-100/50 group-hover:bg-red-600 group-hover:text-white group-hover:animate-bounce"
            }`}>
              <Lock size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-red-600 mt-4 tracking-tight group-hover:translate-x-1 transition-transform duration-300">{analytics.blockedOwnersCount}</p>
          <div className={`h-1 rounded-full mt-4 transition-all duration-300 ${
            filterType === "blocked_owners" ? "w-full bg-red-600" : "w-12 bg-red-500 group-hover:w-full"
          }`}></div>
        </div>
      </div>

      {filterType && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-250 p-4 rounded-[20px] animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              filterType === "contact_sharing" ? "bg-blue-50 text-blue-600" :
              filterType === "commission_bypass" ? "bg-purple-50 text-purple-600" :
              filterType === "external_settlement" ? "bg-amber-50 text-amber-600" :
              "bg-rose-50 text-rose-600 animate-pulse"
            }`}>
              <ShieldAlert size={14} />
            </div>
            <span className="text-xs font-bold text-slate-700">
              Filtering table results by: <span className="text-slate-900 font-black uppercase tracking-wider text-[11px]">{filterType.replace('_', ' ')}</span>
            </span>
          </div>
          <button 
            onClick={() => handleFilterChange(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 duration-200"
          >
            Clear Filter (Show All)
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === "logs" 
              ? "bg-white text-slate-900 shadow-md shadow-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldAlert size={14} className={activeTab === "logs" ? "text-blue-600 animate-pulse" : "text-slate-400"} />
          <span>Violation Logs</span>
          {getFilteredViolations().length > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
              activeTab === "logs" ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-600"
            }`}>
              {getFilteredViolations().length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab("flagged")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === "flagged" 
              ? "bg-white text-slate-900 shadow-md shadow-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare size={14} className={activeTab === "flagged" ? "text-purple-600" : "text-slate-400"} />
          <span>Flagged Conversations</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
            activeTab === "flagged" ? "bg-purple-50 text-purple-600" : "bg-slate-200 text-slate-600"
          }`}>
            {getFilteredFlagged().length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab("blocked")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            activeTab === "blocked" 
              ? "bg-white text-slate-900 shadow-md shadow-slate-200/50" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Lock size={14} className={activeTab === "blocked" ? "text-rose-600 animate-pulse" : "text-slate-400"} />
          <span>Blocked Owners</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
            activeTab === "blocked" ? "bg-rose-50 text-rose-600" : "bg-slate-200 text-slate-600"
          }`}>
            {blockedOwnersList.length}
          </span>
        </button>
      </div>

      <div className="transition-all duration-300">
        {activeTab === "logs" && (
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-separate border-spacing-y-3.5 text-left text-sm">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 pb-1">Offender</th>
                  <th className="px-6 pb-1">Participant Flow</th>
                  <th className="px-6 pb-1">Violation Details</th>
                  <th className="px-6 pb-1">Timestamp</th>
                  <th className="px-6 py-1">Status</th>
                  <th className="pl-6 pr-24 pb-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="bg-white border border-slate-200/60 rounded-3xl px-6 py-12 text-center text-slate-400 shadow-sm">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <span className="text-xs font-bold text-slate-400">Loading violations...</span>
                      </div>
                    </td>
                  </tr>
                ) : getFilteredViolations().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bg-white border border-slate-200/60 rounded-3xl px-6 py-16 text-center text-slate-400 shadow-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                          <ShieldAlert size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700">No violations logged yet</p>
                          <p className="text-xs text-slate-400 mt-0.5">Everything looks quiet on the security logs.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : getFilteredViolations().map(v => (
                  <tr key={v._id} className="group/row transition-all duration-300 hover:-translate-y-0.5">
                    {/* Offender */}
                    <td className="bg-white border-y border-l border-slate-200/50 rounded-l-3xl px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/80 flex items-center justify-center text-slate-700 font-black text-xs uppercase border border-slate-200/50 shrink-0 shadow-sm">
                          {(v.participantName || v.participantLoginId || "U").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-800 text-sm tracking-tight">{v.participantName || v.participantLoginId}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{v.participantLoginId}</div>
                        </div>
                      </div>
                    </td>
                    {/* Participant Flow */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <div className="max-w-xs">
                        <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
                          <div className="bg-blue-50/80 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100/50 shadow-sm shadow-blue-500/5">
                            Owner: {v.ownerName || "Owner"}
                          </div>
                          <ArrowRight size={12} className="text-slate-400 shrink-0" />
                          <div className="bg-purple-50/80 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100/50 shadow-sm shadow-purple-500/5">
                            Tenant: {v.tenantName || "Tenant"}
                          </div>
                        </div>
                        {v.conversationContext && (
                          <div className="text-[10px] text-slate-550 mt-2 bg-slate-50 border border-slate-100/80 p-2 rounded-xl flex items-start gap-1.5 shadow-sm shadow-slate-100/20 leading-relaxed">
                            <Info size={12} className="text-blue-550 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-755">Context:</span> {v.conversationContext}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Violation Details */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <div className="max-w-xs">
                        <div className="mb-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                            v.violationType === "commission_bypass" 
                              ? "bg-rose-50 text-rose-700 border-rose-100" 
                              : v.violationType === "contact_sharing" 
                              ? "bg-blue-50 text-blue-700 border-blue-100" 
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            <AlertTriangle size={9} />
                            {formatViolationType(v.violationType)}
                          </span>
                        </div>
                        <div className="relative bg-slate-50 hover:bg-slate-100/80 p-3 rounded-2xl rounded-tl-none border border-slate-200/60 text-xs text-slate-700 transition-colors group/msg shadow-sm shadow-slate-100/10">
                          <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-slate-50 border-l border-t border-slate-200/60 -ml-1.25 -mt-px rotate-45 group-hover/msg:bg-slate-100/80 transition-colors"></div>
                          <p className="italic leading-relaxed line-clamp-2" title={v.messageSnippet}>
                            "{v.messageSnippet}"
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Timestamp */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Clock size={12} className="text-slate-400" />
                        <span>{new Date(v.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium ml-4.5 mt-0.5">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                        v.status === 'Resolved' ? 'bg-emerald-50/80 text-emerald-700 border-emerald-100' :
                        v.status === 'Warning Sent' ? 'bg-amber-50/80 text-amber-700 border-amber-100' :
                        v.status === 'Reviewed' ? 'bg-sky-50/80 text-sky-700 border-sky-100' :
                        'bg-rose-50/80 text-rose-700 border-rose-100 animate-pulse'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          v.status === 'Resolved' ? 'bg-emerald-500' :
                          v.status === 'Warning Sent' ? 'bg-amber-500' :
                          v.status === 'Reviewed' ? 'bg-sky-500' :
                          'bg-rose-500'
                        }`} />
                        {v.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="bg-white border-y border-r border-slate-200/50 rounded-r-3xl px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <div className="flex items-center justify-end gap-2 w-full">
                        <a 
                          href={`/superadmin/superchat?roomId=${v.ownerId}&user1=${v.ownerId}&user2=${v.tenantId}${v.messageId ? `&highlightId=${v.messageId}` : ''}&fromAlerts=${filterType || 'all'}`}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200 shrink-0"
                        >
                          <Eye size={12} className="shrink-0" />
                          <span>View Chat</span>
                        </a>
                        <div className="relative group">
                          <button className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 text-slate-400 hover:text-slate-700 border border-transparent hover:border-slate-200/50">
                            <MoreVertical size={16} />
                          </button>
                          <div className="absolute right-0 bottom-full z-50 mb-2 hidden group-hover:block bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 min-w-[170px] text-left animate-in fade-in duration-100">
                            <button onClick={() => openActionModal(v, "mark_reviewed")} className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-slate-50 rounded-xl text-slate-700 flex items-center gap-2 transition-colors">
                              <ShieldCheck size={14} className="text-sky-500" />
                              <span>Mark Reviewed</span>
                            </button>
                            <button onClick={() => openActionModal(v, "send_warning")} className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-slate-50 rounded-xl text-amber-600 flex items-center gap-2 transition-colors">
                              <AlertTriangle size={14} className="text-amber-500" />
                              <span>Send Warning</span>
                            </button>
                            <button onClick={() => openActionModal(v, "restrict_chat")} className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-slate-50 rounded-xl text-rose-600 flex items-center gap-2 transition-colors">
                              <Lock size={14} className="text-rose-500" />
                              <span>Restrict Chat (24h)</span>
                            </button>
                            <button onClick={() => openActionModal(v, "suspend_user")} className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-slate-50 rounded-xl text-red-700 flex items-center gap-2 transition-colors">
                              <UserX size={14} className="text-red-650" />
                              <span>Suspend User</span>
                            </button>
                            <button onClick={() => openActionModal(v, "mark_resolved")} className="w-full text-left px-3 py-2.5 text-xs font-bold hover:bg-slate-50 rounded-xl text-emerald-600 flex items-center gap-2 transition-colors">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              <span>Mark Resolved</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "flagged" && (
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-separate border-spacing-y-3.5 text-left text-sm">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 pb-1">Sender</th>
                  <th className="px-6 pb-1">Room ID</th>
                  <th className="px-6 pb-1">Violation Details</th>
                  <th className="px-6 pb-1">Timestamp</th>
                  <th className="px-6 py-1">Moderation Status</th>
                  <th className="pl-6 pr-24 pb-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="bg-white border border-slate-200/60 rounded-3xl px-6 py-12 text-center text-slate-400 shadow-sm">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <span className="text-xs font-bold text-slate-400">Loading flagged messages...</span>
                      </div>
                    </td>
                  </tr>
                ) : getFilteredFlagged().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bg-white border border-slate-200/60 rounded-3xl px-6 py-16 text-center text-slate-400 shadow-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                          <MessageSquare size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700">No flagged messages found</p>
                          <p className="text-xs text-slate-400 mt-0.5">Everything looks clear on flagged scans.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : getFilteredFlagged().map((m, idx) => (
                  <tr key={m._id} className="group/row transition-all duration-300 hover:-translate-y-0.5">
                    {/* Sender */}
                    <td className="bg-white border-y border-l border-slate-200/50 rounded-l-3xl px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/80 flex items-center justify-center text-slate-700 font-black text-xs uppercase border border-slate-200/50 shrink-0 shadow-sm">
                          {(m.sender_name || m.sender_login_id || "U").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-800 text-sm tracking-tight">{m.sender_name || m.sender_login_id}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[8px] bg-slate-100 text-slate-600 font-black uppercase tracking-wider border border-slate-200/40">
                            {m.sender_role}
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Room ID */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <div className="font-extrabold text-slate-700 text-xs font-mono bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg w-fit">
                        {m.room_id}
                      </div>
                    </td>
                    {/* Violation Details */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <div className="max-w-xs">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase tracking-wider shadow-sm">
                            <AlertTriangle size={9} />
                            {formatViolationType(m.violation_type)}
                          </span>
                          {m.is_blocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border-rose-100 text-[9px] font-black uppercase tracking-wider shadow-sm">
                              <Lock size={9} />
                              Blocked
                            </span>
                          )}
                        </div>
                        <div className="relative bg-slate-50 hover:bg-slate-100/80 p-3 rounded-2xl rounded-tl-none border border-slate-200/60 text-xs text-slate-700 transition-colors group/msg shadow-sm shadow-slate-100/10">
                          <div className="absolute top-0 left-0 w-2.5 h-2.5 bg-slate-50 border-l border-t border-slate-200/60 -ml-1.25 -mt-px rotate-45 group-hover/msg:bg-slate-100/80 transition-colors"></div>
                          <p className="italic leading-relaxed break-words">
                            "{m.message}"
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Timestamp */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Clock size={12} className="text-slate-400" />
                        <span>{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium ml-4.5 mt-0.5">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    {/* Moderation Status */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                        m.moderation_status === 'action_taken' ? 'bg-emerald-50/80 text-emerald-700 border-emerald-100' :
                        m.moderation_status === 'false_positive' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                        'bg-amber-50/80 text-amber-700 border-amber-100 animate-pulse'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          m.moderation_status === 'action_taken' ? 'bg-emerald-500' :
                          m.moderation_status === 'false_positive' ? 'bg-slate-400' :
                          'bg-amber-500'
                        }`} />
                        {m.moderation_status || 'Pending Review'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="bg-white border-y border-r border-slate-200/50 rounded-r-3xl px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-blue-200 group-hover/row:bg-slate-50/20 transition-all">
                      <div className="flex items-center justify-end gap-2 flex-wrap w-full">
                        <a 
                          href={`/superadmin/superchat?roomId=${m.room_id}&user1=${m.sender_login_id}&user2=${m.room_id}&highlightId=${m._id}&fromAlerts=${filterType || 'all'}`}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 whitespace-nowrap shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200 shrink-0"
                        >
                          <Eye size={12} className="shrink-0" />
                          <span>View Chat</span>
                        </a>
                        {!m.isDecrypted && m.original_message_encrypted && (
                          <button 
                            onClick={() => handleDecryptMessage(m._id, idx)}
                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold border border-sky-100/50 shadow-sm transition-all active:scale-95 duration-200"
                          >
                            Decrypt
                          </button>
                        )}
                        <button 
                          onClick={() => handleResolveFlagged(m._id, 'action_taken')} 
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-105 text-emerald-700 border border-emerald-105 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 duration-200"
                        >
                          Confirm Action
                        </button>
                        <button 
                          onClick={() => handleResolveFlagged(m._id, 'false_positive')} 
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 duration-200"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "blocked" && (
          <div className="overflow-x-auto pb-4">
            <table className="w-full border-separate border-spacing-y-3.5 text-left text-sm">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 pb-1">Owner Profile</th>
                  <th className="px-6 pb-1">Contact Info</th>
                  <th className="px-6 pb-1">Block Reason / Violations</th>
                  <th className="px-6 pb-1">Blocked Date</th>
                  <th className="px-6 py-1">Status</th>
                  <th className="pl-6 pr-24 pb-1 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="bg-white border border-slate-200/60 rounded-3xl px-6 py-12 text-center text-slate-400 shadow-sm">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <span className="text-xs font-bold text-slate-400">Loading blocked owners...</span>
                      </div>
                    </td>
                  </tr>
                ) : blockedOwnersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bg-white border border-slate-200/60 rounded-3xl px-6 py-16 text-center text-slate-400 shadow-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                          <UserCheck size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700">No blocked owners found</p>
                          <p className="text-xs text-slate-400 mt-0.5">No owner accounts are currently suspended or blocked.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : blockedOwnersList.map((owner) => (
                  <tr key={owner._id} className="group/row transition-all duration-300 hover:-translate-y-0.5">
                    {/* Owner Profile */}
                    <td className="bg-white border-y border-l border-slate-200/50 rounded-l-3xl px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-red-200 group-hover/row:bg-red-50/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center text-rose-700 font-black text-xs uppercase border border-rose-200/50 shrink-0 shadow-sm">
                          {(owner.name || owner.loginId || "O").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-800 text-sm tracking-tight">{owner.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{owner.loginId}</div>
                        </div>
                      </div>
                    </td>
                    {/* Contact Info */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-red-200 group-hover/row:bg-red-50/10 transition-all text-xs">
                      <div className="font-bold text-slate-800">{owner.phone}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">{owner.email}</div>
                    </td>
                    {/* Block Reason */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-red-200 group-hover/row:bg-red-50/10 transition-all">
                      <div className="max-w-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-black uppercase tracking-wider shadow-sm mb-1.5">
                          <Lock size={9} />
                          {owner.violationsCount} Violation{owner.violationsCount !== 1 ? 's' : ''}
                        </span>
                        <p className="text-xs text-slate-600 italic line-clamp-2" title={owner.violationsSnippet}>
                          "{owner.violationsSnippet}"
                        </p>
                      </div>
                    </td>
                    {/* Timestamp */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-red-200 group-hover/row:bg-red-50/10 transition-all text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Clock size={12} className="text-slate-400" />
                        <span>{new Date(owner.blockedAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="bg-white border-y border-slate-200/50 px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-red-200 group-hover/row:bg-red-50/10 transition-all">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm bg-rose-50 text-rose-700 border-rose-200 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        ACCOUNT BLOCKED
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="bg-white border-y border-r border-slate-200/50 rounded-r-3xl px-6 py-5 shadow-sm shadow-slate-100/20 group-hover/row:border-red-200 group-hover/row:bg-red-50/10 transition-all">
                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <button
                          onClick={() => handleUnblockOwner(owner.loginId)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          <UserCheck size={14} />
                          <span>Unblock Account</span>
                        </button>
                        <a 
                          href={`/superadmin/superchat?search=${owner.loginId}&fromAlerts=blocked_owners`}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all"
                        >
                          <Eye size={12} />
                          <span>View Chat</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Dialog Modal */}
      {showActionModal && selectedViolation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-all duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 max-w-md w-full p-7 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                selectedAction === "send_warning" 
                  ? "bg-amber-50 text-amber-600 border-amber-100" 
                  : selectedAction === "restrict_chat" || selectedAction === "suspend_user"
                  ? "bg-rose-50 text-rose-600 border-rose-100 animate-bounce"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}>
                {selectedAction === "send_warning" ? (
                  <AlertTriangle size={22} />
                ) : selectedAction === "restrict_chat" || selectedAction === "suspend_user" ? (
                  <Lock size={22} />
                ) : (
                  <ShieldCheck size={22} />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 capitalize leading-none pt-1">
                  {selectedAction.replace('_', ' ')}
                </h3>
                <p className="text-xs text-slate-500">
                  Target: <strong className="text-slate-800 font-extrabold">{selectedViolation.participantName || selectedViolation.participantLoginId}</strong>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/85">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Violation Snippet</p>
              <p className="text-xs italic text-slate-600 mt-1.5 leading-relaxed">
                "{selectedViolation.messageSnippet}"
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Reason / Audit Logs</label>
              <textarea 
                rows={3}
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                placeholder="Enter description for moderation action log..." 
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl p-3.5 text-xs focus:ring-4 focus:ring-blue-500/5 outline-none placeholder:text-slate-400 font-medium transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowActionModal(false)}
                className="px-5 py-2.5 rounded-2xl text-xs font-black border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-800 transition-colors active:scale-95 duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdminAction}
                className={`px-5 py-2.5 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 duration-200 ${
                  selectedAction === "send_warning" 
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10" 
                    : selectedAction === "restrict_chat" || selectedAction === "suspend_user"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10"
                }`}
              >
                Execute Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
