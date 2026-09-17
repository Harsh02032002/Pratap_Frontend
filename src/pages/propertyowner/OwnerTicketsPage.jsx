import React, { useState, useEffect } from 'react';
import PropertyOwnerLayout from '../../components/propertyowner/PropertyOwnerLayout';
import { getOwnerSession } from '../../utils/ownerSession';
import { fetchJson, API_URL } from '../../utils/api';
import { 
  LifeBuoy, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, Copy, Check, MessageSquare, ShieldCheck, FileText, X, RefreshCw 
} from 'lucide-react';

export default function OwnerTicketsPage() {
  const [owner] = useState(() => getOwnerSession() || {});
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modal & Drawer states
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form inputs
  const [formData, setFormData] = useState({
    ticket_type: 'Property Edit Request',
    priority: 'Medium',
    subject: '',
    description: '',
    property_name: '',
    property_id: ''
  });

  const loadTickets = async () => {
    if (!owner?.loginId) return;
    setLoading(true);
    try {
      const res = await fetchJson(`${API_URL}/api/tickets/my-tickets?loginId=${encodeURIComponent(owner.loginId)}`);
      if (res && res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [owner?.loginId]);

  const handleCopyRef = (refId) => {
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.subject.trim() || !formData.description.trim()) {
      setFormError('Please enter both subject and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchJson(`${API_URL}/api/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          raised_by: owner.loginId,
          raised_by_name: owner.name || owner.loginId,
          raised_by_role: 'property_owner',
          user_email: owner.email || '',
          user_phone: owner.phone || owner.checkinPhone || '',
          owner_id: owner.loginId,
          owner_name: owner.name || owner.loginId
        })
      });

      if (res && res.success) {
        setFormSuccess(`Ticket ${res.ticket?.ticket_id} created successfully! Multi-channel alerts dispatched.`);
        setTimeout(() => {
          setShowRaiseModal(false);
          setFormData({
            ticket_type: 'Property Edit Request',
            priority: 'Medium',
            subject: '',
            description: '',
            property_name: '',
            property_id: ''
          });
          setFormSuccess('');
          loadTickets();
        }, 1800);
      } else {
        setFormError(res?.message || 'Failed to create support ticket.');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred while creating ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = 
      (t.ticket_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.property_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
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
    <PropertyOwnerLayout owner={owner} title="Help & Support Desk">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Title Banner ── */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-3">
                <LifeBuoy className="w-4 h-4" /> Help &amp; Support Ticket System
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Support Desk &amp; Ref ID Tracker
              </h1>
              <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
                Raise tickets for <strong>Property Edits, Room Photo Updates, Payment Issues, or Complaints</strong>. Track uncompressed history with your unique <strong>Ref ID</strong>.
              </p>
            </div>

            <button
              onClick={() => setShowRaiseModal(true)}
              className="bg-[#0FA89C] hover:bg-[#0b7a73] text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-lg hover:shadow-teal-500/30 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-5 h-5" /> Raise New Ticket
            </button>
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

        {/* ── Filter Bar & Search ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ref ID (e.g. TKT-849201), Subject or Property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-500"
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
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Categories</option>
              <option value="Property Edit Request">Property Edit Request</option>
              <option value="Room Photo Edit Request">Room Photo Edit Request</option>
              <option value="Payment / PayU Issue">Payment / PayU Issue</option>
              <option value="Owner Complaint">Owner Complaint</option>
              <option value="Other">Other</option>
            </select>

            <button
              onClick={loadTickets}
              title="Refresh Tickets"
              className="p-2.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Tickets Table / List ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold">Loading support tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No Support Tickets Found</h3>
              <p className="text-xs text-slate-400 mt-1">You haven't raised any support tickets yet.</p>
              <button
                onClick={() => setShowRaiseModal(true)}
                className="mt-4 inline-flex items-center gap-2 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-teal-700 transition-all"
              >
                <Plus className="w-4 h-4" /> Raise Your First Ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-5 hover:bg-slate-50/80 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Ref ID Badge */}
                    <div className="shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyRef(ticket.ticket_id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-mono text-xs font-bold transition-colors"
                        title="Click to copy Ref ID"
                      >
                        {ticket.ticket_id}
                        {copiedId === ticket.ticket_id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                          {ticket.ticket_type}
                        </span>
                        {ticket.property_name && (
                          <span className="text-[11px] font-medium text-teal-700 truncate">
                            🏢 {ticket.property_name}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 mt-1 group-hover:text-teal-600 transition-colors truncate">
                        {ticket.subject}
                      </h4>
                      
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {ticket.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      {getStatusBadge(ticket.status)}
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Modal: Raise Support Ticket ── */}
      {showRaiseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowRaiseModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Raise Support Ticket</h3>
                <p className="text-xs text-slate-400">Get a unique Ref ID &amp; instant alerts on Email, WhatsApp &amp; Push.</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
                ⚠️ {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold">
                ✅ {formSuccess}
              </div>
            )}

            <form onSubmit={handleRaiseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ticket Category</label>
                <select
                  value={formData.ticket_type}
                  onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="Property Edit Request">📝 Property Edit Request</option>
                  <option value="Room Photo Edit Request">🖼️ Room Photo Edit Request</option>
                  <option value="Payment / PayU Issue">💳 Payment / PayU / Razorpay Issue</option>
                  <option value="Owner Complaint">⚠️ General Complaint</option>
                  <option value="Other">💬 Other Help Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Property Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Koramangala Executive Stay"
                  value={formData.property_name}
                  onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of your request..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue or requested edits in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#0FA89C] hover:bg-[#0b7a73] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitting ? 'Creating Ticket...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Drawer: Ticket Details & Ref History ── */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white max-w-md w-full h-full p-6 overflow-y-auto shadow-2xl relative animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                    {selectedTicket.ticket_id}
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h2 className="text-lg font-bold text-slate-800 mt-3">{selectedTicket.subject}</h2>
                <p className="text-xs text-slate-400 mt-0.5">Category: {selectedTicket.ticket_type}</p>
              </div>

              {/* Description */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Description</p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Resolution Notes (if resolved) */}
              {selectedTicket.resolution_notes && (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">🟢 Resolution Notes</p>
                  <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                    {selectedTicket.resolution_notes}
                  </p>
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Activity &amp; Tracking History</h3>
                <div className="space-y-3 pl-2 border-l-2 border-slate-200 ml-2">
                  {(selectedTicket.activity_log || []).map((log, idx) => (
                    <div key={idx} className="relative pl-4">
                      <div className="absolute -left-[13px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-white" />
                      <p className="text-xs font-bold text-slate-800">{log.action || 'Status Update'}</p>
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
    </PropertyOwnerLayout>
  );
}
