import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/superadmin/PageHeader";
import { fetchJson } from "../../utils/api";
import { toast } from "react-hot-toast";
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, UserX, MessageSquare, 
  Eye, RefreshCw, MoreVertical, Ban, Trash2, Mail, ShieldCheck, 
  HelpCircle, UserCheck, Play, ArrowRight, Info, Clock, Lock, 
  PhoneCall, DollarSign, CreditCard, ExternalLink, X, Loader2
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

  const [unblockConfirmId, setUnblockConfirmId] = useState(null);
  const [unblocking, setUnblocking] = useState(false);

  const handleUnblockOwner = (loginId) => {
    setUnblockConfirmId(loginId);
  };

  const confirmUnblockOwner = async () => {
    if (!unblockConfirmId) return;
    try {
      setUnblocking(true);
      const res = await fetchJson(`/api/chat/admin/blocked-owners/${unblockConfirmId}/unblock`, { method: "POST" });
      if (res.success) {
        toast.success(`Owner ${unblockConfirmId} unblocked successfully!`);
        setUnblockConfirmId(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.message || "Failed to unblock owner");
    } finally {
      setUnblocking(false);
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
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">Moderation & Alerts</h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">Review chat violations, spam attempts, and offline settlement warnings.</p>
        </div>
        <button 
          onClick={loadData} 
          className="bg-white hover:bg-[#F4F6F8] text-[#10242A] border border-[#CBD3D9] px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold shadow-xs shrink-0 flex items-center gap-2 transition-all cursor-pointer w-fit self-end sm:self-auto"
        >
          <RefreshCw size={14} className={`text-[#4A5961] ${loading ? "animate-spin text-[#0E7C86]" : ""}`} /> 
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Analytics Metric Bar (NO ICONS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Contact Sharing */}
        <div 
          onClick={() => handleFilterChange("contact_sharing")}
          className={`bg-white rounded-[12px] p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            filterType === "contact_sharing" 
              ? "border-[#095256] ring-1 ring-[#095256]/20" 
              : "border-[#E1E6EA] hover:border-[#CBD3D9]"
          }`}
        >
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Contact Sharing Attempts</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{analytics.contactSharingAttempts}</h3>
          </div>
        </div>

        {/* Commission Bypass */}
        <div 
          onClick={() => handleFilterChange("commission_bypass")}
          className={`bg-white rounded-[12px] p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            filterType === "commission_bypass" 
              ? "border-[#095256] ring-1 ring-[#095256]/20" 
              : "border-[#E1E6EA] hover:border-[#CBD3D9]"
          }`}
        >
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Commission Bypass Attempts</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{analytics.commissionBypassAttempts}</h3>
          </div>
        </div>

        {/* External Settlement */}
        <div 
          onClick={() => handleFilterChange("external_settlement")}
          className={`bg-white rounded-[12px] p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            filterType === "external_settlement" 
              ? "border-[#095256] ring-1 ring-[#095256]/20" 
              : "border-[#E1E6EA] hover:border-[#CBD3D9]"
          }`}
        >
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">External Settlement Attempts</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{analytics.externalSettlementAttempts}</h3>
          </div>
        </div>

        {/* Repeated Violators */}
        <div 
          onClick={() => handleFilterChange("repeated_violators")}
          className={`bg-white rounded-[12px] p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            filterType === "repeated_violators" 
              ? "border-[#095256] ring-1 ring-[#095256]/20" 
              : "border-[#E1E6EA] hover:border-[#CBD3D9]"
          }`}
        >
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Repeated Violators</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{analytics.repeatedViolators}</h3>
          </div>
        </div>

        {/* Blocked Owners */}
        <div 
          onClick={() => handleFilterChange("blocked_owners")}
          className={`bg-white rounded-[12px] p-4 border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
            filterType === "blocked_owners" 
              ? "border-[#095256] ring-1 ring-[#095256]/20" 
              : "border-[#E1E6EA] hover:border-[#CBD3D9]"
          }`}
        >
          <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">Blocked Owners</p>
          <div className="mt-2">
            <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{analytics.blockedOwnersCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter & Tab Row (Outside & Above Table Card) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="logs">Violation Logs ({getFilteredViolations().length})</option>
            <option value="flagged">Flagged Conversations ({getFilteredFlagged().length})</option>
            <option value="blocked">Blocked Owners ({blockedOwnersList.length})</option>
          </select>

          <select
            value={filterType || ""}
            onChange={(e) => handleFilterChange(e.target.value || null)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="">All Alert Types</option>
            <option value="contact_sharing">Contact Sharing Attempts</option>
            <option value="commission_bypass">Commission Bypass Attempts</option>
            <option value="external_settlement">External Settlement Attempts</option>
            <option value="repeated_violators">Repeated Violators</option>
            <option value="blocked_owners">Blocked Owners</option>
          </select>

          {filterType && (
            <button 
              onClick={() => handleFilterChange(null)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-[#CBD3D9] p-1 rounded-[8px] shadow-xs">
          <button 
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === "logs" 
                ? "bg-[#095256] text-white" 
                : "text-[#4A5961] hover:text-[#10242A]"
            }`}
          >
            Violation Logs ({getFilteredViolations().length})
          </button>
          <button 
            onClick={() => setActiveTab("flagged")}
            className={`px-3 py-1 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === "flagged" 
                ? "bg-[#095256] text-white" 
                : "text-[#4A5961] hover:text-[#10242A]"
            }`}
          >
            Flagged ({getFilteredFlagged().length})
          </button>
          <button 
            onClick={() => setActiveTab("blocked")}
            className={`px-3 py-1 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === "blocked" 
                ? "bg-[#095256] text-white" 
                : "text-[#4A5961] hover:text-[#10242A]"
            }`}
          >
            Blocked Owners ({blockedOwnersList.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        {activeTab === "logs" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 pr-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Offender</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Participant Flow</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Violation Details</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Timestamp</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                  <th className="pb-2 pl-4 text-right text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#4A5961]">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={20} className="animate-spin text-[#0E7C86]" />
                        <span className="text-[12px] font-semibold text-[#4A5961]">Loading violations...</span>
                      </div>
                    </td>
                  </tr>
                ) : getFilteredViolations().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#4A5961]">
                      <p className="text-[13px] font-semibold text-[#10242A]">No violations logged yet</p>
                      <p className="text-[12px] text-[#4A5961] mt-0.5">Everything looks quiet on the security logs.</p>
                    </td>
                  </tr>
                ) : getFilteredViolations().map(v => (
                  <tr key={v._id} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Offender */}
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E6F4F5] flex items-center justify-center text-[#0E7C86] font-bold text-[11px] uppercase shrink-0">
                          {(v.participantName || v.participantLoginId || "U").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-[#10242A] text-[13px]">{v.participantName || v.participantLoginId}</div>
                          <div className="text-[11px] text-[#4A5961] font-mono mt-0.5">{v.participantLoginId}</div>
                        </div>
                      </div>
                    </td>
                    {/* Participant Flow */}
                    <td className="py-2.5 px-4">
                      <div className="max-w-xs">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold flex-wrap">
                          <span className="bg-[#F4F6F8] text-[#10242A] px-2 py-0.5 rounded-[4px] border border-[#E1E6EA]">
                            Owner: {v.ownerName || "Owner"}
                          </span>
                          <ArrowRight size={11} className="text-[#8C9BA5] shrink-0" />
                          <span className="bg-[#E6F4F5] text-[#0E7C86] px-2 py-0.5 rounded-[4px]">
                            Tenant: {v.tenantName || "Tenant"}
                          </span>
                        </div>
                        {v.conversationContext && (
                          <div className="text-[11px] text-[#4A5961] mt-1">
                            <span className="font-semibold text-[#10242A]">Context:</span> {v.conversationContext}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Violation Details */}
                    <td className="py-2.5 px-4">
                      <div className="max-w-xs">
                        <div className="mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                            v.violationType === "commission_bypass" 
                              ? "bg-rose-50 text-rose-700 border-rose-100" 
                              : v.violationType === "contact_sharing" 
                              ? "bg-blue-50 text-blue-700 border-blue-100" 
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            {formatViolationType(v.violationType)}
                          </span>
                        </div>
                        <p className="italic text-[12px] text-[#4A5961] line-clamp-2" title={v.messageSnippet}>
                          "{v.messageSnippet}"
                        </p>
                      </div>
                    </td>
                    {/* Timestamp */}
                    <td className="py-2.5 px-4">
                      <div className="text-[12px] text-[#10242A] font-medium">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-[#4A5961] mt-0.5">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                        v.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        v.status === 'Warning Sent' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        v.status === 'Reviewed' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                        'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-2.5 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a 
                          href={`/superadmin/superchat?roomId=${v.ownerId}&user1=${v.ownerId}&user2=${v.tenantId}${v.messageId ? `&highlightId=${v.messageId}` : ''}&fromAlerts=${filterType || 'all'}`}
                          className="px-2.5 py-1 bg-[#095256] hover:bg-[#073E42] text-white rounded-[6px] text-[12px] font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap transition-all shrink-0"
                        >
                          <Eye size={12} className="shrink-0" />
                          <span>View Chat</span>
                        </a>
                        <div className="relative group">
                          <button className="p-1.5 hover:bg-[#F4F6F8] rounded-[6px] transition-all text-[#4A5961] hover:text-[#10242A] border border-[#CBD3D9]">
                            <MoreVertical size={14} />
                          </button>
                          <div className="absolute right-0 bottom-full z-50 mb-1 hidden group-hover:block bg-white border border-[#E1E6EA] rounded-[10px] shadow-lg p-1.5 min-w-[160px] text-left">
                            <button onClick={() => openActionModal(v, "mark_reviewed")} className="w-full text-left px-3 py-2 text-[12px] font-medium hover:bg-[#F4F6F8] rounded-[6px] text-[#10242A] flex items-center gap-2 transition-colors">
                              <ShieldCheck size={13} className="text-sky-500" />
                              <span>Mark Reviewed</span>
                            </button>
                            <button onClick={() => openActionModal(v, "send_warning")} className="w-full text-left px-3 py-2 text-[12px] font-medium hover:bg-[#F4F6F8] rounded-[6px] text-amber-600 flex items-center gap-2 transition-colors">
                              <AlertTriangle size={13} className="text-amber-500" />
                              <span>Send Warning</span>
                            </button>
                            <button onClick={() => openActionModal(v, "restrict_chat")} className="w-full text-left px-3 py-2 text-[12px] font-medium hover:bg-[#F4F6F8] rounded-[6px] text-rose-600 flex items-center gap-2 transition-colors">
                              <Lock size={13} className="text-rose-500" />
                              <span>Restrict Chat (24h)</span>
                            </button>
                            <button onClick={() => openActionModal(v, "suspend_user")} className="w-full text-left px-3 py-2 text-[12px] font-medium hover:bg-[#F4F6F8] rounded-[6px] text-red-700 flex items-center gap-2 transition-colors">
                              <UserX size={13} className="text-red-650" />
                              <span>Suspend User</span>
                            </button>
                            <button onClick={() => openActionModal(v, "mark_resolved")} className="w-full text-left px-3 py-2 text-[12px] font-medium hover:bg-[#F4F6F8] rounded-[6px] text-emerald-600 flex items-center gap-2 transition-colors">
                              <CheckCircle2 size={13} className="text-emerald-500" />
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 pr-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Sender</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Room ID</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Violation Details</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Timestamp</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Moderation Status</th>
                  <th className="pb-2 pl-4 text-right text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#4A5961]">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={20} className="animate-spin text-[#0E7C86]" />
                        <span className="text-[12px] font-semibold text-[#4A5961]">Loading flagged messages...</span>
                      </div>
                    </td>
                  </tr>
                ) : getFilteredFlagged().length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#4A5961]">
                      <p className="text-[13px] font-semibold text-[#10242A]">No flagged messages found</p>
                      <p className="text-[12px] text-[#4A5961] mt-0.5">Everything looks clear on flagged scans.</p>
                    </td>
                  </tr>
                ) : getFilteredFlagged().map((m, idx) => (
                  <tr key={m._id} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Sender */}
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E6F4F5] flex items-center justify-center text-[#0E7C86] font-bold text-[11px] uppercase shrink-0">
                          {(m.sender_name || m.sender_login_id || "U").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-[#10242A] text-[13px]">{m.sender_name || m.sender_login_id}</div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-[4px] text-[10px] bg-[#F4F6F8] text-[#4A5961] font-semibold uppercase">
                            {m.sender_role}
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Room ID */}
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-[#10242A] text-[12px] font-mono bg-[#F4F6F8] border border-[#E1E6EA] px-2 py-0.5 rounded-[4px] w-fit">
                        {m.room_id}
                      </div>
                    </td>
                    {/* Violation Details */}
                    <td className="py-2.5 px-4">
                      <div className="max-w-xs">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-semibold uppercase tracking-wider">
                            {formatViolationType(m.violation_type)}
                          </span>
                          {m.is_blocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border-rose-100 text-[10px] font-semibold uppercase tracking-wider">
                              Blocked
                            </span>
                          )}
                        </div>
                        <p className="italic text-[12px] text-[#4A5961] break-words">
                          "{m.message}"
                        </p>
                      </div>
                    </td>
                    {/* Timestamp */}
                    <td className="py-2.5 px-4">
                      <div className="text-[12px] text-[#10242A] font-medium">
                        {new Date(m.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-[#4A5961] mt-0.5">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    {/* Moderation Status */}
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                        m.moderation_status === 'action_taken' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        m.moderation_status === 'false_positive' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {m.moderation_status || 'Pending Review'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-2.5 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <a 
                          href={`/superadmin/superchat?roomId=${m.room_id}&user1=${m.sender_login_id}&user2=${m.room_id}&highlightId=${m._id}&fromAlerts=${filterType || 'all'}`}
                          className="px-2.5 py-1 bg-[#095256] hover:bg-[#073E42] text-white rounded-[6px] text-[12px] font-semibold inline-flex items-center justify-center gap-1 whitespace-nowrap transition-all shrink-0"
                        >
                          <Eye size={12} className="shrink-0" />
                          <span>View Chat</span>
                        </a>
                        {!m.isDecrypted && m.original_message_encrypted && (
                          <button 
                            onClick={() => handleDecryptMessage(m._id, idx)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-[6px] text-[12px] font-semibold border border-sky-200 transition-all cursor-pointer"
                          >
                            Decrypt
                          </button>
                        )}
                        <button 
                          onClick={() => handleResolveFlagged(m._id, 'action_taken')} 
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer"
                        >
                          Confirm Action
                        </button>
                        <button 
                          onClick={() => handleResolveFlagged(m._id, 'false_positive')} 
                          className="px-2.5 py-1 bg-white hover:bg-[#F4F6F8] text-[#4A5961] border border-[#CBD3D9] rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E6EA]">
                  <th className="pb-2 pr-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Owner Profile</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Contact Info</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Block Reason / Violations</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Blocked Date</th>
                  <th className="pb-2 px-4 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                  <th className="pb-2 pl-4 text-right text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#4A5961]">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={20} className="animate-spin text-[#0E7C86]" />
                        <span className="text-[12px] font-semibold text-[#4A5961]">Loading blocked owners...</span>
                      </div>
                    </td>
                  </tr>
                ) : blockedOwnersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#4A5961]">
                      <p className="text-[13px] font-semibold text-[#10242A]">No blocked owners found</p>
                      <p className="text-[12px] text-[#4A5961] mt-0.5">No owner accounts are currently suspended or blocked.</p>
                    </td>
                  </tr>
                ) : blockedOwnersList.map((owner) => (
                  <tr key={owner._id} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Owner Profile */}
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-700 font-bold text-[11px] uppercase border border-rose-200 shrink-0">
                          {(owner.name || owner.loginId || "O").slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-[#10242A] text-[13px]">{owner.name}</div>
                          <div className="text-[11px] text-[#4A5961] font-mono mt-0.5">{owner.loginId}</div>
                        </div>
                      </div>
                    </td>
                    {/* Contact Info */}
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-[#10242A] text-[13px]">{owner.phone}</div>
                      <div className="text-[11px] text-[#4A5961] mt-0.5">{owner.email}</div>
                    </td>
                    {/* Block Reason */}
                    <td className="py-2.5 px-4">
                      <div className="max-w-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-semibold uppercase tracking-wider mb-1">
                          {owner.violationsCount} Violation{owner.violationsCount !== 1 ? 's' : ''}
                        </span>
                        <p className="text-[12px] text-[#4A5961] italic line-clamp-2" title={owner.violationsSnippet}>
                          "{owner.violationsSnippet}"
                        </p>
                      </div>
                    </td>
                    {/* Timestamp */}
                    <td className="py-2.5 px-4">
                      <div className="text-[12px] text-[#10242A] font-medium">
                        {new Date(owner.blockedAt).toLocaleDateString()}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border bg-rose-50 text-rose-700 border-rose-200">
                        ACCOUNT BLOCKED
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-2.5 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <button
                          onClick={() => handleUnblockOwner(owner.loginId)}
                          className="px-2.5 py-1 bg-[#095256] hover:bg-[#073E42] text-white rounded-[6px] text-[12px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <UserCheck size={12} />
                          <span>Unblock</span>
                        </button>
                        <a 
                          href={`/superadmin/superchat?search=${owner.loginId}&fromAlerts=blocked_owners`}
                          className="px-2.5 py-1 bg-white hover:bg-[#F4F6F8] text-[#10242A] border border-[#CBD3D9] rounded-[6px] text-[12px] font-semibold inline-flex items-center gap-1 transition-all"
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

      {/* Unblock Account Confirmation Modal */}
      {unblockConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setUnblockConfirmId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded-full"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <UserCheck size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                  Confirmation Needed
                </span>
                <h3 className="font-serif text-[20px] font-bold text-slate-900 dark:text-white mt-1">Unblock Owner Account</h3>
              </div>
            </div>

            <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Are you sure you want to unblock owner <strong className="text-slate-900 dark:text-white">{unblockConfirmId}</strong>? This will restore their chat privileges and reactivate their account on Roomhy.
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                onClick={() => setUnblockConfirmId(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnblockOwner}
                disabled={unblocking}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {unblocking ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
                <span>Confirm Unblock</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
