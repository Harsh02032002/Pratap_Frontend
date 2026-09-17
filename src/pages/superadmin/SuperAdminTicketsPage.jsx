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
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Resolve Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveStatus, setResolveStatus] = useState('Resolved');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [resolveSuccess, setResolveSuccess] = useState('');
  const [copiedId, setCopiedId] = useState(null);

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
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {status}
          </span>
        );
      case 'In Progress':
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {status}
          </span>
        );
      case 'Open':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            Open
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Title Banner ── */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
              <LifeBuoy className="w-4 h-4" /> SuperAdmin &amp; Staff Ticket Control Desk
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Support Ticket Management &amp; Ref ID Tracker
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
              Search any ticket by <strong>Ref ID (e.g. TKT-849201)</strong>, review history, and mark tickets as <strong>Resolved / Completed</strong> with automated Email, WhatsApp &amp; Push Alerts.
            </p>
          </div>

          <button
            onClick={loadAllTickets}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Tickets
          </button>
        </div>

        {/* ── Ref ID Search Bar & Filters ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ref ID (e.g. TKT-849201), Name, Login ID, Phone or Subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
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
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
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

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{tickets.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Open</p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {tickets.filter(t => t.status === 'Open').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {tickets.filter(t => ['In Progress', 'Assigned'].includes(t.status)).length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Completed / Resolved</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {tickets.filter(t => ['Completed', 'Resolved'].includes(t.status)).length}
            </p>
          </div>
        </div>

        {/* ── Tickets Table ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs">Loading tickets database...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Tickets Found</h3>
              <p className="text-xs text-slate-400 mt-1">No support tickets match the search query or filter criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTickets.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTicket(t)}
                  className="p-5 hover:bg-slate-50 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Ref ID Badge */}
                    <div className="shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyRef(t.ticket_id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-mono text-xs font-bold transition-colors"
                        title="Click to copy Ref ID"
                      >
                        {t.ticket_id}
                        {copiedId === t.ticket_id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                          {t.ticket_type}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          Raiser: {t.raised_by_name} ({t.raised_by_role})
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 mt-1 group-hover:text-indigo-600 transition-colors truncate">
                        {t.subject}
                      </h4>
                      
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      {getStatusBadge(t.status)}
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <h2 className="text-lg font-bold text-slate-800 mt-3">{selectedTicket.subject}</h2>
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
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
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
              {['Open', 'In Progress', 'Assigned'].includes(selectedTicket.status) && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Resolve / Complete Ticket
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
                  <option value="Resolved">🟢 Resolved</option>
                  <option value="Completed">✅ Completed (For Property/Room Edits)</option>
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
