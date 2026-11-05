import React, { useState, useEffect } from 'react';
import { fetchJson, API_URL } from '../../utils/api';
import { 
  LifeBuoy, Search, Filter, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, Copy, Check, X, RefreshCw, Send, ShieldCheck, User, Building2 
} from 'lucide-react';

export default function SuperAdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Resolve Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveStatus, setResolveStatus] = useState('Resolved');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [resolveSuccess, setResolveSuccess] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);

  const handleSelectAllTickets = (e, list = []) => {
    if (e.target.checked) {
      setSelectedTicketIds(list.map(t => t._id));
    } else {
      setSelectedTicketIds([]);
    }
  };

  const handleSelectOneTicket = (id) => {
    setSelectedTicketIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkResolveTickets = async () => {
    if (selectedTicketIds.length === 0) return;
    if (!window.confirm(`Mark ${selectedTicketIds.length} tickets as Resolved?`)) return;
    try {
      const res = await fetchJson(`${API_URL}/api/tickets/bulk-resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: selectedTicketIds, status: 'Resolved' })
      });
      if (res?.success) {
        setSelectedTicketIds([]);
        loadAllTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDeleteTickets = async () => {
    if (selectedTicketIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedTicketIds.length} tickets?`)) return;
    try {
      const res = await fetchJson(`${API_URL}/api/tickets/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: selectedTicketIds })
      });
      if (res?.success) {
        setSelectedTicketIds([]);
        loadAllTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };


  const loadAllTickets = async () => {
    setLoading(true);
    try {
      const res = await fetchJson(`${API_URL}/api/tickets/all`);
      if (res && res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets for SuperAdmin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTickets();
  }, []);

  const handleCopyRef = (refId) => {
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setResolveError('');
    setResolveSuccess('');

    if (!resolutionNotes.trim()) {
      setResolveError('Please provide resolution notes for the ticket raiser.');
      return;
    }

    setIsResolving(true);
    try {
      const res = await fetchJson(`${API_URL}/api/tickets/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: selectedTicket.ticket_id,
          resolution_notes: resolutionNotes,
          status: resolveStatus,
          performed_by: 'SuperAdmin',
          performed_by_name: 'SuperAdmin / Employee'
        })
      });

      if (res && res.success) {
        setResolveSuccess(`Ticket ${selectedTicket.ticket_id} marked as ${resolveStatus}! Multi-channel alerts sent to ${selectedTicket.raised_by_name}.`);
        setTimeout(() => {
          setShowResolveModal(false);
          setResolutionNotes('');
          setResolveSuccess('');
          setSelectedTicket(null);
          loadAllTickets();
        }, 1800);
      } else {
        setResolveError(res?.message || 'Failed to resolve ticket.');
      }
    } catch (err) {
      setResolveError(err.message || 'An error occurred while resolving ticket.');
    } finally {
      setIsResolving(false);
    }
  };

  // Filter & Search
  const filteredTickets = tickets.filter((t) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      (t.ticket_id || '').toLowerCase().includes(query) ||
      (t.subject || '').toLowerCase().includes(query) ||
      (t.raised_by || '').toLowerCase().includes(query) ||
      (t.raised_by_name || '').toLowerCase().includes(query) ||
      (t.property_name || '').toLowerCase().includes(query) ||
      (t.user_email || '').toLowerCase().includes(query) ||
      (t.user_phone || '').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesType = typeFilter === 'all' || t.ticket_type === typeFilter;
    const raiserRole = String(t.raised_by_role || '').toLowerCase();
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'owner' && (raiserRole.includes('owner') || String(t.ticket_type || '').toLowerCase().includes('owner'))) ||
      (roleFilter === 'tenant' && (raiserRole.includes('tenant') || String(t.ticket_type || '').toLowerCase().includes('tenant')));
    return matchesSearch && matchesStatus && matchesType && matchesRole;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DDF3E4] text-[#14532D]">
            {status}
          </span>
        );
      case 'In Progress':
      case 'Assigned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDEBD0] text-[#7A3E00]">
            {status}
          </span>
        );
      case 'Open':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E0F2FE] text-[#0369A1]">
            Open
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif] text-[#10242A]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#10242A] tracking-tight leading-tight">
            Ticket System (Owner &amp; Tenant Raised Tickets)
          </h1>
          <p className="text-[13px] text-[#4A5961] mt-0.5">
            View and manage all tickets raised by Property Owners and Tenants. Search by Ref ID and mark tickets as Resolved / Completed.
          </p>
        </div>

        <button
          onClick={loadAllTickets}
          className="bg-white border border-[#CBD3D9] hover:bg-gray-50 text-[#10242A] font-semibold text-[13px] px-4 py-1.5 rounded-[8px] transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Tickets
        </button>
      </div>

      {/* Summary Stats (NO ICONS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", val: tickets.length },
          { label: "Open", val: tickets.filter(t => t.status === 'Open').length },
          { label: "In Progress", val: tickets.filter(t => ['In Progress', 'Assigned'].includes(t.status)).length },
          { label: "Completed / Resolved", val: tickets.filter(t => ['Completed', 'Resolved'].includes(t.status)).length },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs flex flex-col justify-between">
            <p className="text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider truncate">{c.label}</p>
            <div className="mt-2">
              <h3 className="text-[24px] font-bold text-[#10242A] tracking-tight leading-none">{loading ? "..." : c.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Ref ID Search Bar & Filters (Outside & Above the Table Card in a Single Line) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-[320px]">
          <Search className="w-4 h-4 text-[#708088] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Ref ID, Name, Login ID, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#CBD3D9] rounded-[8px] pl-9 pr-3.5 py-1.5 text-[13px] text-[#10242A] placeholder-[#8C9BA5] outline-none focus:border-[#0E7C86] shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedTicketIds.length > 0 && (
            <>
              <button
                onClick={handleBulkResolveTickets}
                className="bg-[#0E7C86] text-white px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold hover:bg-[#0B666E] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Bulk Resolve ({selectedTicketIds.length})
              </button>
              <button
                onClick={handleBulkDeleteTickets}
                className="bg-rose-600 text-white px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                Bulk Delete ({selectedTicketIds.length})
              </button>
            </>
          )}

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">All Raisers (Owner &amp; Tenant)</option>
            <option value="owner">Owner Raised Tickets</option>
            <option value="tenant">Tenant Raised Tickets</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-[#CBD3D9] rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#10242A] outline-none cursor-pointer focus:border-[#0E7C86] shadow-xs"
          >
            <option value="all">All Categories</option>
            <option value="Property Edit Request">Property Edit Request</option>
            <option value="Room Photo Edit Request">Room Photo Edit Request</option>
            <option value="Payment / PayU Issue">Payment / PayU Issue</option>
            <option value="Owner Complaint">Owner Complaint</option>
            <option value="Tenant Complaint">Tenant Complaint</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-[12px] p-4 border border-[#E1E6EA] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-[#E1E6EA]">
                <th className="pb-2 pl-2 w-8">
                  <input
                    type="checkbox"
                    checked={filteredTickets.length > 0 && selectedTicketIds.length === filteredTickets.length}
                    onChange={(e) => handleSelectAllTickets(e, filteredTickets)}
                    className="rounded border-[#CBD3D9] cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Ref ID</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Category</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Raiser</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Subject &amp; Description</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider">Status</th>
                <th className="pb-2 text-[12px] font-semibold text-[#4A5961] uppercase tracking-wider text-right pr-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F6] text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#4A5961] text-[13px]">Loading tickets database...</td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#4A5961] text-[13px]">No support tickets match the search query or filter criteria.</td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const isChecked = selectedTicketIds.includes(t._id);
                  return (
                    <tr
                      key={t._id}
                      onClick={() => setSelectedTicket(t)}
                      className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 pl-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOneTicket(t._id)}
                          className="rounded border-[#CBD3D9] cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyRef(t.ticket_id); }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#E6F4F5] hover:bg-[#D5ECEE] text-[#0E7C86] font-mono text-[12px] font-bold transition-colors cursor-pointer"
                          title="Click to copy Ref ID"
                        >
                          {t.ticket_id}
                          {copiedId === t.ticket_id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#0E7C86]" />}
                        </button>
                      </td>
                      <td className="py-2.5">
                        <span className="text-[11px] font-semibold text-[#4A5961] bg-[#E8EDF1] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {t.ticket_type}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-semibold text-[#10242A] text-[13px] block">{t.raised_by_name}</span>
                        <span className="text-[11px] text-[#708088]">{t.raised_by_role}</span>
                      </td>
                      <td className="py-2.5 max-w-xs">
                        <p className="font-semibold text-[#10242A] text-[13px] truncate">{t.subject}</p>
                        <p className="text-[11px] text-[#708088] truncate">{t.description}</p>
                      </td>
                      <td className="py-2.5">
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-[#4A5961] text-[12px] whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Drawer: Ticket Details & Action Panel ── */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white max-w-lg w-full h-full p-6 overflow-y-auto shadow-2xl relative animate-in slide-in-from-right duration-300">
            <button onClick={() => setSelectedTicket(null)} className="absolute top-5 right-5 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200">
                    {selectedTicket.ticket_id}
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h2 className="text-lg font-bold text-[#10242A] mt-3 break-words [overflow-wrap:anywhere]">{selectedTicket.subject}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Category: {selectedTicket.ticket_type}</p>
              </div>

              {/* Raiser Information */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5 text-xs">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">Raiser Metadata</p>
                <p><strong>Name:</strong> {selectedTicket.raised_by_name} ({selectedTicket.raised_by_role})</p>
                <p><strong>ID / Login:</strong> {selectedTicket.raised_by}</p>
                {selectedTicket.user_email && <p><strong>Email:</strong> {selectedTicket.user_email}</p>}
                {selectedTicket.user_phone && <p><strong>Phone:</strong> {selectedTicket.user_phone}</p>}
                {selectedTicket.property_name && <p><strong>Property:</strong> {selectedTicket.property_name}</p>}
              </div>

              {/* Description */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Description</p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Resolution Notes */}
              {selectedTicket.resolution_notes && (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">🟢 Resolution Notes</p>
                  <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                    {selectedTicket.resolution_notes}
                  </p>
                </div>
              )}

              {/* Action Button */}
              {['Open', 'In Progress', 'Assigned', 'Waiting For Response'].includes(selectedTicket.status) && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Update Status / Resolve Ticket
                </button>
              )}

              {/* Activity Timeline */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Activity Log &amp; History</h3>
                <div className="space-y-3 pl-2 border-l-2 border-slate-200 ml-2">
                  {(selectedTicket.activity_log || []).map((log, idx) => (
                    <div key={idx} className="relative pl-4">
                      <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
                      <p className="text-xs font-bold text-slate-800">{log.action || 'Update'}</p>
                      <p className="text-[11px] text-slate-500">{log.note || `By ${log.performed_by_name}`}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(log.at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Resolve Ticket ── */}
      {showResolveModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative">
            <button onClick={() => setShowResolveModal(false)} className="absolute top-5 right-5 text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Resolve Support Ticket</h3>
                <p className="text-xs text-slate-400">Ref ID: <strong className="text-emerald-700">{selectedTicket.ticket_id}</strong></p>
              </div>
            </div>

            {resolveError && <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-700 font-bold">{resolveError}</div>}
            {resolveSuccess && <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-xs text-emerald-800 font-bold">{resolveSuccess}</div>}

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Status</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800"
                >
                  <option value="In Progress">🔄 In Progress</option>
                  <option value="Waiting For Response">⏳ Waiting For Response</option>
                  <option value="Resolved">🟢 Resolved</option>
                  <option value="Completed">✅ Completed (For Property/Room Edits)</option>
                  <option value="Closed">🔒 Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resolution Notes (Sent to Raiser)</label>
                <textarea
                  rows={4}
                  placeholder="Explain how the issue was resolved or completed..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2.5 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md disabled:opacity-70 flex items-center gap-2"
                >
                  {isResolving ? 'Resolving...' : 'Mark Resolved & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
