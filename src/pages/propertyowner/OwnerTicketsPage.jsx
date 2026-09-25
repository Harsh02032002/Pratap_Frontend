import React, { useState, useEffect } from 'react';
import PropertyOwnerLayout from '../../components/propertyowner/PropertyOwnerLayout';
import { getOwnerSession } from '../../utils/ownerSession';
import { fetchJson, API_URL } from '../../utils/api';
import { 
  LifeBuoy, Plus, Search, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, Copy, Check, X, RefreshCw, Ticket, Sparkles,
  FileText, CreditCard, Camera, Wrench, MessageCircle, ShieldAlert,
  Building2, User, CheckCheck, Mail
} from 'lucide-react';

export default function OwnerTicketsPage() {
  const [owner] = useState(() => getOwnerSession() || {});
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

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
      if (res && res.success) setTickets(res.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, [owner?.loginId]);

  const handleCopyRef = (refId) => {
    navigator.clipboard.writeText(refId);
    setCopiedId(refId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
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
        setFormSuccess(`Ticket ${res.ticket?.ticket_id} created! Alerts sent via Email, WhatsApp & Push.`);
        setTimeout(() => {
          setShowRaiseModal(false);
          setFormData({ ticket_type: 'Property Edit Request', priority: 'Medium', subject: '', description: '', property_name: '', property_id: '' });
          setFormSuccess('');
          loadTickets();
        }, 1800);
      } else {
        setFormError(res?.message || 'Failed to create support ticket.');
      }
    } catch (err) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      case 'Completed': case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case 'In Progress': case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <AlertCircle className="w-3.5 h-3.5" /> Open
          </span>
        );
    }
  };

  const getPriorityDot = (priority) => {
    const map = { Critical: 'bg-red-500', High: 'bg-orange-400', Medium: 'bg-amber-400', Low: 'bg-slate-300' };
    return <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${map[priority] || 'bg-slate-300'}`} />;
  };

  const categoryIcons = {
    'Property Edit Request': <FileText className="w-4 h-4" />,
    'Room Photo Edit Request': <Camera className="w-4 h-4" />,
    'Payment / PayU Issue': <CreditCard className="w-4 h-4" />,
    'Owner Complaint': <ShieldAlert className="w-4 h-4" />,
    'Technical Issue': <Wrench className="w-4 h-4" />,
    'Other': <MessageCircle className="w-4 h-4" />
  };

  const stats = [
    { label: 'Total Tickets', value: tickets.length, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
    { label: 'Open', value: tickets.filter(t => t.status === 'Open').length, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-400' },
    { label: 'In Progress', value: tickets.filter(t => ['In Progress','Assigned'].includes(t.status)).length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
    { label: 'Resolved', value: tickets.filter(t => ['Completed','Resolved'].includes(t.status)).length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  ];

  return (
    <PropertyOwnerLayout owner={owner} title="Help & Support Desk">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .support-wrap * { font-family: 'Inter', sans-serif; }
        .ticket-row:hover .ticket-arrow { transform: translateX(3px); }
        .raise-btn { background: linear-gradient(135deg, #0FA89C 0%, #0d7a70 100%); }
        .raise-btn:hover { background: linear-gradient(135deg, #0d7a70 0%, #0a5e56 100%); }
        .hero-banner {
          background: linear-gradient(135deg, #f0fdf9 0%, #e6fffa 40%, #f0fdf4 100%);
          border: 1.5px solid #99f6e4;
        }
        .stat-card { transition: transform 0.15s, box-shadow 0.15s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
        .modal-overlay { animation: fadeIn 0.18s ease; }
        .modal-card { animation: popIn 0.2s cubic-bezier(.22,1,.36,1); }
        .drawer-panel { animation: slideIn 0.25s cubic-bezier(.22,1,.36,1); }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes popIn { from { opacity:0; transform: scale(0.94) } to { opacity:1; transform: scale(1) } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .timeline-dot { box-shadow: 0 0 0 3px white; }
      `}</style>

      <div className="support-wrap max-w-6xl mx-auto space-y-5">

        {/* ── Hero Banner (Light) ── */}
        <div className="hero-banner rounded-2xl p-6 md:p-8 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-teal-100/60 pointer-events-none" />
          <div className="absolute right-16 top-12 w-20 h-20 rounded-full bg-emerald-100/50 pointer-events-none" />
          <div className="absolute -left-4 -bottom-6 w-28 h-28 rounded-full bg-teal-50/80 pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-teal-200 shadow-sm flex items-center justify-center shrink-0">
                <LifeBuoy className="w-7 h-7 text-teal-600" />
              </div>
              <div>

                <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                  Support Desk & Ref ID Tracker
                </h1>
                <p className="text-slate-500 text-sm mt-1 max-w-xl">
                  Raise tickets for <span className="font-semibold text-slate-700">Property Edits, Payment Issues, or Complaints</span>. Track with your unique <span className="font-semibold text-teal-700">Ref ID</span>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRaiseModal(true)}
              className="raise-btn text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg hover:shadow-teal-200 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-5 h-5" /> Raise New Ticket
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`stat-card ${s.bg} border ${s.border} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
              </div>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ref ID, Subject or Property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-400 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Assigned">Assigned</option>
            <option value="Completed">Completed</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-400 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Property Edit Request">Property Edit</option>
            <option value="Room Photo Edit Request">Room Photo Edit</option>
            <option value="Payment / PayU Issue">Payment Issue</option>
            <option value="Owner Complaint">Complaint</option>
            <option value="Other">Other</option>
          </select>
          <button
            onClick={loadTickets}
            title="Refresh"
            className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* ── Tickets List ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-14 text-center">
              <div className="w-9 h-9 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-400">Loading your support tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-14 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No Tickets Found</h3>
              <p className="text-xs text-slate-400 mt-1">You haven't raised any support tickets yet.</p>
              <button
                onClick={() => setShowRaiseModal(true)}
                className="mt-5 inline-flex items-center gap-2 raise-btn text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
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
                  className="ticket-row p-4 md:p-5 hover:bg-slate-50/70 transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Category icon */}
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      {categoryIcons[ticket.ticket_type] || <MessageCircle className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {/* Ref ID */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopyRef(ticket.ticket_id); }}
                          className="flex items-center gap-1 font-mono text-[11px] font-black text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg hover:bg-teal-100 transition-colors"
                          title="Click to copy Ref ID"
                        >
                          {ticket.ticket_id}
                          {copiedId === ticket.ticket_id
                            ? <Check className="w-3 h-3 text-emerald-600" />
                            : <Copy className="w-3 h-3 text-teal-400" />}
                        </button>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                          {ticket.ticket_type}
                        </span>
                        {ticket.priority && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                            {getPriorityDot(ticket.priority)} {ticket.priority}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 truncate hover:text-teal-700 transition-colors">
                        {ticket.subject}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ticket.description}</p>
                      {ticket.property_name && (
                        <p className="text-[11px] text-teal-600 font-semibold mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {ticket.property_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      {getStatusBadge(ticket.status)}
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        {new Date(ticket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <ChevronRight className="ticket-arrow w-5 h-5 text-slate-300 transition-transform duration-150" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Raise Ticket ── */}
      {showRaiseModal && (
        <div className="modal-overlay fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="modal-card bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowRaiseModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Raise Support Ticket</h3>
                <p className="text-xs text-slate-400">Instant alerts via Email, WhatsApp & Push Notification</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleRaiseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ticket Category</label>
                <select
                  value={formData.ticket_type}
                  onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-400 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Property Edit Request">Property Edit Request</option>
                  <option value="Room Photo Edit Request">Room Photo Edit Request</option>
                  <option value="Payment / PayU Issue">Payment / PayU Issue</option>
                  <option value="Owner Complaint">General Complaint</option>
                  <option value="Other">Other Help Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <button
                      key={p} type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formData.priority === p
                          ? p === 'Critical' ? 'bg-red-500 border-red-500 text-white'
                            : p === 'High' ? 'bg-orange-400 border-orange-400 text-white'
                            : p === 'Medium' ? 'bg-amber-400 border-amber-400 text-white'
                            : 'bg-slate-400 border-slate-400 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >{p}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Property Name <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Koramangala Executive Stay"
                  value={formData.property_name}
                  onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  placeholder="Brief summary of your request..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue or requested edits in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-medium focus:outline-none focus:border-teal-400 focus:bg-white transition-all resize-none"
                  required
                />
              </div>

              <div className="pt-1 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="raise-btn text-white font-bold text-xs px-7 py-2.5 rounded-xl shadow-md disabled:opacity-70 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Submit Ticket</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Drawer: Ticket Detail ── */}
      {selectedTicket && (
        <div className="modal-overlay fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="drawer-panel bg-white max-w-md w-full h-full overflow-y-auto shadow-2xl">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
                  {selectedTicket.ticket_id}
                </span>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <h2 className="text-lg font-black text-slate-800">{selectedTicket.subject}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">{selectedTicket.ticket_type}</span>
                  {selectedTicket.priority && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      {getPriorityDot(selectedTicket.priority)} {selectedTicket.priority}
                    </span>
                  )}
                  {selectedTicket.property_name && (
                    <span className="text-[11px] font-semibold text-teal-600 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {selectedTicket.property_name}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Created: {new Date(selectedTicket.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Description */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Issue Description</p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{selectedTicket.description}</p>
              </div>

              {/* Assignment Info */}
              {selectedTicket.assigned_admin_name && (
                <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200">
                  <p className="text-[11px] font-bold text-sky-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Assigned To
                  </p>
                  <p className="text-xs font-semibold text-sky-800">{selectedTicket.assigned_admin_name}</p>
                </div>
              )}

              {/* Resolution Notes */}
              {selectedTicket.resolution_notes && (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" /> Resolution Notes
                  </p>
                  <p className="text-xs text-emerald-900 font-medium leading-relaxed">{selectedTicket.resolution_notes}</p>
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Activity & Tracking History</h3>
                <div className="relative pl-4 space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
                  {(selectedTicket.activity_log || []).map((log, idx) => (
                    <div key={idx} className="relative pl-5">
                      <div className="timeline-dot absolute -left-[1px] top-1 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white" />
                      <p className="text-xs font-bold text-slate-800">{log.action || 'Status Update'}</p>
                      {log.note && <p className="text-[11px] text-slate-500 mt-0.5">{log.note}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {log.performed_by_name && <span className="font-semibold">{log.performed_by_name} · </span>}
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
